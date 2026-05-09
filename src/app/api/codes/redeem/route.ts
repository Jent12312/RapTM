// src/app/api/codes/redeem/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import bcrypt from 'bcryptjs';

// Хранилище попыток в памяти (для production лучше использовать Redis)
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Введите код' }, { status: 400 });
    }

    const userId = authUser.userId;

    // Проверка на блокировку (защита от brute force)
    const userAttempts = failedAttempts.get(userId);
    if (userAttempts && userAttempts.count >= 3) {
      const now = Date.now();
      if (now < userAttempts.lockedUntil) {
        const minutesLeft = Math.ceil((userAttempts.lockedUntil - now) / 60000);
        return NextResponse.json(
          { error: `Слишком много неудачных попыток. Попробуйте через ${minutesLeft} мин` },
          { status: 429 }
        );
      } else {
        failedAttempts.delete(userId);
      }
    }

    // Парсим код: TM-USDT-500-KEY-SECRET
    const parts = code.trim().split('-');
    if (parts.length < 5) {
      return NextResponse.json({ error: 'Неверный формат кода' }, { status: 400 });
    }

    const key = parts[3]; // KEY

    // Используем транзакцию для защиты от Double Spending
    const result = await prisma.$transaction(async (tx) => {
      // 1. Находим код по ключу
      const codeRecord = await tx.code.findUnique({
        where: { code: key },
        include: { creator: true }
      });

      if (!codeRecord) {
        throw new Error('Код не найден');
      }

      // 2. Сравниваем хеш
      const isValid = await bcrypt.compare(code.trim(), codeRecord.codeHash);
      if (!isValid) {
        // Записываем неудачную попытку
        const current = failedAttempts.get(userId) || { count: 0, lockedUntil: 0 };
        const newCount = current.count + 1;
        failedAttempts.set(userId, {
          count: newCount,
          lockedUntil: newCount >= 3 ? Date.now() + 30 * 60 * 1000 : 0 // 30 мин блокировки
        });
        throw new Error('Неверный код');
      }

      // 3. Проверяем статус
      if (codeRecord.status !== 'ACTIVE') {
        const statusMessages: Record<string, string> = {
          USED: 'Код уже был использован',
          EXPIRED: 'Срок действия кода истек',
          CANCELLED: 'Код был отменен'
        };
        throw new Error(statusMessages[codeRecord.status] || 'Код недействителен');
      }

      // 4. Проверяем срок действия
      if (new Date() > codeRecord.expiresAt) {
        await tx.code.update({
          where: { id: codeRecord.id },
          data: { status: 'EXPIRED' }
        });
        throw new Error('Срок действия кода истек');
      }

      // 5. Проверяем, не активирует ли пользователь свой собственный код
      if (codeRecord.creatorId === userId) {
        throw new Error('Нельзя активировать собственный код');
      }

      // 6. Помечаем код как использованный
      const updatedCode = await tx.code.update({
        where: { id: codeRecord.id },
        data: {
          status: 'USED',
          redeemerId: userId,
          usedAt: new Date()
        }
      });

      // 7. Начисляем баланс пользователю
      const balanceField = codeRecord.currency === 'USDT' ? 'usdtBalance' : 'tmtBalance';
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          [balanceField]: {
            increment: codeRecord.amount
          }
        }
      });

      // 8. Создаем транзакцию пополнения
      await tx.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          method: 'CODE',
          amount: codeRecord.amount,
          asset: codeRecord.currency,
          status: 'COMPLETED',
          code: `TM-${codeRecord.currency}-${codeRecord.amount}-${key}-****`
        }
      });

      // Успех - сбрасываем счетчик неудачных попыток
      failedAttempts.delete(userId);

      return { code: updatedCode, wallet: updatedWallet, creator: codeRecord.creator, key };
    });

    // Уведомление создателю кода
    try {
      if (result.creator?.tgChatId) {
        const msg = `✅ Ваш код на ${result.code.amount} ${result.code.currency} был активирован!\n\nID: ${result.key}`;
        await fetch(`${process.env.TELEGRAM_BOT_API}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: result.creator.tgChatId, text: msg })
        });
      }
    } catch (e) {
      console.log('Notification failed');
    }

    return NextResponse.json({
      success: true,
      message: `Деньги зачислены!`,
      amount: result.code.amount,
      currency: result.code.currency,
      balance: Number(result.wallet[result.code.currency === 'USDT' ? 'usdtBalance' : 'tmtBalance'])
    });
  } catch (error: any) {
    console.error('Redeem code error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка активации кода' },
      { status: 400 }
    );
  }
}

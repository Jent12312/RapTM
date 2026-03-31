// src/app/api/codes/redeem/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHash } from 'crypto';

function hashCode(code: string): string {
  return createHash('sha256').update(code + process.env.CODE_SALT || 'default-salt').digest('hex');
}

// Хранилище попыток в памяти (для production лучше использовать Redis)
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'Некорректные данные' },
        { status: 400 }
      );
    }

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
        // Сброс блокировки
        failedAttempts.delete(userId);
      }
    }

    // Хешируем введенный код для поиска в БД
    const codeHash = hashCode(code.trim().toUpperCase());

    // Используем транзакцию для защиты от Double Spending
    const result = await prisma.$transaction(async (tx) => {
      // 1. Находим код и блокируем строку (FOR UPDATE эмуляция через transaction)
      const codeRecord = await tx.code.findUnique({
        where: { codeHash },
        include: { creator: true, redeemer: true }
      });

      if (!codeRecord) {
        // Записываем неудачную попытку
        const current = failedAttempts.get(userId) || { count: 0, lockedUntil: 0 };
        failedAttempts.set(userId, {
          count: current.count + 1,
          lockedUntil: current.count >= 2 ? Date.now() + 60 * 60 * 1000 : 0 // 1 час блокировки после 3 попыток
        });
        throw new Error('Код не найден');
      }

      // 2. Проверяем статус
      if (codeRecord.status !== 'ACTIVE') {
        if (codeRecord.status === 'USED') {
          throw new Error('Код уже был использован');
        } else if (codeRecord.status === 'EXPIRED') {
          throw new Error('Срок действия кода истек');
        } else if (codeRecord.status === 'CANCELLED') {
          throw new Error('Код был отменен');
        }
      }

      // 3. Проверяем срок действия
      if (new Date() > codeRecord.expiresAt) {
        await tx.code.update({
          where: { id: codeRecord.id },
          data: { status: 'EXPIRED' }
        });
        throw new Error('Срок действия кода истек');
      }

      // 4. Проверяем, не активирует ли пользователь свой собственный код
      if (codeRecord.creatorId === userId) {
        throw new Error('Нельзя активировать собственный код');
      }

      // 5. Помечаем код как использованный
      const updatedCode = await tx.code.update({
        where: { id: codeRecord.id },
        data: {
          status: 'USED',
          redeemerId: userId,
          usedAt: new Date()
        }
      });

      // 6. Начисляем баланс пользователю
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          [codeRecord.currency === 'USDT' ? 'usdtBalance' : 'tmtBalance']: {
            increment: codeRecord.amount
          }
        }
      });

      // Успех - сбрасываем счетчик неудачных попыток
      failedAttempts.delete(userId);

      return { code: updatedCode, wallet: updatedWallet, creator: codeRecord.creator };
    });

    // Уведомление создателю кода (если Telegram подключен)
    try {
      if (result.creator?.tgChatId) {
        const msg = `✅ Ваш код на ${result.code.amount} ${result.code.currency} был активирован!\n\nКод: ${code.slice(0, 8)}...`;

        await fetch(`${process.env.TELEGRAM_BOT_API}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: result.creator.tgChatId,
            text: msg
          })
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
      balance: result.code.currency === 'USDT' 
        ? result.wallet.usdtBalance 
        : result.wallet.tmtBalance
    });
  } catch (error: any) {
    console.error('Redeem code error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка активации кода' },
      { status: 400 }
    );
  }
}

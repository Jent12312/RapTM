// src/app/api/codes/generate/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Генерация уникального кода формата: TM-USDT-500-KEY-SECRET
// KEY (6 символов) хранится открыто для поиска
// SECRET (10 символов) хешируется
function generateRawCodeParts() {
  const key = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  const secret = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
  return { key, secret };
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { amount, currency = 'USDT' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Некорректная сумма' },
        { status: 400 }
      );
    }

    // Получаем пользователя и его уровень
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'Пользователь или кошелек не найден' }, { status: 404 });
    }

    // Комиссия 0.2% только для партнеров
    const feePercent = user.level === 'Partner' ? 0.2 : 0.0;
    const fee = amount * (feePercent / 100);
    const totalDeduction = amount + fee;

    const balanceField = currency === 'USDT' ? 'usdtBalance' : 'tmtBalance';
    const currentBalance = Number(user.wallet[balanceField as keyof typeof user.wallet]);

    if (currentBalance < totalDeduction) {
      return NextResponse.json(
        { error: `Недостаточно средств. Нужно: ${totalDeduction.toFixed(2)} ${currency} (включая комиссию ${fee.toFixed(2)})` },
        { status: 400 }
      );
    }

    // Генерируем код
    let { key, secret } = generateRawCodeParts();
    const fullCode = `TM-${currency}-${amount}-${key}-${secret}`;
    
    // Проверяем уникальность ключа
    let existing = await prisma.code.findUnique({
      where: { code: key }
    });
    
    let attempts = 0;
    while (existing && attempts < 10) {
      const parts = generateRawCodeParts();
      key = parts.key;
      secret = parts.secret;
      existing = await prisma.code.findUnique({ where: { code: key } });
      attempts++;
    }

    if (existing) {
      return NextResponse.json({ error: 'Не удалось сгенерировать уникальный код' }, { status: 500 });
    }

    // Хешируем полный код
    const codeHash = await bcrypt.hash(fullCode, 10);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Создаем код в транзакции
    const [updatedWallet, newCode] = await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: authUser.userId },
        data: { [balanceField]: { decrement: totalDeduction } }
      }),
      
      prisma.code.create({
        data: {
          code: key, // Сохраняем только ключ для поиска
          codeHash,
          amount,
          currency,
          fee,
          status: 'ACTIVE',
          creatorId: authUser.userId,
          expiresAt
        }
      }),

      prisma.transaction.create({
        data: {
          userId: authUser.userId,
          type: 'WITHDRAWAL',
          method: 'CODE',
          amount,
          fee,
          asset: currency,
          status: 'COMPLETED',
          code: `TM-${currency}-${amount}-${key}-****` // Маскируем в истории транзакций
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      code: fullCode, // Возвращаем полный код пользователю ОДИН РАЗ
      amount: newCode.amount,
      currency: newCode.currency,
      fee: newCode.fee,
      expiresAt: newCode.expiresAt,
      balance: Number(updatedWallet[balanceField as keyof typeof updatedWallet])
    });
  } catch (error) {
    console.error('Generate code error:', error);
    return NextResponse.json({ error: 'Ошибка при создании кода' }, { status: 500 });
  }
}


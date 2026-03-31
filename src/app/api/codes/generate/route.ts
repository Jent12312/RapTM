// src/app/api/codes/generate/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHash } from 'crypto';

// Генерация уникального кода формата: TM-USDT-500-A7B8-C9D1-E2F3
function generateCode(amount: number, currency: string): string {
  const randomPart = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  };
  
  const parts = [
    'TM',
    currency,
    Math.floor(amount).toString(),
    randomPart(),
    randomPart(),
    randomPart()
  ];
  
  return parts.join('-');
}

// Хеширование кода для хранения в БД
function hashCode(code: string): string {
  return createHash('sha256').update(code + process.env.CODE_SALT || 'default-salt').digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, amount, currency = 'USDT', feePercent = 1 } = body;

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Некорректные данные' },
        { status: 400 }
      );
    }

    // Проверяем баланс пользователя
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Кошелек не найден' }, { status: 404 });
    }

    const fee = amount * (feePercent / 100);
    const totalDeduction = amount + fee;

    if (currency === 'USDT') {
      if (wallet.usdtBalance < totalDeduction) {
        return NextResponse.json(
          { error: `Недостаточно ${currency}. Нужно: ${totalDeduction} (включая комиссию ${fee})` },
          { status: 400 }
        );
      }
    } else if (currency === 'TMT') {
      if (wallet.tmtBalance < totalDeduction) {
        return NextResponse.json(
          { error: `Недостаточно ${currency}. Нужно: ${totalDeduction} (включая комиссию ${fee})` },
          { status: 400 }
        );
      }
    }

    // Генерируем уникальный код
    let code = generateCode(amount, currency);
    let codeHash = hashCode(code);
    
    // Проверяем уникальность (маловероятно, но всё же)
    let existing = await prisma.code.findUnique({
      where: { codeHash }
    });
    
    let attempts = 0;
    while (existing && attempts < 10) {
      code = generateCode(amount, currency);
      codeHash = hashCode(code);
      existing = await prisma.code.findUnique({ where: { codeHash } });
      attempts++;
    }

    if (existing) {
      return NextResponse.json({ error: 'Не удалось сгенерировать уникальный код' }, { status: 500 });
    }

    // Создаем код в транзакции: списываем баланс + создаем код
    const [updatedWallet, newCode] = await prisma.$transaction([
      // Списываем баланс
      currency === 'USDT'
        ? prisma.wallet.update({
            where: { userId },
            data: { usdtBalance: { decrement: totalDeduction } }
          })
        : prisma.wallet.update({
            where: { userId },
            data: { tmtBalance: { decrement: totalDeduction } }
          }),
      
      // Создаем код
      prisma.code.create({
        data: {
          code,
          codeHash,
          amount,
          currency,
          fee,
          status: 'ACTIVE',
          creatorId: userId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
        },
        include: { creator: true }
      })
    ]);

    return NextResponse.json({
      success: true,
      code: newCode.code, // Возвращаем код в открытом виде
      amount: newCode.amount,
      currency: newCode.currency,
      fee: newCode.fee,
      expiresAt: newCode.expiresAt,
      balance: currency === 'USDT' ? updatedWallet.usdtBalance : updatedWallet.tmtBalance
    });
  } catch (error) {
    console.error('Generate code error:', error);
    return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
  }
}

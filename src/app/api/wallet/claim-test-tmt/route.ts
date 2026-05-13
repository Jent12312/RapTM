import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const CLAIM_COOLDOWN_MINUTES = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Не указан userId' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const recentClaim = await prisma.transaction.findFirst({
      where: {
        userId,
        type: 'DEPOSIT',
        method: 'SYSTEM',
        asset: 'TMT',
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - CLAIM_COOLDOWN_MINUTES * 60 * 1000),
        },
      },
      select: { id: true },
    });

    if (recentClaim) {
      return NextResponse.json({
        error: `Повторно можно получить через ${CLAIM_COOLDOWN_MINUTES} мин.`,
      }, { status: 429 });
    }

    let wallet = user.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          usdtBalance: 0,
          tmtBalance: 0,
          bonusBalance: 15,
          referralBonus: 0,
          frozenBalance: 0,
        },
      });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { tmtBalance: { increment: 1000 } },
    });

    const ip = request.headers.get('x-forwarded-for') || null;

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        method: 'SYSTEM',
        asset: 'TMT',
        network: null,
        amount: 1000,
        fee: 0,
        address: null,
        txId: `faucet-tmt-${Date.now()}`,
        status: 'COMPLETED',
        adminNote: 'Тестовые 1000 TMT (faucet)',
        ip: ip,
      },
    });

    return NextResponse.json({
      success: true,
      newBalance: updatedWallet.tmtBalance.toString(),
      transactionId: transaction.id,
    }, { status: 200 });

  } catch (error) {
    console.error('Claim test TMT error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

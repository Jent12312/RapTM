// src/app/api/wallet/balance/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        withdrawalAddresses: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    return NextResponse.json({
      usdtBalance: wallet.usdtBalance,
      tmtBalance: wallet.tmtBalance,
      bonusBalance: wallet.bonusBalance,
      totalBalance: wallet.usdtBalance + wallet.tmtBalance + wallet.bonusBalance,
      withdrawalAddresses: wallet.withdrawalAddresses,
    });
  } catch (error) {
    console.error('Get Balance Error:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}
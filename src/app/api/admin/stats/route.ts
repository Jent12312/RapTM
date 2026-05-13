// src/app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Общая статистика пользователей
    const totalUsers = await prisma.user.count();
    const activeUsers24h = await prisma.user.count({ where: { lastSeen: { gte: dayAgo } } });
    const activeUsers7d = await prisma.user.count({ where: { lastSeen: { gte: weekAgo } } });
    
    // 2. Статистика по KYC
    const pendingKyc = await prisma.user.count({ where: { kycStatus: 'PENDING' } });
    const verifiedKyc = await prisma.user.count({ where: { kycStatus: 'VERIFIED' } });

    // 3. Статистика по спорам и сделкам
    const activeDisputes = await prisma.order.count({ 
      where: { isDisputed: true, status: { notIn: ['COMPLETED', 'CANCELLED'] } } 
    });
    const activeTrades = await prisma.order.count({ 
      where: { status: { in: ['PENDING', 'PAID', 'DISPUTED'] } } 
    });

    // 4. Объёмы торгов (P2P + Swaps + Codes)
    // P2P Volume USDT
    const p2pVolume24h = await prisma.order.aggregate({
      where: { status: 'COMPLETED', updatedAt: { gte: dayAgo }, ad: { asset: 'USDT' } },
      _sum: { amountAsset: true }
    });
    
    // P2P Volume TMT
    const p2pVolumeTmt24h = await prisma.order.aggregate({
      where: { status: 'COMPLETED', updatedAt: { gte: dayAgo }, ad: { asset: 'TMT' } },
      _sum: { amountAsset: true }
    });

    // Swaps Volume
    const swapVolume24h = await prisma.exchangeRequest.aggregate({
      where: { status: 'COMPLETED', updatedAt: { gte: dayAgo } },
      _sum: { amountUsdt: true }
    });

    // 5. Заработанные комиссии (P&L)
    const swapCommissions = await prisma.exchangeRequest.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { commission: true }
    });

    const codeFees = await prisma.code.groupBy({
      by: ['currency'],
      _sum: { fee: true }
    });

    const totalP2PVolume = await prisma.order.aggregate({
      where: { status: 'COMPLETED', ad: { asset: 'USDT' } },
      _sum: { amountAsset: true }
    });
    const estimatedP2PCommissions = Number(totalP2PVolume._sum?.amountAsset || 0) * 0.005;

    // 6. Общие балансы в системе
    const totalBalances = await prisma.wallet.aggregate({
      _sum: { usdtBalance: true, tmtBalance: true }
    });

    // 7. Очередь на вывод (Transactions)
    const pendingWithdrawals = await prisma.transaction.count({ 
      where: { type: 'WITHDRAWAL', status: 'PENDING' } 
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        active24h: activeUsers24h,
        active7d: activeUsers7d
      },
      kyc: { pending: pendingKyc, verified: verifiedKyc },
      disputes: { active: activeDisputes },
      trades: { active: activeTrades },
      volume: {
        p2p24h: Number(p2pVolume24h._sum?.amountAsset || 0),
        p2pTmt24h: Number(p2pVolumeTmt24h._sum?.amountAsset || 0),
        swap24h: Number(swapVolume24h._sum?.amountUsdt || 0)
      },
      finance: {
        swapFees: Number(swapCommissions._sum?.commission || 0),
        codeFees: codeFees.reduce((acc, item) => ({
          ...acc,
          [item.currency]: Number(item._sum?.fee || 0)
        }), {} as Record<string, number>),
        p2pFeesEstimated: estimatedP2PCommissions,
        pendingWithdrawals,
        totalUsdt: Number(totalBalances._sum?.usdtBalance || 0),
        totalTmt: Number(totalBalances._sum?.tmtBalance || 0)
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

// src/app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Общая статистика
    const totalUsers = await prisma.user.count();
    const totalCodes = await prisma.code.count();
    const activeCodes = await prisma.code.count({ where: { status: 'ACTIVE' } });
    const usedCodes = await prisma.code.count({ where: { status: 'USED' } });
    
    // Объем по кодам
    const codesVolume = await prisma.code.groupBy({
      by: ['currency'],
      _sum: { amount: true },
      where: { status: 'USED' }
    });

    // Комиссии за все время
    const totalFees = await prisma.code.groupBy({
      by: ['currency'],
      _sum: { fee: true }
    });

    // Статистика по транзакциям
    const totalCryptoTx = await prisma.cryptoTransaction.count();
    const pendingCryptoTx = await prisma.cryptoTransaction.count({ where: { status: 'PENDING' } });

    // Статистика по обменам
    const totalExchanges = await prisma.exchangeRequest.count();
    const pendingExchanges = await prisma.exchangeRequest.count({ where: { status: 'PENDING' } });

    // Статистика по KYC
    const pendingKyc = await prisma.user.count({ where: { kycStatus: 'pending' } });
    const verifiedKyc = await prisma.user.count({ where: { kycStatus: 'verified' } });

    // Статистика по спорам
    const activeDisputes = await prisma.order.count({ where: { isDisputed: true, status: { notIn: ['COMPLETED', 'CANCELLED'] } } });

    return NextResponse.json({
      users: { total: totalUsers },
      codes: {
        total: totalCodes,
        active: activeCodes,
        used: usedCodes,
        volume: codesVolume.reduce((acc, item) => ({
          ...acc,
          [item.currency]: (acc[item.currency as keyof typeof acc] || 0) + (item._sum.amount || 0)
        }), {} as Record<string, number>),
        fees: totalFees.reduce((acc, item) => ({
          ...acc,
          [item.currency]: (acc[item.currency as keyof typeof acc] || 0) + (item._sum.fee || 0)
        }), {} as Record<string, number>)
      },
      cryptoTx: { total: totalCryptoTx, pending: pendingCryptoTx },
      exchanges: { total: totalExchanges, pending: pendingExchanges },
      kyc: { pending: pendingKyc, verified: verifiedKyc },
      disputes: { active: activeDisputes }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

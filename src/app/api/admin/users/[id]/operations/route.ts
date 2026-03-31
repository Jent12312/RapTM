// src/app/api/admin/users/[id]/operations/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // all, crypto, exchange, codes

    const operations: any[] = [];

    // Крипто-транзакции
    if (type === 'all' || type === 'crypto') {
      const cryptoTx = await prisma.cryptoTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      operations.push(...cryptoTx.map(tx => ({
        id: tx.id,
        type: 'CRYPTO',
        action: tx.type === 'DEPOSIT' ? 'DEPOSIT' : 'WITHDRAWAL',
        amount: tx.amount,
        currency: tx.asset,
        status: tx.status,
        createdAt: tx.createdAt,
        details: tx.type === 'DEPOSIT' ? { txId: tx.txId } : { address: tx.address }
      })));
    }

    // Обмены
    if (type === 'all' || type === 'exchange') {
      const exchanges = await prisma.exchangeRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      operations.push(...exchanges.map(ex => ({
        id: ex.id,
        type: 'EXCHANGE',
        action: ex.direction,
        amountUsdt: ex.amountUsdt,
        amountTmt: ex.amountTmt,
        status: ex.status,
        createdAt: ex.createdAt,
        details: { userPhone: ex.userPhone }
      })));
    }

    // Коды (созданные и активированные)
    if (type === 'all' || type === 'codes') {
      const [createdCodes, redeemedCodes] = await Promise.all([
        prisma.code.findMany({
          where: { creatorId: userId },
          orderBy: { createdAt: 'desc' },
          take: 50
        }),
        prisma.code.findMany({
          where: { redeemerId: userId },
          orderBy: { usedAt: 'desc' },
          take: 50
        })
      ]);

      operations.push(...createdCodes.map(code => ({
        id: code.id,
        type: 'CODE',
        action: 'CREATED',
        amount: code.amount,
        currency: code.currency,
        fee: code.fee,
        status: code.status,
        createdAt: code.createdAt,
        details: { code: code.code }
      })));

      operations.push(...redeemedCodes.map(code => ({
        id: code.id,
        type: 'CODE',
        action: 'REDEEMED',
        amount: code.amount,
        currency: code.currency,
        status: code.status,
        createdAt: code.usedAt || code.createdAt,
        details: { code: code.code }
      })));
    }

    // Сортируем по дате (новые сначала)
    operations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ operations: operations.slice(0, 100) });
  } catch (error) {
    console.error('Admin operations error:', error);
    return NextResponse.json({ error: 'Failed to fetch operations' }, { status: 500 });
  }
}

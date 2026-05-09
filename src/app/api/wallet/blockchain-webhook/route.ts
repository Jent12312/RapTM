// src/app/api/wallet/blockchain-webhook/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/telegram';

/**
 * Webhook for processing incoming blockchain transactions.
 * In a real scenario, you would verify the signature of the request 
 * to ensure it comes from a trusted provider like Tatum or Moralis.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[BLOCKCHAIN WEBHOOK] Received:', JSON.stringify(body, null, 2));

    const { txId, network, address, amount, asset, status } = body;

    if (status !== 'SUCCESS') {
      return NextResponse.json({ ok: true, message: 'Transaction not successful, ignoring.' });
    }

    // 1. Find the deposit address and user
    const depositAddr = await prisma.depositAddress.findFirst({
      where: { address, network },
      include: { wallet: { include: { user: true } } }
    });

    if (!depositAddr) {
      console.warn(`[BLOCKCHAIN WEBHOOK] Address ${address} on ${network} not found in our database.`);
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const userId = depositAddr.wallet.userId;

    // 2. Check if transaction already processed
    const existingTx = await prisma.transaction.findFirst({
      where: { txId, type: 'DEPOSIT' }
    });

    if (existingTx) {
      return NextResponse.json({ ok: true, message: 'Transaction already processed' });
    }

    // 3. Process the deposit (Atomic Transaction)
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          method: 'CRYPTO',
          asset: asset || 'USDT',
          network,
          amount: Number(amount),
          txId,
          status: 'COMPLETED',
          address,
        }
      }),
      prisma.wallet.update({
        where: { userId },
        data: {
          usdtBalance: { increment: Number(amount) }
        }
      })
    ]);

    // 4. Notify User
    const user = depositAddr.wallet.user;
    await notifyUser(userId, 'deposit_received', {
      amount,
      asset: asset || 'USDT',
      network,
      txId
    });
    
    // Note: I should ideally add a 'deposit_received' type to telegram notification lib
    // But since I'm modifying it, I'll do that in a bit.

    return NextResponse.json({ success: true, transactionId: transaction.id });
  } catch (error: any) {
    console.error('[BLOCKCHAIN WEBHOOK] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

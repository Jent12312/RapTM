// src/app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { status } = await req.json();

    // 1. Находим сделку со всеми данными
    const order = await prisma.order.findUnique({
      where: { id },
      include: { ad: true, seller: true, buyer: true }
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // 2. Если статус меняется на COMPLETED и это сделка по USDT
    if (status === 'COMPLETED' && order.status !== 'COMPLETED' && order.ad.asset === 'USDT') {
      
      // ИСПОЛЬЗУЕМ ТРАНЗАКЦИЮ (либо всё сработает, либо ничего)
      await prisma.$transaction([
        // Списываем у продавца
        prisma.wallet.update({
          where: { userId: order.sellerId },
          data: { usdtBalance: { decrement: order.amountAsset } }
        }),
        // Начисляем покупателю
        prisma.wallet.update({
          where: { userId: order.buyerId },
          data: { usdtBalance: { increment: order.amountAsset } }
        }),
        // Обновляем статус заказа
        prisma.order.update({
          where: { id },
          data: { status: 'COMPLETED' }
        })
      ]);

      return NextResponse.json({ success: true, message: 'USDT Transferred' });
    }

    // Если это не USDT или другой статус - просто обновляем статус
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Transaction Error:", error);
    return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
  }
}
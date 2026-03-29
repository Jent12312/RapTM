// src/app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/telegram';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { ad: true, seller: true, buyer: true, reviews: true }
    });
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status, userId } = body; // userId - кто изменил статус

    const order = await prisma.order.findUnique({
      where: { id },
      include: { ad: true, seller: true, buyer: true }
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const appUrl = process.env.APP_URL || 'https://yourapp.com';
    const orderUrl = `${appUrl}/orders/${order.id}`;

    // Если это успешное завершение сделки по USDT
    if (status === 'COMPLETED' && order.status !== 'COMPLETED' && order.ad.asset === 'USDT') {

      // Выполняем транзакцию и ЗАБИРАЕМ результат обновления ордера
      const [ , , updatedOrder ] = await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: order.sellerId },
          data: { usdtBalance: { decrement: order.amountAsset } }
        }),
        prisma.wallet.update({
          where: { userId: order.buyerId },
          data: { usdtBalance: { increment: order.amountAsset } }
        }),
        prisma.order.update({
          where: { id },
          data: { status: 'COMPLETED' },
          include: { ad: true, seller: true, buyer: true }
        })
      ]);

      // Уведомления о завершении сделки
      await Promise.all([
        notifyUser(order.buyerId, 'order_completed', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          amountAsset: order.amountAsset,
          asset: order.ad.asset,
        }),
        notifyUser(order.sellerId, 'order_completed', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          amountAsset: order.amountAsset,
          asset: order.ad.asset,
        }),
      ]);

      // Возвращаем обновленный ордер
      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // Уведомление об оплате (если статус сменился на PAID)
    if (status === 'PAID' && order.status !== 'PAID') {
      await notifyUser(order.sellerId, 'order_paid', {
        orderId: order.id,
        amountFiat: order.amountFiat,
        fiat: order.ad.fiat,
        orderUrl,
      });
    }

    // Уведомление об отмене
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      await Promise.all([
        notifyUser(order.buyerId, 'order_cancelled', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          reason: 'Отменена пользователем',
        }),
        notifyUser(order.sellerId, 'order_cancelled', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          reason: 'Отменена пользователем',
        }),
      ]);
    }

    // Для остальных статусов (например PAID)
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { ad: true, seller: true, buyer: true }
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Transaction Error:", error);
    return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
  }
}
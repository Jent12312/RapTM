import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAdminNotification } from '@/lib/telegram';
import { getAuthUser } from '@/lib/getAuthUser';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: orderId } = await context.params;

    // Находим заказ
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        seller: true,
        ad: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only buyer or seller can dispute
    if (order.buyerId !== authUser.userId && order.sellerId !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Проверяем, что заказ в статусе PAID и еще не в споре
    if (order.status !== 'PAID') {
      return NextResponse.json({ error: 'Can only dispute PAID orders' }, { status: 400 });
    }

    if (order.isDisputed) {
      return NextResponse.json({ error: 'Order is already disputed' }, { status: 400 });
    }

    // Проверяем, что прошло 10 минут после статуса PAID
    const paidTime = new Date(order.updatedAt);
    const tenMinutesLater = new Date(paidTime.getTime() + 10 * 60 * 1000);
    const now = new Date();

    if (now < tenMinutesLater) {
      return NextResponse.json({ error: 'Dispute available only 10 minutes after payment confirmation' }, { status: 400 });
    }

    // Обновляем заказ, устанавливая флаг спора
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { isDisputed: true },
      include: {
        buyer: true,
        seller: true,
        ad: true
      }
    });

    // Уведомление админам
    await sendAdminNotification(
      `🚨 <b>Апелляция по сделке!</b>\n\n` +
      `🛒 <b>Сделка:</b> <code>${orderId}</code>\n` +
      `👤 <b>Покупатель:</b> ${order.buyer.firstName || order.buyer.username} (@${order.buyer.username || 'unknown'})\n` +
      `👤 <b>Продавец:</b> ${order.seller.firstName || order.seller.username} (@${order.seller.username || 'unknown'})\n` +
      `💰 <b>Сумма:</b> ${order.amountAsset} ${order.ad.asset}\n` +
      `📊 <b>Статус:</b> ${order.status}`
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Dispute created successfully'
    });

  } catch (error) {
    console.error('Dispute creation error:', error);
    return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 });
  }
}
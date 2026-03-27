import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    
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

    // Отправляем уведомление в Telegram админу
    try {
      const telegramMessage = `🚨 Апелляция по сделке #${orderId.slice(0, 8)}
Покупатель: ${order.buyer.firstName || order.buyer.username} (@${order.buyer.username || 'unknown'})
Продавец: ${order.seller.firstName || order.seller.username} (@${order.seller.username || 'unknown'})
Сумма: ${order.amountAsset} ${order.ad.asset}
Статус: ${order.status}`;

      await fetch(`${process.env.TELEGRAM_BOT_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID,
          text: telegramMessage,
          parse_mode: 'HTML'
        })
      });
    } catch (telegramError) {
      console.error('Failed to send Telegram notification:', telegramError);
      // Не прерываем выполнение, даже если уведомление не отправилось
    }

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
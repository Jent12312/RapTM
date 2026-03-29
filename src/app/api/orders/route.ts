// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adId, takerId, amountAsset, amountFiat } = body; // takerId - тот кто кликнул

    const ad = await prisma.p2PAd.findUnique({ where: { id: adId } });
    if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });

    // ПРАВИЛЬНОЕ РАСПРЕДЕЛЕНИЕ РОЛЕЙ
    let buyerId, sellerId;
    if (ad.type === 'buy') {
      // Мейкер (создатель ad) хочет КУПИТЬ крипту.
      // Значит Тейкер (тот кто кликнул) - ПРОДАЕТ крипту.
      buyerId = ad.userId;
      sellerId = takerId;
    } else {
      // Мейкер (создатель ad) хочет ПРОДАТЬ крипту.
      // Значит Тейкер (тот кто кликнул) - ПОКУПАЕТ крипту.
      buyerId = takerId;
      sellerId = ad.userId;
    }

    const order = await prisma.order.create({
      data: {
        adId,
        buyerId,
        sellerId,
        amountAsset: Number(amountAsset),
        amountFiat: Number(amountFiat),
        status: 'PENDING'
      },
      include: { ad: true, seller: true, buyer: true, reviews: true }
    });

    // Отправка Telegram уведомлений
    const appUrl = process.env.APP_URL || 'https://rap-tm.vercel.app';
    const orderUrl = `${appUrl}/orders/${order.id}`;

    // Уведомление покупателю
    await notifyUser(buyerId, 'order_created', {
      orderId: order.id,
      amountFiat: order.amountFiat,
      fiat: ad.fiat,
      amountAsset: order.amountAsset,
      asset: ad.asset,
      buyerName: order.buyer.firstName || order.buyer.username || 'Покупатель',
      sellerName: order.seller.firstName || order.seller.username || 'Продавец',
      paymentTime: ad.paymentTime,
      orderUrl,
    });

    // Уведомление продавцу
    await notifyUser(sellerId, 'order_created', {
      orderId: order.id,
      amountFiat: order.amountFiat,
      fiat: ad.fiat,
      amountAsset: order.amountAsset,
      asset: ad.asset,
      buyerName: order.buyer.firstName || order.buyer.username || 'Покупатель',
      sellerName: order.seller.firstName || order.seller.username || 'Продавец',
      paymentTime: ad.paymentTime,
      orderUrl,
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const orders = await prisma.order.findMany({
      where: {
        OR: [{ buyerId: userId as string }, { sellerId: userId as string }]
      },
      include: { ad: true, seller: true, buyer: true, reviews: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
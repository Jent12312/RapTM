// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    return NextResponse.json({ success: true, order });
  } catch (error) {
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
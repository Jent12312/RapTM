// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Создать новую сделку
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adId, buyerId, amountAsset, amountFiat } = body;

    // 1. Находим объявление, чтобы узнать продавца
    const ad = await prisma.p2PAd.findUnique({ where: { id: adId } });
    if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });

    // 2. Создаем сделку
    const order = await prisma.order.create({
      data: {
        adId,
        buyerId,
        sellerId: ad.userId,
        amountAsset: Number(amountAsset),
        amountFiat: Number(amountFiat),
        status: 'PENDING'
      },
      include: {
        ad: true,
        seller: true,
        buyer: true
      }
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
      include: { ad: true, seller: true, buyer: true, review: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
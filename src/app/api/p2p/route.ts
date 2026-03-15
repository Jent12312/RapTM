// src/app/api/p2p/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Если передан userId — ищем все объявления этого юзера (и активные, и выключенные). 
    // Если нет — ищем только активные для общего Маркета.
    const ads = await prisma.p2PAd.findMany({
      where: userId ? { userId } : { isActive: true },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(ads);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}

// 2. Создать новое объявление
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, type, asset, fiat, priceType, price, minLimit, maxLimit, city, autoReply } = body;

    const newAd = await prisma.p2PAd.create({
      data: {
        userId,
        type,
        asset,
        fiat,
        priceType,
        price: Number(price),
        minLimit: Number(minLimit),
        maxLimit: Number(maxLimit),
        city,
        autoReply,
      }
    });

    return NextResponse.json({ success: true, ad: newAd });
  } catch (error) {
    console.error("Create Ad Error:", error);
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
  }
}
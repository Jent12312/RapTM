import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    const reviews = await prisma.review.findMany({ where: { targetId: id } });
    const orders = await prisma.order.findMany({
      where: { OR: [{ buyerId: id }, { sellerId: id }], status: 'COMPLETED' }
    });

    const good = reviews.filter(r => r.rating === 'EXCELLENT').length;
    const neutral = reviews.filter(r => r.rating === 'NEUTRAL').length;
    const bad = reviews.filter(r => r.rating === 'BAD').length;
    const totalReviews = reviews.length;

    const stats = {
      good,
      neutral,
      bad,
      trades: orders.length,
      volume: orders.reduce((acc, curr) => acc + Number(curr.amountAsset), 0),
      positivePercent: totalReviews > 0 ? Math.round((good / totalReviews) * 100) : 0,
      averageRating: totalReviews > 0 
        ? (good * 5 + neutral * 3 + bad * 1) / totalReviews 
        : 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
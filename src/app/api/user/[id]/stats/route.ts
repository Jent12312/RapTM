import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    const reviews = await prisma.review.findMany({ where: { targetId: id } });
    const orders = await prisma.order.findMany({
      where: { OR: [{ buyerId: id }, { sellerId: id }], status: 'COMPLETED' }
    });

    const stats = {
      good: reviews.filter(r => r.rating === 'GOOD').length,
      neutral: reviews.filter(r => r.rating === 'NEUTRAL').length,
      bad: reviews.filter(r => r.rating === 'BAD').length,
      trades: orders.length,
      volume: orders.reduce((acc, curr) => acc + curr.amountAsset, 0)
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
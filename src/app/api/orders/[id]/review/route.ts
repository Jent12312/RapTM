// src/app/api/orders/[id]/review/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { authorId, targetId, rating } = body;

    // Проверяем, не оставляли ли уже отзыв к этой сделке
    const existingReview = await prisma.review.findUnique({
      where: { orderId: id }
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Review already exists' }, { status: 400 });
    }

    // Создаем отзыв (смайлик)
    const review = await prisma.review.create({
      data: {
        orderId: id,
        authorId,
        targetId,
        rating // "GOOD", "NEUTRAL" или "BAD"
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Review Error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
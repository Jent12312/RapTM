// src/app/api/orders/[id]/review/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // Это id самой сделки (orderId)
    const body = await req.json();
    const { authorId, targetId, rating } = body;

    // ИСПОЛЬЗУЕМ findFirst вместо findUnique
    // Проверяем: есть ли уже отзыв к ЭТОЙ сделке от ЭТОГО автора?
    const existingReview = await prisma.review.findFirst({
      where: { 
        orderId: id,
        authorId: authorId 
      }
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Вы уже оставили отзыв к этой сделке' }, { status: 400 });
    }

    // Создаем новый отзыв
    const review = await prisma.review.create({
      data: {
        orderId: id,
        authorId,
        targetId,
        rating
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Review Error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
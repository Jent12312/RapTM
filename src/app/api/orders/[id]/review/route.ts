// src/app/api/orders/[id]/review/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.enum(['EXCELLENT', 'NEUTRAL', 'BAD']),
  comment: z.string().optional().nullable(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid rating. Use EXCELLENT, NEUTRAL, or BAD' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { ad: true }
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Only buyer or seller can review
    if (order.buyerId !== authUser.userId && order.sellerId !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Determine targetId (the other person in the order)
    const targetId = order.buyerId === authUser.userId ? order.sellerId : order.buyerId;

    const existingReview = await prisma.review.findFirst({
      where: { 
        orderId: id,
        authorId: authUser.userId 
      }
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Вы уже оставили отзыв к этой сделке' }, { status: 400 });
    }

    // Create the review and update user rating in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          orderId: id,
          authorId: authUser.userId,
          targetId,
          rating: parsed.data.rating,
          comment: parsed.data.comment || null,
        }
      });

      // Recalculate target user's overall rating
      const allReviews = await tx.review.findMany({
        where: { targetId }
      });

      const totalWeight = allReviews.reduce((sum, r) => {
        if (r.rating === 'EXCELLENT') return sum + 5;
        if (r.rating === 'NEUTRAL') return sum + 3;
        if (r.rating === 'BAD') return sum + 1;
        return sum;
      }, 0);

      const averageRating = allReviews.length > 0 ? totalWeight / allReviews.length : 0;

      await tx.user.update({
        where: { id: targetId },
        data: { rating: averageRating }
      });

      return review;
    });

    return NextResponse.json({ success: true, review: result });
  } catch (error) {
    console.error('Review Error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
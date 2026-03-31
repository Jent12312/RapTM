// src/app/api/codes/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Получить историю кодов пользователя (созданные и активированные)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'created' | 'redeemed' | 'all'

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let whereClause: any = {};

    if (type === 'created') {
      whereClause.creatorId = userId;
    } else if (type === 'redeemed') {
      whereClause.redeemerId = userId;
    } else {
      // Все коды, где пользователь участвовал
      whereClause = {
        OR: [
          { creatorId: userId },
          { redeemerId: userId }
        ]
      };
    }

    const codes = await prisma.code.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            username: true,
            avatarUrl: true
          }
        },
        redeemer: {
          select: {
            id: true,
            firstName: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(codes);
  } catch (error) {
    console.error('Get codes error:', error);
    return NextResponse.json({ error: 'Failed to get codes' }, { status: 500 });
  }
}

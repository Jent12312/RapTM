// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Фильтр по поиску (username, firstName, telegramId)
    const where = search ? {
      OR: [
        { username: { contains: search } },
        { firstName: { contains: search } },
        { telegramId: { contains: search } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          wallet: true,
          createdCodes: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true
            }
          },
          redeemedCodes: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              usedAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

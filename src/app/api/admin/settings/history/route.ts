// src/app/api/admin/settings/history/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const history = await prisma.rateHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Rate history error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

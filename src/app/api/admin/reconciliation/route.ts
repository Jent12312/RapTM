// src/app/api/admin/reconciliation/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { performReconciliation } from '@/lib/reconciliation';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const logs = await prisma.reconciliationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Fetch reconciliation logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await performReconciliation();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Run reconciliation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

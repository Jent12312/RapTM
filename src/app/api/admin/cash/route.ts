import { NextResponse } from 'next/server';
import { adminService } from '@/services/adminService';
import { getAuthUser } from '@/lib/getAuthUser';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: authUser.userId } });
    if (!admin || !admin.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const balances = await adminService.getCashBalances();

    return NextResponse.json({ success: true, balances });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cash balances' }, { status: 500 });
  }
}

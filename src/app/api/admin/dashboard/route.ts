import { NextResponse } from 'next/server';
import { adminService } from '@/services/adminService';
import { getAuthUser } from '@/lib/getAuthUser';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await prisma.user.findUnique({
      where: { id: authUser.userId }
    });

    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await adminService.getDashboardStats();
    
    // Also get the current global rate
    const rate = await prisma.exchangeRate.findUnique({
      where: { id: 'global' }
    });

    return NextResponse.json({
      success: true,
      stats,
      rate: rate || { rate: '19.5', isFrozen: false }
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

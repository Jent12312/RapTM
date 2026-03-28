// src/app/api/admin/kyc/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/kyc - Получить все заявки на KYC
export async function GET() {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        kycStatus: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, users: pendingUsers });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch KYC requests' }, { status: 500 });
  }
}

// POST /api/admin/kyc - Обработать заявку (approve/reject)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, action } = body; // action: 'approve' | 'reject'

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.kycStatus !== 'pending') {
      return NextResponse.json({ error: 'User KYC is not pending' }, { status: 400 });
    }

    let updateData: any = {};
    
    if (action === 'approve') {
      updateData = {
        kycStatus: 'verified',
        isVerified: true
      };
    } else if (action === 'reject') {
      updateData = {
        kycStatus: 'rejected',
        isVerified: false
      };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('KYC admin action error:', error);
    return NextResponse.json({ error: 'Failed to process KYC' }, { status: 500 });
  }
}

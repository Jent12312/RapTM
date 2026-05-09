// src/app/api/admin/kyc/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/telegram';

// GET /api/admin/kyc - Получить все заявки на KYC
export async function GET() {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        kycStatus: 'PENDING'
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
    const { userId, action, reason } = body; // action: 'approve' | 'reject'

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.kycStatus !== 'PENDING') {
      return NextResponse.json({ error: 'User KYC is not pending' }, { status: 400 });
    }

    let updateData: any = {};

    if (action === 'approve') {
      updateData = {
        kycStatus: 'VERIFIED',
        isVerified: true
      };
    } else if (action === 'reject') {
      updateData = {
        kycStatus: 'REJECTED',
        isVerified: false
      };
    }
 else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Отправляем уведомление пользователю
    if (action === 'approve') {
      await notifyUser(userId, 'kyc_approved', {
        userId: user.id,
        userName: user.firstName || user.username,
      });
    } else {
      await notifyUser(userId, 'kyc_rejected', {
        userId: user.id,
        userName: user.firstName || user.username,
        reason: reason || 'Не указано',
      });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('KYC admin action error:', error);
    return NextResponse.json({ error: 'Failed to process KYC' }, { status: 500 });
  }
}

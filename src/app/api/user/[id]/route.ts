import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Ищем юзера по ID (базовому или Telegram ID)
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: id }, { telegramId: id }]
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    // Security: Only user or admin can update
    const authUser = await getAuthUser();
    if (!authUser || (authUser.userId !== id && !authUser.isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { nickname, avatarUrl, isVerified, kycStatus, kycPhotoUrl, phone, email, tgNotifications, passcode } = body;

    const updateData: any = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (kycStatus !== undefined) updateData.kycStatus = kycStatus;
    if (kycPhotoUrl !== undefined) updateData.kycPhotoUrl = kycPhotoUrl;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (tgNotifications !== undefined) updateData.tgNotifications = tgNotifications;
    if (passcode !== undefined) updateData.passcode = passcode;

    // Increment sessionVersion if sensitive fields change
    if (email !== undefined || passcode !== undefined) {
      updateData.sessionVersion = { increment: 1 };
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { isDeleted: true }
    });

    return NextResponse.json({ success: true, message: 'Account deactivated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
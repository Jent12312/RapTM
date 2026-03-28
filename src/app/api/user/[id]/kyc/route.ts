// src/app/api/user/[id]/kyc/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/user/[id]/kyc - Отправка заявки на KYC
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { kycPhotoUrl } = body;

    // Проверяем текущего пользователя
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Если уже верифицирован - отказываем
    if (user.kycStatus === 'verified' || user.isVerified) {
      return NextResponse.json({ error: 'Already verified' }, { status: 400 });
    }

    // Если уже есть pending заявка - отказываем
    if (user.kycStatus === 'pending') {
      return NextResponse.json({ error: 'KYC already pending' }, { status: 400 });
    }

    // Обновляем статус на pending
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        kycStatus: 'pending',
        kycPhotoUrl: kycPhotoUrl || null
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('KYC submit error:', error);
    return NextResponse.json({ error: 'Failed to submit KYC' }, { status: 500 });
  }
}

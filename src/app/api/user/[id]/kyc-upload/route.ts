// src/app/api/user/[id]/kyc-upload/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/telegram';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Проверяем пользователя
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

    // Получаем файл из FormData
    const formData = await req.formData();
    const photoFile = formData.get('photo') as File;

    if (!photoFile) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(photoFile.type)) {
      return NextResponse.json({ error: 'Only JPEG and PNG images are allowed' }, { status: 400 });
    }

    // Проверка размера (макс 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (photoFile.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Конвертируем файл в Base64 для хранения
    const bytes = await photoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const photoUrl = `data:${photoFile.type};base64,${base64}`;

    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        kycStatus: 'pending',
        kycPhotoUrl: photoUrl
      }
    });

    // Отправляем уведомление администраторам о новой заявке
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
    });

    for (const admin of admins) {
      await notifyUser(admin.id, 'kyc_approved', { // Используем как "новая заявка"
        userId: user.id,
        userName: user.firstName || user.username,
        action: 'new_kyc_application',
      });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('KYC upload error:', error);
    return NextResponse.json({ error: 'Failed to upload KYC photo' }, { status: 500 });
  }
}

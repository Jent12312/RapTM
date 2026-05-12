// src/app/api/user/[id]/kyc-upload/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const formData = await req.formData();
    
    // В KycScreen.tsx файл прикрепляется под ключом 'photo'
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    // Проверяем, что загружена именно картинка
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Допускаются только изображения' }, { status: 400 });
    }

    // Конвертируем картинку в Base64 для сохранения напрямую в PostgreSQL
    const { saveFile } = await import('@/lib/upload');
    const imageUrl = await saveFile(file);

    // Обновляем пользователя: сохраняем фото и ставим статус "на проверке"
    const user = await prisma.user.update({
      where: { id },
      data: { 
        kycPhotoUrl: imageUrl,
        kycStatus: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('KYC upload error:', error);
    return NextResponse.json({ error: 'Ошибка при загрузке документа' }, { status: 500 });
  }
}
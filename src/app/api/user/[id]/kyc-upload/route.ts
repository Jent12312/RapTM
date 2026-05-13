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
    
    // В KycScreen.tsx файлы прикрепляются под ключами 'document' и 'selfie'
    const documentFile = formData.get('document') as File;
    const selfieFile = formData.get('selfie') as File;

    if (!documentFile || !selfieFile) {
      return NextResponse.json({ error: 'Необходимо загрузить оба файла' }, { status: 400 });
    }

    // Проверяем, что загружены именно картинки
    if (!documentFile.type.startsWith('image/') || !selfieFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Допускаются только изображения' }, { status: 400 });
    }

    // Конвертируем картинки в Base64 для сохранения напрямую в PostgreSQL (через saveFile)
    const { saveFile } = await import('@/lib/upload');
    const documentUrl = await saveFile(documentFile);
    const selfieUrl = await saveFile(selfieFile);

    // Обновляем пользователя: сохраняем фото и ставим статус "на проверке"
    const user = await prisma.user.update({
      where: { id },
      data: { 
        kycPhotoUrl: documentUrl,
        kycSelfieUrl: selfieUrl,
        kycStatus: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('KYC upload error:', error);
    return NextResponse.json({ error: 'Ошибка при загрузке документа' }, { status: 500 });
  }
}
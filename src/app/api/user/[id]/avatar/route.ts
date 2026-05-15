// src/app/api/user/[id]/avatar/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Сохраняем файл на сервере
    const { saveFile } = await import('@/lib/upload');
    const avatarUrl = await saveFile(file);
    
    // Обновляем пользователя: сохраняем URL аватарки
    const user = await prisma.user.update({
      where: { id },
      data: { avatarUrl }
    });

    return NextResponse.json({ success: true, avatarUrl, user });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}
// src/app/api/user/[id]/avatar/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
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

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Создаем директорию для аватаров если не существует
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });

    // Генерируем уникальное имя файла
    const fileExtension = file.name.split('.').pop() || 'png';
    const fileName = `${id}_${Date.now()}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL для доступа к файлу
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Обновляем пользователя в БД
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

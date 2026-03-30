// src/app/api/orders/[id]/messages/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await context.params;
    const formData = await req.formData();
    const file = formData.get('image') as File;
    const senderId = formData.get('senderId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Создаем директорию для изображений чата если не существует
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'chat');
    await mkdir(uploadDir, { recursive: true });

    // Генерируем уникальное имя файла
    const fileExtension = file.name.split('.').pop() || 'png';
    const fileName = `${orderId}_${Date.now()}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL для доступа к файлу
    const imageUrl = `/uploads/chat/${fileName}`;

    // Создаем сообщение с изображением
    const message = await prisma.message.create({
      data: {
        orderId,
        senderId,
        imageUrl
      },
      include: { sender: true }
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

// src/app/api/orders/[id]/messages/upload/route.ts
import { NextResponse } from 'next/server';
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
    // ДОБАВЛЕНО: Теперь мы принимаем и текст, если он был отправлен вместе с фото
    const text = formData.get('text') as string | null; 

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Конвертируем картинку в Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Создаем сообщение в БД с картинкой (и текстом, если он есть)
    const message = await prisma.message.create({
      data: {
        orderId,
        senderId,
        imageUrl: base64Image,
        text: text || null
      },
      include: { sender: true }
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
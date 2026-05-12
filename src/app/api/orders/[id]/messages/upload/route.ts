// src/app/api/orders/[id]/messages/upload/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: orderId } = await context.params;
    const formData = await req.formData();
    
    const file = formData.get('image') as File;
    const text = formData.get('text') as string | null; 

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || (order.buyerId !== authUser.userId && order.sellerId !== authUser.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    const { saveFile } = await import('@/lib/upload');
    const imageUrl = await saveFile(file);

    const message = await prisma.message.create({
      data: {
        orderId,
        senderId: authUser.userId,
        imageUrl: imageUrl,
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
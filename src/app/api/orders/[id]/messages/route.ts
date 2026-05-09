// src/app/api/orders/[id]/messages/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';

const messageSchema = z.object({
  text: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
}).refine(data => data.text || data.imageUrl, {
  message: 'Message must contain text or an image',
});

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;

    // Check if user is part of the order
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order || (order.buyerId !== authUser.userId && order.sellerId !== authUser.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
      include: { sender: true }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid message content' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order || (order.buyerId !== authUser.userId && order.sellerId !== authUser.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newMessage = await prisma.message.create({
      data: {
        orderId: id,
        senderId: authUser.userId,
        text: parsed.data.text || null,
        imageUrl: parsed.data.imageUrl || null
      },
      include: { sender: true }
    });

    // Auto-response logic
    const recipientId = order.buyerId === authUser.userId ? order.sellerId : order.buyerId;
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { autoResponse: true }
    });

    if (recipient?.autoResponse) {
      // Check if this is the first message from this sender in this order
      const messageCount = await prisma.message.count({
        where: { orderId: id, senderId: authUser.userId }
      });

      if (messageCount === 1) {
        await prisma.message.create({
          data: {
            orderId: id,
            senderId: recipientId,
            text: recipient.autoResponse,
            isSystem: false // It's an automated personal message
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
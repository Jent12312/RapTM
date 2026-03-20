// src/app/api/orders/[id]/messages/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. Получить все сообщения для этой сделки
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const messages = await prisma.message.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' }, // От старых к новым
      include: { sender: true }      // Чтобы знать имя отправителя
    });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// 2. Отправить новое сообщение в чат
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { senderId, text } = body;

    const newMessage = await prisma.message.create({
      data: {
        orderId: id,
        senderId,
        text
      },
      include: { sender: true }
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
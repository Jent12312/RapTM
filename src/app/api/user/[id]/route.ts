// src/app/api/user/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Ищем юзера по ID (базовому или Telegram ID)
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: id }, { telegramId: id }]
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { nickname, avatarUrl } = body;

    const user = await prisma.user.update({
      where: { id },
      data: { nickname, avatarUrl }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
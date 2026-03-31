// src/app/api/user/last-seen/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Обновить lastSeen пользователя
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// Получить lastSeen пользователя
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSeen: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Проверяем, был ли пользователь онлайн в последние 5 минут
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isOnline = user.lastSeen > fiveMinutesAgo;

    return NextResponse.json({
      lastSeen: user.lastSeen,
      isOnline
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

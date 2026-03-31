// src/app/api/auth/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, username, firstName } = body;

    if (!telegramId) {
      return NextResponse.json({ error: 'Telegram ID is required' }, { status: 400 });
    }

    // Ищем пользователя в базе
    let user = await prisma.user.findUnique({
      where: { telegramId: String(telegramId) },
      include: { wallet: true } // Сразу подтягиваем его кошелек
    });

    // Если пользователя нет — регистрируем его + создаем пустой кошелек
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: String(telegramId),
          username: username || '',
          firstName: firstName || '',

          wallet: {
            create: {
              usdtBalance: 0.0,
              tmtBalance: 0.0
            }
          }
        },
        include: { wallet: true }
      });
    } else {
      // Обновляем данные пользователя (username, firstName, avatar) если они изменились
      user = await prisma.user.update({
        where: { telegramId: String(telegramId) },
        data: {
          username: username || user.username,
          firstName: firstName || user.firstName,
        },
        include: { wallet: true }
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
// src/app/api/auth/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTelegramWebAppData, signJwt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json({ error: 'initData is required' }, { status: 400 });
    }

    // Validate initData
    const tgUser = validateTelegramWebAppData(initData);
    
    if (!tgUser) {
      return NextResponse.json({ error: 'Unauthorized: Invalid initData' }, { status: 401 });
    }

    // Extract start_param for referrals
    const urlParams = new URLSearchParams(initData);
    const startParam = urlParams.get('start_param');

    const telegramId = String(tgUser.id);
    const username = tgUser.username || '';
    const firstName = tgUser.first_name || '';

    // Ищем пользователя в базе
    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: { wallet: true }
    });

    // Если пользователя нет — регистрируем его + создаем пустой кошелек
    if (!user) {
      let referrerId = null;
      if (startParam && startParam.startsWith('ref_')) {
        const refId = startParam.replace('ref_', '');
        // Check if referrer exists
        const referrer = await prisma.user.findUnique({ where: { id: refId } });
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      user = await prisma.user.create({
        data: {
          telegramId,
          username,
          firstName,
          referrerId,

          wallet: {
            create: {
              usdtBalance: 0.0,
              tmtBalance: 0.0,
              bonusBalance: 15.0 // Default welcome bonus
            }
          }
        },
        include: { wallet: true }
      });
    } else {
      // Обновляем данные пользователя если они изменились
      user = await prisma.user.update({
        where: { telegramId },
        data: {
          username: username || user.username,
          firstName: firstName || user.firstName,
        },
        include: { wallet: true }
      });
    }

    // Создаем JWT токен
    const token = await signJwt({ 
      userId: user.id, 
      telegramId: user.telegramId,
      role: user.level,
      sessionVersion: user.sessionVersion
    });

    // Устанавливаем куку
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 часа
      path: '/',
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
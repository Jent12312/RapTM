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

    // 1. Валидация подписи (убедитесь, что validateTelegramWebAppData возвращает true или объект)
    const isValid = validateTelegramWebAppData(initData);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid initData signature' }, { status: 401 });
    }

    // 2. ПРАВИЛЬНОЕ ИЗВЛЕЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
    const urlParams = new URLSearchParams(initData);
    const userJsonStr = urlParams.get('user');
    const startParam = urlParams.get('start_param');
    
    if (!userJsonStr) {
      return NextResponse.json({ error: 'No user data found in initData' }, { status: 400 });
    }

    // РАСПАКОВЫВАЕМ JSON (Именно здесь была ошибка!)
    const userData = JSON.parse(userJsonStr);

    const telegramId = String(userData.id);
    const username = userData.username || null;
    const firstName = userData.first_name || null;
    const lastName = userData.last_name || null;
    const languageCode = userData.language_code || 'ru';

    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: { wallet: true },
    });

    if (!user) {
      // ЛОГИКА ДЛЯ НОВОГО ПОЛЬЗОВАТЕЛЯ
      let level: 'Standard' | 'Pro' | 'Partner' = 'Standard';
      let bonus = 15.0;

      if (startParam === 'partner' || startParam?.startsWith('partner_')) {
        level = 'Partner';
        bonus = 50.0;
      }

      let referrerId = null;
      if (startParam && startParam.startsWith('ref_')) {
        const refId = startParam.replace('ref_', '');
        const referrer = await prisma.user.findUnique({ where: { id: refId } });
        if (referrer) referrerId = referrer.id;
      }

      user = await prisma.user.create({
        data: {
          telegramId,
          username,
          firstName: firstName || lastName || 'User', // Резервное имя
          language: languageCode === 'tm' ? 'TM' : languageCode === 'en' ? 'EN' : 'RU',
          level: level,
          depositAmount: 0,
          dailyLimit: level === 'Partner' ? 1000 : 150,
          tradesCount: 0,
          volumeTotal: 0,
          referrerId,
          wallet: {
            create: { usdtBalance: 0.0, tmtBalance: 0.0, bonusBalance: bonus },
          },
        },
        include: { wallet: true },
      });
    } else {
      // ОБНОВЛЕНИЕ ДАННЫХ ДЕЙСТВУЮЩЕГО ПОЛЬЗОВАТЕЛЯ
      user = await prisma.user.update({
        where: { telegramId },
        data: {
          username: username || user.username,
          firstName: firstName || lastName || user.firstName,
          lastSeen: new Date(),
        },
        include: { wallet: true },
      });
    }

    // Создаем JWT
    const token = await signJwt({ 
      userId: user.id, 
      telegramId: user.telegramId,
      role: user.level
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return NextResponse.json({ success: true, user, token });
  } catch (error) {
    console.error('Telegram Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

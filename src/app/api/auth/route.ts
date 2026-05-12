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

    // 1. Валидация подписи
    const authData = validateTelegramWebAppData(initData);
    if (!authData) {
      return NextResponse.json({ error: 'Invalid initData signature' }, { status: 401 });
    }

    // 2. Извлечение данных пользователя и start_param
    const userData = authData.user;
    const startParam = authData.start_param || new URLSearchParams(initData).get('start_param');
    
    if (!userData || !userData.id) {
      return NextResponse.json({ error: 'No user data found in initData' }, { status: 400 });
    }

    const telegramId = String(userData.id);
    const username = userData.username || null;
    const firstName = userData.first_name || null;
    const lastName = userData.last_name || null;
    const languageCode = userData.language_code || 'ru';

    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: { 
        wallet: true,
        referrer: { select: { firstName: true } }
      },
    });

    // Helper for finding referrer
    const getReferrerId = async (param: string | null, currentUserId?: string) => {
      if (!param || !param.startsWith('ref_')) return null;
      const refId = param.replace('ref_', '');
      
      // 1. Попробовать найти по internal UUID (если формат совпадает)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refId);
      if (isUuid) {
        const ref = await prisma.user.findUnique({ where: { id: refId } });
        if (ref && ref.id !== currentUserId) return ref.id;
      }

      // 2. Попробовать найти по telegramId
      const refByTg = await prisma.user.findUnique({ where: { telegramId: refId } });
      if (refByTg && refByTg.id !== currentUserId) return refByTg.id;

      return null;
    };

    if (!user) {
      // ЛОГИКА ДЛЯ НОВОГО ПОЛЬЗОВАТЕЛЯ
      let level: 'Standard' | 'Pro' | 'Partner' = 'Standard';
      let bonus = 15.0;

      if (startParam === 'partner' || (typeof startParam === 'string' && startParam.startsWith('partner_'))) {
        level = 'Partner';
        bonus = 50.0;
      }

      const referrerId = await getReferrerId(startParam as string);

      user = await prisma.user.create({
        data: {
          telegramId,
          tgChatId: telegramId,
          username,
          firstName: firstName || lastName || 'User',
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
        include: { 
          wallet: true,
          referrer: { select: { firstName: true } }
        },
      });
    } else {
      // ОБНОВЛЕНИЕ ДАННЫХ ДЕЙСТВУЮЩЕГО ПОЛЬЗОВАТЕЛЯ
      const updateData: any = {
        username: username || user.username,
        firstName: firstName || lastName || user.firstName,
        tgChatId: telegramId, // Сохраняем Chat ID для уведомлений
        lastSeen: new Date(),
      };

      // Если у пользователя еще нет реферера, пробуем установить его сейчас
      if (!user.referrerId && startParam) {
        const refId = await getReferrerId(startParam as string, user.id);
        if (refId) updateData.referrerId = refId;
      }

      user = await prisma.user.update({
        where: { telegramId },
        data: updateData,
        include: { 
          wallet: true,
          referrer: { select: { firstName: true } }
        },
      });
    }

    // Проверка блокировки
    if (user.isBlocked) {
      return NextResponse.json({ error: 'Ваш аккаунт заблокирован' }, { status: 403 });
    }

    // Если это новый реферал (был создан только что с referrerId)
    const isNewReferral = !!(user.referrerId && (new Date().getTime() - new Date(user.createdAt).getTime() < 60000));
    const referrerName = user.referrer?.firstName || null;

    // Создаем JWT
    const token = await signJwt({ 
      userId: user.id, 
      telegramId: user.telegramId,
      role: user.level
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: true, // Обязательно true для Телеграм
      sameSite: 'none', // <-- КРИТИЧЕСКИ ВАЖНО ДЛЯ TELEGRAM WEB APP
      maxAge: 60 * 60 * 24, // 24 часа
      path: '/',
    });

    return NextResponse.json({ 
      success: true, 
      user, 
      token,
      isNewReferral,
      referrerName
    });
  } catch (error) {
    console.error('Telegram Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

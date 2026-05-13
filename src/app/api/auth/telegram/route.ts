import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateTelegramWebAppData, signJwt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json(
        { error: 'initData is required' },
        { status: 400 }
      );
    }

    const authData = validateTelegramWebAppData(initData);
    if (!authData) {
      return NextResponse.json(
        { error: 'Invalid initData: signature mismatch' },
        { status: 401 }
      );
    }

    const userData = authData.user;
    if (!userData || !userData.id) {
      return NextResponse.json(
        { error: 'Invalid user data in initData' },
        { status: 400 }
      );
    }

    const telegramId = String(userData.id);
    const username = userData.username || null;
    const firstName = userData.first_name || null;
    const lastName = userData.last_name || null;
    const languageCode = userData.language_code || 'ru';
    const startParam = authData.start_param;

    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: { wallet: true },
    });

    if (!user) {
      // NEW USER REGISTRATION
      
      // Get bonus settings
      const bonusSetting = await prisma.systemSetting.findUnique({ where: { key: 'WELCOME_BONUS' } });
      const standardBonus = bonusSetting ? parseFloat(bonusSetting.value) : 15.0;

      let level: 'Standard' | 'Pro' | 'Partner' = 'Standard';
      let bonus = standardBonus;

      // Logic for Partner level via start_param
      if (startParam === 'partner' || startParam?.startsWith('partner_')) {
        level = 'Partner';
        bonus = 50.0;
      }

      // Logic for Referrals
      let referrerId = null;
      if (startParam && startParam.startsWith('ref_')) {
        const refId = startParam.replace('ref_', '');
        const referrer = await prisma.user.findUnique({ where: { id: refId } });
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      user = await prisma.user.create({
        data: {
          telegramId,
          username,
          firstName: firstName || lastName,
          language: languageCode === 'tm' ? 'TM' : languageCode === 'en' ? 'EN' : 'RU',
          level: level,
          depositAmount: 0,
          dailyLimit: level === 'Partner' ? 1000 : 150, // Higher limit for partners
          tradesCount: 0,
          volumeTotal: 0,
          referrerId,
          wallet: {
            create: {
              usdtBalance: 0.0,
              tmtBalance: 0.0,
              bonusBalance: bonus,
            },
          },
        },
        include: { wallet: true },
      });
    } else {
      // EXISTING USER LOGIN
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

    // Create JWT token
    const token = await signJwt({ 
      userId: user.id, 
      telegramId: user.telegramId,
      role: user.level
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        level: user.level,
        depositAmount: user.depositAmount,
        dailyLimit: user.dailyLimit,
        tradesCount: user.tradesCount,
        volumeTotal: user.volumeTotal,
        isVerified: user.isVerified,
        kycStatus: user.kycStatus,
        language: user.language,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        wallet: user.wallet,
      },
      token // Also return token in body for convenience if needed
    });
  } catch (error) {
    console.error('Telegram Auth Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
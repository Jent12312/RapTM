import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const SECRET_KEY = process.env.TELEGRAM_BOT_TOKEN || '';

function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function validateInitData(initData: string, secretKey: string): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKeyHash = crypto
      .createHmac('sha256', 'WebAppData')
      .update(secretKey)
      .digest();

    const generatedHash = crypto
      .createHmac('sha256', secretKeyHash)
      .update(dataCheckString)
      .digest('hex');

    return generatedHash === hash;
  } catch {
    return false;
  }
}

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

    const isValid = validateInitData(initData, SECRET_KEY);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid initData: signature mismatch' },
        { status: 401 }
      );
    }

    const parsed = parseInitData(initData);
    const userData = parsed.user ? JSON.parse(parsed.user) : null;

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

    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: { wallet: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          username,
          firstName: firstName || lastName,
          language: languageCode,
          level: 'Standard',
          depositAmount: 0,
          dailyLimit: 150,
          tradesCount: 0,
          volumeTotal: 0,
          wallet: {
            create: {
              usdtBalance: 0.0,
              tmtBalance: 0.0,
              bonusBalance: 15.0,
            },
          },
        },
        include: { wallet: true },
      });
    } else {
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
        wallet: user.wallet,
      },
    });
  } catch (error) {
    console.error('Telegram Auth Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
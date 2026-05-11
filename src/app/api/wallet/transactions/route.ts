import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAdminNotification } from '@/lib/telegram';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';
import { logAction } from '@/lib/logger';
import { validateTransactionAml } from '@/lib/aml-service';
import { verifyTwoFactorToken } from '@/lib/2fa';

const transactionSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  method: z.enum(['CRYPTO', 'CASH', 'P2P', 'CODE']).default('CRYPTO'),
  asset: z.string().default('USDT'),
  network: z.string().optional().nullable(),
  amount: z.number().positive(),
  address: z.string().optional().nullable(),
  txId: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
});

const MIN_DEPOSIT_AMOUNTS: Record<string, number> = {
  USDT: 1,
  TMT: 5,
};

const MIN_WITHDRAWAL_AMOUNTS: Record<string, number> = {
  USDT: 5,
  TMT: 10,
};

const CASH_CITIES = ['Ашхабад', 'Туркменабад', 'Мары', 'Дашогуз', 'Балканабад'];

import { validateRequest } from '@/lib/api-utils';
import { paginationSchema } from '@/lib/validations/common';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser(true); // Check if blocked
    if (!authUser) return NextResponse.json({ error: 'Unauthorized or Blocked' }, { status: 401 });

    // Валидация пагинации через общую утилиту
    const { data: query, error } = await validateRequest(req, paginationSchema, 'query');
    if (error) return error;

    const { limit, offset } = query;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = { userId: authUser.userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    console.error('Get Transactions Error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const authUser = await getAuthUser(true); // Enforce block check
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized or Blocked' }, { status: 401 });
    }

    const userId = authUser.userId;

    // 1. Rate Limiting (5 requests per second)
    const { isRateLimited } = await import('@/lib/rate-limiter');
    if (isRateLimited(authUser.telegramId)) {
      return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = transactionSchema.safeParse({
      ...body,
      amount: Number(body.amount),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { type, method, asset, network, amount, address, txId, city, code } = parsed.data;

    // Fetch user with wallet for security checks
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Mandatory 2FA for Pro/Partner levels on Withdrawal
    if (type === 'WITHDRAWAL' && (user.level === 'Pro' || user.level === 'Partner')) {
      if (!user.twoFactorEnabled) {
        return NextResponse.json({ 
          error: '2FA_MANDATORY', 
          message: 'Security policy: Pro/Partner users must enable 2FA to withdraw funds.' 
        }, { status: 403 });
      }
    }

    if (type === 'WITHDRAWAL' && user.twoFactorEnabled) {
      const twoFactorToken = req.headers.get('x-2fa-token');
      if (!twoFactorToken) {
        return NextResponse.json({ error: '2FA_REQUIRED', message: '2FA token required for withdrawal' }, { status: 403 });
      }
      const isValid = verifyTwoFactorToken(twoFactorToken, user.twoFactorSecret!);
      
      if (!isValid) {
        await logAction({
          userId,
          action: 'SECURITY_ALERT',
          severity: 'CRITICAL',
          details: 'Failed 2FA attempt on withdrawal',
          ip,
          userAgent
        });
        return NextResponse.json({ error: 'Invalid 2FA token' }, { status: 401 });
      }
    }

    // 3. Velocity Check (Anomaly detection)
    if (type === 'WITHDRAWAL') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const stats = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo }
        },
        _avg: { amount: true },
        _count: { id: true }
      });

      const avgAmount = stats._avg.amount ? Number(stats._avg.amount) : 10; // Default small threshold
      if (stats._count.id > 5 && amount > avgAmount * 10) {
        // High velocity alert!
        await logAction({
          userId,
          action: 'VELOCITY_ALERT',
          severity: 'WARNING',
          details: `Large withdrawal: ${amount} (Avg: ${avgAmount}). Transaction flagged for review.`,
          ip,
          userAgent
        });
        
        await sendAdminNotification(
          `⚠️ <b>VELOCITY ALERT!</b>\n\n` +
          `👤 <b>Юзер:</b> @${user.username || user.firstName}\n` +
          `💰 <b>Сумма:</b> ${amount} ${asset}\n` +
          `📈 <b>Среднее за 30д:</b> ${avgAmount.toFixed(2)}\n` +
          `ℹ️ Транзакция требует повышенного внимания.`
        );
      }
    }

    // AML Check for Crypto transactions
    if (method === 'CRYPTO' && (address || txId)) {
      const amlResult = await validateTransactionAml({
        userId,
        address: address || txId || '',
        network: network || 'USDT',
        amount,
      });

      if (!amlResult.isSafe || amlResult.riskScore > 70) {
        await logAction({
          userId,
          action: 'AML_ALERT',
          severity: 'CRITICAL',
          details: `AML risk score ${amlResult.riskScore} for ${type}: ${amlResult.reason}`,
          ip,
          userAgent
        });
        return NextResponse.json({ 
          error: 'AML check failed', 
          message: 'Your transaction has been flagged for manual review due to high risk score.' 
        }, { status: 403 });
      }
    }

    // WITHDRAWAL LOGIC (Double Spending Protection)
    if (type === 'WITHDRAWAL') {
      if (user.kycStatus !== 'VERIFIED' && amount > 100) {
         return NextResponse.json({ error: 'Please complete KYC to withdraw large amounts' }, { status: 403 });
      }

      const minAmount = MIN_WITHDRAWAL_AMOUNTS[asset] || 5;
      if (amount < minAmount) {
        return NextResponse.json({ error: `Минимальная сумма вывода: ${minAmount} ${asset}` }, { status: 400 });
      }

      const balanceField = asset === 'USDT' ? 'usdtBalance' : 'tmtBalance';
      
      // Atomic Transaction: Check -> Deduct -> Create
      const result = await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId },
          select: { [balanceField]: true }
        });

        const currentBalance = Number(wallet?.[balanceField as keyof typeof wallet] || 0);
        if (currentBalance < amount) {
          throw new Error('Insufficient funds');
        }

        const updatedWallet = await tx.wallet.update({
          where: { userId },
          data: { [balanceField]: { decrement: amount } },
        });

        const transaction = await tx.transaction.create({
          data: {
            userId,
            type,
            method,
            asset,
            network: network || null,
            amount,
            address,
            ip,
            status: 'PENDING',
          },
        });

        return { updatedWallet, transaction };
      });

      await logAction({
        userId,
        action: 'WITHDRAWAL_CREATED',
        severity: 'INFO',
        details: `${amount} ${asset} via ${method}`,
        ip,
        userAgent
      });

      await sendAdminNotification(
        `📤 <b>Заявка на вывод ${asset}!</b>\n\n` +
        `💰 <b>Сумма:</b> ${amount} ${asset}\n` +
        `🔗 <b>Метод:</b> ${method}\n` +
        `${network ? `🌐 <b>Сеть:</b> ${network}\n` : ''}` +
        `${address ? `📍 <b>Адрес:</b> <code>${address}</code>\n` : ''}` +
        `👤 <b>Юзер:</b> @${user.username || user.firstName} (${user.level})`
      );

      return NextResponse.json({ success: true, transaction: result.transaction });
    }

    // DEPOSIT LOGIC
    if (type === 'DEPOSIT') {
      const minAmount = MIN_DEPOSIT_AMOUNTS[asset] || 1;
      if (amount < minAmount) {
        return NextResponse.json({ error: `Минимальная сумма депозита: ${minAmount} ${asset}` }, { status: 400 });
      }

      const transaction = await prisma.transaction.create({
        data: {
          userId,
          type,
          method,
          asset,
          network: network || null,
          amount,
          txId: txId || null,
          city: city || null,
          code: code || null,
          status: 'PENDING',
        },
      });

      await logAction({
        userId,
        action: 'DEPOSIT_CREATED',
        severity: 'INFO',
        details: `${amount} ${asset} via ${method}`,
        ip,
        userAgent
      });

      await sendAdminNotification(
        `📥 <b>Новое пополнение ${asset}!</b>\n\n` +
        `💰 <b>Сумма:</b> ${amount} ${asset}\n` +
        `🔗 <b>Метод:</b> ${method}\n` +
        `👤 <b>Юзер:</b> @${user.username || user.firstName} (${user.level})`
      );

      return NextResponse.json({ success: true, transaction });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Transaction Error:', error);
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
  }
}
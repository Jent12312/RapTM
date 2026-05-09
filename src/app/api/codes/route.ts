// src/app/api/codes/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';
import crypto from 'crypto';

const createCodeSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USDT'),
});

const redeemCodeSchema = z.object({
  code: z.string().min(5),
});

// Получить историю кодов пользователя (созданные и активированные)
export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'created' | 'redeemed' | 'all'

    let whereClause: any = {};

    if (type === 'created') {
      whereClause.creatorId = authUser.userId;
    } else if (type === 'redeemed') {
      whereClause.redeemerId = authUser.userId;
    } else {
      whereClause = {
        OR: [
          { creatorId: authUser.userId },
          { redeemerId: authUser.userId }
        ]
      };
    }

    const codes = await prisma.code.findMany({
      where: whereClause,
      include: {
        creator: {
          select: { id: true, firstName: true, username: true, avatarUrl: true }
        },
        redeemer: {
          select: { id: true, firstName: true, username: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(codes);
  } catch (error) {
    console.error('Get codes error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    
    // REDEEM CODE
    if (body.action === 'redeem') {
      const parsed = redeemCodeSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });

      const { code } = parsed.data;

      const codeRecord = await prisma.code.findUnique({
        where: { code }
      });

      if (!codeRecord || codeRecord.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Code is invalid or already used' }, { status: 400 });
      }

      if (new Date() > codeRecord.expiresAt) {
        return NextResponse.json({ error: 'Code has expired' }, { status: 400 });
      }

      if (codeRecord.creatorId === authUser.userId) {
        return NextResponse.json({ error: 'You cannot redeem your own code' }, { status: 400 });
      }

      const result = await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: authUser.userId },
          data: { usdtBalance: { increment: codeRecord.amount } }
        }),
        prisma.code.update({
          where: { id: codeRecord.id },
          data: {
            status: 'USED',
            redeemerId: authUser.userId,
            usedAt: new Date()
          }
        }),
        prisma.transaction.create({
          data: {
            userId: authUser.userId,
            type: 'DEPOSIT',
            method: 'CODE',
            amount: codeRecord.amount,
            asset: codeRecord.currency,
            status: 'COMPLETED',
            code: codeRecord.code
          }
        })
      ]);

      return NextResponse.json({ success: true, amount: codeRecord.amount });
    }

    // CREATE CODE
    const parsed = createCodeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    const { amount, currency } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet || Number(user.wallet.usdtBalance) < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const rawCode = `TM-USDT-${amount}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const [ , newCode ] = await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: authUser.userId },
        data: { usdtBalance: { decrement: amount } }
      }),
      prisma.code.create({
        data: {
          code: rawCode,
          codeHash,
          amount,
          currency,
          creatorId: authUser.userId,
          expiresAt,
          status: 'ACTIVE'
        }
      }),
      prisma.transaction.create({
        data: {
          userId: authUser.userId,
          type: 'WITHDRAWAL',
          method: 'CODE',
          amount,
          asset: currency,
          status: 'COMPLETED',
          code: rawCode
        }
      })
    ]);

    return NextResponse.json({ success: true, code: newCode });

  } catch (error) {
    console.error('Code API Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// src/app/api/user/[id]/referrals/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;

    // Только сам пользователь или админ может видеть эту информацию
    if (id !== authUser.userId && !authUser.role?.includes('Admin')) {
       // Проверка isAdmin в базе если роль не в JWT
       const requestingUser = await prisma.user.findUnique({ where: { id: authUser.userId } });
       if (!requestingUser?.isAdmin) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        referrals: {
          select: {
            id: true,
            username: true,
            nickname: true,
            firstName: true,
            tradesCount: true,
            createdAt: true,
            volumeTotal: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        wallet: {
          select: {
            referralBonus: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalReferrals = user.referrals.length;
    const activeReferrals = user.referrals.filter(r => r.tradesCount > 0).length;
    const totalEarned = user.wallet?.referralBonus || 0;

    return NextResponse.json({
      totalReferrals,
      activeReferrals,
      totalEarned,
      referrals: user.referrals
    });

  } catch (error) {
    console.error('Fetch referrals error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

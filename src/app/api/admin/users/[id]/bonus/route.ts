// src/app/api/admin/users/[id]/bonus/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const { amount, action } = await req.json(); // action: 'add' or 'subtract'

    const change = Number(amount) * (action === 'add' ? 1 : -1);

    const wallet = await prisma.wallet.update({
      where: { userId: id },
      data: { bonusBalance: { increment: change } }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: id,
        type: 'BONUS',
        method: 'SYSTEM',
        amount: Math.abs(change),
        asset: 'USDT',
        status: 'COMPLETED',
        adminNote: `Админ-корректировка: ${action === 'add' ? '+' : '-'}${amount}`
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: authUser.userId,
        action: 'BONUS_ADJUST',
        targetId: id,
        details: `${action === 'add' ? 'Начислено' : 'Списано'} ${amount} бонусов`
      }
    });

    return NextResponse.json({ success: true, wallet });
  } catch (error) {
    console.error('Bonus adjust error:', error);
    return NextResponse.json({ error: 'Failed to adjust bonus' }, { status: 500 });
  }
}

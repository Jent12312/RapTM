import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';

const levelSchema = z.object({
  level: z.enum(['Standard', 'Pro', 'Partner']),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check if authUser is Admin
    const admin = await prisma.user.findUnique({
      where: { id: authUser.userId }
    });

    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: targetUserId } = await context.params;
    const body = await req.json();
    const parsed = levelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    const { level } = parsed.data;

    // Determine bonus if upgrading
    let bonusIncrement = 0;
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { wallet: true }
    });

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Bonus logic: 
    if (level === 'Partner' && targetUser.level !== 'Partner') {
      bonusIncrement = 50.0;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { 
        level,
        wallet: bonusIncrement > 0 ? {
          update: {
            usdtBalance: { increment: bonusIncrement }
          }
        } : undefined
      },
      include: { wallet: true }
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error('Level update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

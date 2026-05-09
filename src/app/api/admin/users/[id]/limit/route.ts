// src/app/api/admin/users/[id]/limit/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const { dailyLimit } = await req.json();

    const user = await prisma.user.update({
      where: { id },
      data: { dailyLimit: Number(dailyLimit) },
      include: { wallet: true }
    });

    // Log action
    await prisma.adminAction.create({
      data: {
        adminId: authUser.userId,
        action: 'LIMIT_CHANGE',
        targetId: id,
        details: `Лимит изменен на ${dailyLimit}`
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Update limit error:', error);
    return NextResponse.json({ error: 'Failed to update limit' }, { status: 500 });
  }
}

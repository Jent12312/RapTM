// src/app/api/admin/users/[id]/block/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const { action } = await req.json(); // 'block' or 'unblock'
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const isBlocked = action === 'block';

    const user = await prisma.user.update({
      where: { id },
      data: { isBlocked },
      include: { wallet: true }
    });

    // Log action
    await prisma.adminAction.create({
      data: {
        adminId: authUser.userId,
        action: isBlocked ? 'BLOCK' : 'UNBLOCK',
        targetId: id,
        details: `Пользователь ${isBlocked ? 'заблокирован' : 'разблокирован'}`,
        ip
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

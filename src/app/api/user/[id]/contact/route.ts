// src/app/api/user/[id]/contact/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { phone, email } = body;

    const updateData: any = {};
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Contact update error:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

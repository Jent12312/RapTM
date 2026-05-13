import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';

export async function GET() {
  const user = await getAuthUser();
  if (!user || !user.isAdmin) return NextResponse.json({ success: false }, { status: 403 });

  const applications = await prisma.levelApplication.findMany({
    where: { status: 'PENDING' },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ success: true, applications });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user || !user.isAdmin) return NextResponse.json({ success: false }, { status: 403 });

  const { id, status } = await req.json();
  
  const app = await prisma.levelApplication.update({
    where: { id },
    data: { status },
    include: { user: true }
  });

  if (status === 'VERIFIED') {
    await prisma.user.update({
      where: { id: app.userId },
      data: { 
        level: app.level
      }
    });
  }

  return NextResponse.json({ success: true });
}

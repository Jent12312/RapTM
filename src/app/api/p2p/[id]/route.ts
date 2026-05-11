// src/app/api/p2p/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Получить одно объявление (для deep links)
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const ad = await prisma.p2PAd.findUnique({
      where: { id, isDeleted: false },
      include: { user: { select: { id: true, username: true, firstName: true, avatarUrl: true, tradesCount: true, level: true, isVerified: true, rating: true, telegramId: true } } }
    });
    
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, ad });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ad' }, { status: 500 });
  }
}

// Обновить статус (Вкл/Выкл)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // <-- В Next.js 15 параметры нужно "дождаться"
    const body = await req.json();
    const { isActive } = body;
    
    const updatedAd = await prisma.p2PAd.update({
      where: { id },
      data: { isActive }
    });
    
    return NextResponse.json({ success: true, ad: updatedAd });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 });
  }
}

// Удалить объявление навсегда
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // <-- То же самое здесь
    
    await prisma.p2PAd.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Обновить статус (Вкл/Выкл)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { isActive } = body;
    
    const updatedAd = await prisma.p2PAd.update({
      where: { id: params.id },
      data: { isActive }
    });
    
    return NextResponse.json({ success: true, ad: updatedAd });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ad' }, { status: 500 });
  }
}

// Удалить объявление навсегда
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.p2PAd.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 });
  }
}
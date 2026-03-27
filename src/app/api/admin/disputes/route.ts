import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Ищем все сделки со статусом спора (и не завершенные)
    const disputes = await prisma.order.findMany({
      where: { 
        isDisputed: true,
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      },
      include: { 
        ad: true, 
        buyer: true, 
        seller: true,
        messages: { orderBy: { createdAt: 'asc' } } 
      },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(disputes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
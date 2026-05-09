// src/app/api/admin/transactions/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const requests = await prisma.transaction.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, action } = await req.json(); // action: 'approve' | 'reject'

    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!tx || tx.status !== 'PENDING') return NextResponse.json({ error: 'Заявка не найдена' }, { status: 400 });

    if (action === 'approve') {
      if (tx.type === 'DEPOSIT') {
        // Пополнение: начисляем баланс
        await prisma.$transaction([
          prisma.wallet.update({
            where: { userId: tx.userId },
            data: { usdtBalance: { increment: tx.amount } }
          }),
          prisma.transaction.update({
            where: { id },
            data: { status: 'COMPLETED' }
          })
        ]);
      } else {
        // Вывод: просто меняем статус, админ уже отправил крипту руками
        await prisma.transaction.update({
          where: { id },
          data: { status: 'COMPLETED' }
        });
      }
    } 
    
    else if (action === 'reject') {
      if (tx.type === 'WITHDRAWAL') {
        // Отказ в выводе: возвращаем деньги на баланс
        await prisma.$transaction([
          prisma.wallet.update({
            where: { userId: tx.userId },
            data: { usdtBalance: { increment: tx.amount } }
          }),
          prisma.transaction.update({
            where: { id },
            data: { status: 'CANCELLED' }
          })
        ]);
      } else {
        // Отказ в пополнении (фейковый TxID)
        await prisma.transaction.update({
          where: { id },
          data: { status: 'CANCELLED' }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
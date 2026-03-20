// src/app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { ad: true, seller: true, buyer: true, review: true }
    });
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { ad: true, seller: true, buyer: true }
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Если это успешное завершение сделки по USDT
    if (status === 'COMPLETED' && order.status !== 'COMPLETED' && order.ad.asset === 'USDT') {
      
      // Выполняем транзакцию и ЗАБИРАЕМ результат обновления ордера
      const [ , , updatedOrder ] = await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: order.sellerId },
          data: { usdtBalance: { decrement: order.amountAsset } }
        }),
        prisma.wallet.update({
          where: { userId: order.buyerId },
          data: { usdtBalance: { increment: order.amountAsset } }
        }),
        prisma.order.update({
          where: { id },
          data: { status: 'COMPLETED' },
          include: { ad: true, seller: true, buyer: true } // Обязательно возвращаем связи!
        })
      ]);

      // Возвращаем обновленный ордер
      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // Для остальных статусов (например PAID)
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { ad: true, seller: true, buyer: true } // Тоже возвращаем связи
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Transaction Error:", error);
    return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
  }
}
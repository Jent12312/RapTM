// src/app/api/admin/exchange/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const requests = await prisma.exchangeRequest.findMany({
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
    const body = await req.json();
    const { id, action } = body; // action: 'approve' | 'reject'

    const exchange = await prisma.exchangeRequest.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!exchange || exchange.status !== 'PENDING') {
      return NextResponse.json({ error: 'Заявка не найдена или уже обработана' }, { status: 400 });
    }

    if (action === 'approve') {
      if (exchange.direction === 'USDT_TO_TMT') {
        // USDT и комиссия уже списаны при создании заявки
        await prisma.exchangeRequest.update({
          where: { id },
          data: { status: 'COMPLETED' }
        });
      } else if (exchange.direction === 'TMT_TO_USDT') {
        // Зачисляем пользователю USDT (комиссия была списана при создании)
        await prisma.$transaction([
          prisma.wallet.update({
            where: { userId: exchange.userId },
            data: { usdtBalance: { increment: exchange.amountUsdt } }
          }),
          prisma.exchangeRequest.update({
            where: { id },
            data: { status: 'COMPLETED' }
          })
        ]);
      }
    } 
    
    else if (action === 'reject') {
      if (exchange.direction === 'USDT_TO_TMT') {
        // Возвращаем USDT + комиссию
        await prisma.$transaction([
          prisma.wallet.update({
            where: { userId: exchange.userId },
            data: { usdtBalance: { increment: Number(exchange.amountUsdt) + Number(exchange.commission) } }
          }),
          prisma.exchangeRequest.update({
            where: { id },
            data: { status: 'CANCELLED' }
          })
        ]);
      } else if (exchange.direction === 'TMT_TO_USDT') {
        // Возвращаем только комиссию (TMT пользователь не передавал или админ не подтвердил)
        await prisma.$transaction([
          prisma.wallet.update({
            where: { userId: exchange.userId },
            data: { usdtBalance: { increment: exchange.commission } }
          }),
          prisma.exchangeRequest.update({
            where: { id },
            data: { status: 'CANCELLED' }
          })
        ]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Exchange Action Error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
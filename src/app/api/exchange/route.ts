// src/app/api/exchange/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAdminNotification } from '@/lib/telegram';

// Получить историю обменов пользователя
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const requests = await prisma.exchangeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// Создать заявку на обмен
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, direction, amountUsdt, amountTmt, userPhone } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'User or wallet not found' }, { status: 404 });
    }

    let exchange;

    // СЦЕНАРИЙ 1: USDT -> TMT (Списываем USDT сразу)
    if (direction === 'USDT_TO_TMT') {
      if (user.wallet.usdtBalance < amountUsdt) {
        return NextResponse.json({ error: 'Недостаточно USDT' }, { status: 400 });
      }

      // Используем транзакцию: создаем заявку + списываем баланс одновременно
      const transactionResult = await prisma.$transaction([
        prisma.wallet.update({
          where: { userId },
          data: { usdtBalance: { decrement: amountUsdt } }
        }),
        prisma.exchangeRequest.create({
          data: { userId, direction, amountUsdt, amountTmt, userPhone, status: 'PENDING' }
        })
      ]);
      exchange = transactionResult[1];
    }

    // СЦЕНАРИЙ 2: TMT -> USDT (Просто создаем заявку, баланс пополним при подтверждении админом)
    else if (direction === 'TMT_TO_USDT') {
      exchange = await prisma.exchangeRequest.create({
        data: { userId, direction, amountUsdt, amountTmt, status: 'PENDING' }
      });
    }

    // Уведомление админам
    const typeLabel = direction === 'USDT_TO_TMT' ? 'Продажа USDT (надо отправить Манаты)' : 'Покупка USDT (надо начислить USDT)';
    await sendAdminNotification(
      `🚨 <b>Новая заявка на обмен!</b>\n\n` +
      `💱 <b>Тип:</b> ${typeLabel}\n` +
      `💰 <b>Сумма:</b> ${amountUsdt} USDT ↔ ${amountTmt} TMT\n` +
      `👤 <b>Пользователь:</b> @${user.username || user.firstName}\n` +
      `📱 <b>Телефон:</b> ${userPhone || 'Перевод на карту админа'}`
    );

    return NextResponse.json({ success: true, exchange });
  } catch (error) {
    console.error('Exchange error:', error);
    return NextResponse.json({ error: 'Failed to create exchange' }, { status: 500 });
  }
}
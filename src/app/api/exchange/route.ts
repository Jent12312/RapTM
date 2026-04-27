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

    // Получаем текущие настройки (курс и комиссию)
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['EXCHANGE_RATE', 'EXCHANGE_FEE'] } }
    });
    
    const settingsMap = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, { EXCHANGE_RATE: '19.5', EXCHANGE_FEE: '1' });

    const currentRate = parseFloat(settingsMap.EXCHANGE_RATE);
    const feePercent = parseFloat(settingsMap.EXCHANGE_FEE);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'User or wallet not found' }, { status: 404 });
    }

    // Расчет комиссии в USDT
    const fee = (amountUsdt * feePercent) / 100;
    let exchange;

    // СЦЕНАРИЙ 1: USDT -> TMT (Списываем USDT + комиссию сразу)
    if (direction === 'USDT_TO_TMT') {
      const totalToDeduct = amountUsdt; // Сумма обмена. Комиссия рассчитывается отдельно.
      // Логика из запроса: Комиссия с бонусного счета -> основной USDT
      let bonusDeduction = 0;
      let mainBalanceDeduction = totalToDeduct; // Основная сумма обмена всегда с основного
      let feeDeductionFromBonus = 0;
      let feeDeductionFromMain = 0;

      if (user.wallet.bonusBalance >= fee) {
        feeDeductionFromBonus = fee;
      } else {
        feeDeductionFromBonus = user.wallet.bonusBalance;
        feeDeductionFromMain = fee - user.wallet.bonusBalance;
      }

      if (user.wallet.usdtBalance < (mainBalanceDeduction + feeDeductionFromMain)) {
        return NextResponse.json({ error: 'Недостаточно USDT (учитывая комиссию)' }, { status: 400 });
      }

      // Используем транзакцию
      const transactionResult = await prisma.$transaction([
        prisma.wallet.update({
          where: { userId },
          data: { 
            usdtBalance: { decrement: mainBalanceDeduction + feeDeductionFromMain },
            bonusBalance: { decrement: feeDeductionFromBonus }
          }
        }),
        prisma.exchangeRequest.create({
          data: { 
            userId, 
            direction, 
            amountUsdt, 
            amountTmt, 
            userPhone, 
            status: 'PENDING',
            commission: fee 
          }
        })
      ]);
      exchange = transactionResult[1];
    }

    // СЦЕНАРИЙ 2: TMT -> USDT (Баланс пополним при подтверждении админом, но комиссию считаем)
    else if (direction === 'TMT_TO_USDT') {
      // При покупке USDT комиссия обычно вычитается из зачисляемой суммы при одобрении,
      // но мы запишем её в заявку сейчас.
      exchange = await prisma.exchangeRequest.create({
        data: { 
          userId, 
          direction, 
          amountUsdt, 
          amountTmt, 
          status: 'PENDING',
          commission: fee
        }
      });
    }

    // Уведомление админам
    const typeLabel = direction === 'USDT_TO_TMT' ? 'Продажа USDT' : 'Покупка USDT';
    await sendAdminNotification(
      `🚨 <b>Новая заявка на обмен!</b>\n\n` +
      `💱 <b>Тип:</b> ${typeLabel}\n` +
      `💰 <b>Сумма:</b> ${amountUsdt} USDT ↔ ${amountTmt} TMT\n` +
      `💸 <b>Комиссия:</b> ${fee.toFixed(2)} USDT\n` +
      `👤 <b>Пользователь:</b> @${user.username || user.firstName}\n` +
      `📱 <b>Телефон:</b> ${userPhone || 'Перевод на карту админа'}`
    );

    return NextResponse.json({ success: true, exchange });
  } catch (error) {
    console.error('Exchange error:', error);
    return NextResponse.json({ error: 'Failed to create exchange' }, { status: 500 });
  }
}
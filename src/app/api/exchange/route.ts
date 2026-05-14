// src/app/api/exchange/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAdminNotification } from '@/lib/telegram';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';

const exchangeSchema = z.object({
  direction: z.enum(['USDT_TO_TMT', 'TMT_TO_USDT']),
  amountUsdt: z.number().positive(),
  amountTmt: z.number().positive(),
  userPhone: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const requests = await prisma.exchangeRequest.findMany({
      where: { userId: authUser.userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Fetch exchanges error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = exchangeSchema.safeParse({
      ...body,
      amountUsdt: Number(body.amountUsdt),
      amountTmt: Number(body.amountTmt),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { direction, amountUsdt, amountTmt, userPhone } = parsed.data;
    const userId = authUser.userId;

    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['EXCHANGE_RATE', 'EXCHANGE_FEE'] } }
    });
    
    const settingsMap = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, { EXCHANGE_RATE: '19.5', EXCHANGE_FEE: '1' });

    const currentRate = parseFloat(settingsMap.EXCHANGE_RATE);
    const feeConfig = parseFloat(settingsMap.EXCHANGE_FEE || '20'); // Ожидаем сумму в TMT или проценты? Судя по коду было 20 TMT.
    
    // Если в настройках число > 10, считаем это фиксированной суммой в TMT. Если < 10, возможно это проценты (но старый код использовал фикс).
    // Для совместимости со старым кодом (где было 20 TMT) используем значение как фиксированную сумму в TMT.
    const fee = feeConfig / currentRate;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'User or wallet not found' }, { status: 404 });
    }
    
    // Подготовка списания комиссии (Бонус -> USDT)
    let feeDeductionFromBonus = 0;
    let feeDeductionFromMain = 0;

    if (Number(user.wallet.bonusBalance) >= fee) {
      feeDeductionFromBonus = fee;
    } else {
      feeDeductionFromBonus = Number(user.wallet.bonusBalance);
      feeDeductionFromMain = fee - feeDeductionFromBonus;
    }

    let exchange;

    if (direction === 'USDT_TO_TMT') {
      // При продаже USDT: списываем сумму продажи + комиссию
      if (Number(user.wallet.usdtBalance) < (amountUsdt + feeDeductionFromMain)) {
        return NextResponse.json({ error: 'Недостаточно USDT (учитывая комиссию)' }, { status: 400 });
      }

      const transactionResult = await prisma.$transaction([
        prisma.wallet.update({
          where: { userId },
          data: { 
            usdtBalance: { decrement: amountUsdt + feeDeductionFromMain },
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
    } else {
      // При покупке USDT (TMT_TO_USDT):
      if (Number(user.wallet.tmtBalance) < amountTmt) {
        return NextResponse.json({ error: 'Недостаточно TMT на балансе' }, { status: 400 });
      }

      // Списываем комиссию (в USDT/Bonus) + сумму TMT сейчас, а USDT зачислит админ при одобрении
      const transactionResult = await prisma.$transaction([
        prisma.wallet.update({
          where: { userId },
          data: { 
            tmtBalance: { decrement: amountTmt },
            usdtBalance: { decrement: feeDeductionFromMain },
            bonusBalance: { decrement: feeDeductionFromBonus }
          }
        }),
        prisma.exchangeRequest.create({
          data: { 
            userId, 
            direction, 
            amountUsdt, 
            amountTmt, 
            status: 'PENDING',
            commission: fee
          }
        })
      ]);
      exchange = transactionResult[1];
    }

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
// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/telegram';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { calculateP2PFee } from '@/lib/fees';

import { validateRequest } from '@/lib/api-utils';
import { createP2POrderSchema } from '@/lib/validations/common';

export async function POST(req: Request) {
  try {
    // 1. Проверка авторизации
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Валидация запроса через общую утилиту
    const { data, error } = await validateRequest(req, createP2POrderSchema);
    if (error) {
      console.warn('Validation error creating order:', error);
      return error;
    }

    const { adId, amountAsset: amountAssetNum, amountFiat: amountFiatNum } = data;
    const takerId = authUser.userId;

    const amountAsset = new Prisma.Decimal(amountAssetNum);
    const amountFiat = new Prisma.Decimal(amountFiatNum);

    // 3. Поиск объявления
    const ad = await prisma.p2PAd.findUnique({ 
      where: { id: adId },
      include: { user: true } 
    });
    
    if (!ad) {
      return NextResponse.json({ error: 'Объявление не найдено' }, { status: 404 });
    }
    
    if (!ad.isActive) {
      return NextResponse.json({ error: 'Объявление больше не активно' }, { status: 400 });
    }

    // 4. ПРАВИЛЬНОЕ РАСПРЕДЕЛЕНИЕ РОЛЕЙ
    const isBuyAd = ad.type === 'BUY';
    
    let buyerId: string;
    let sellerId: string;

    if (isBuyAd) {
      buyerId = ad.userId;
      sellerId = takerId;
    } else {
      buyerId = takerId;
      sellerId = ad.userId;
    }

    if (buyerId === sellerId) {
      return NextResponse.json({ error: 'Нельзя открыть сделку по собственному объявлению' }, { status: 400 });
    }

    // 5. ПРОВЕРКА БАЛАНСА ПРОДАВЦА
    const seller = await prisma.user.findUnique({ 
      where: { id: sellerId }, 
      include: { wallet: true } 
    });

    if (!seller || !seller.wallet) {
      return NextResponse.json({ error: 'Кошелек продавца не найден' }, { status: 404 });
    }

    // Расчет комиссии
    let feeAmount = new Prisma.Decimal(0);
    try {
      const settings = await prisma.systemSetting.findMany({ where: { key: 'EXCHANGE_RATE' } });
      const exchangeRate = parseFloat(settings[0]?.value || '19.5');
      
      const feeNum = calculateP2PFee(amountAssetNum, ad.fiat, seller.level, exchangeRate);
      feeAmount = new Prisma.Decimal(feeNum).toDecimalPlaces(8);
    } catch (e) {
      console.error("Ошибка расчета комиссии, используется 0:", e);
      feeAmount = new Prisma.Decimal(0); 
    }

    // ИСПРАВЛЕНО: Строгая проверка ассета. Если это USD, мы не чекаем баланс.
    const asset = ad.asset;
    let balanceField: string | null = null;
    if (asset === 'TMT') balanceField = 'tmtBalance';
    else if (asset === 'USDT') balanceField = 'usdtBalance';

    const totalRequired = amountAsset.plus(feeAmount);

    // Проверяем баланс только если сделка затрагивает крипту внутри платформы (USDT/TMT)
    if (balanceField) {
      const sellerBalance = new Prisma.Decimal(seller.wallet[balanceField as keyof typeof seller.wallet] as any);
      if (sellerBalance.lt(totalRequired)) {
        return NextResponse.json({ 
          error: `Недостаточно ${asset} на балансе (включая комиссию ${feeAmount.toString()}). Доступно: ${sellerBalance.toString()}` 
        }, { status: 400 });
      }
    }

    // 6. АТОМАРНАЯ ТРАНЗАКЦИЯ: Заморозка средств + создание ордера + первое сообщение
    const order = await prisma.$transaction(async (tx) => {
      // ИСПРАВЛЕНО: Замораживаем средства ТОЛЬКО если это системная крипта (TMT/USDT)
      if (balanceField) {
        await tx.wallet.update({
          where: { userId: sellerId },
          data: {
            [balanceField]: { decrement: totalRequired },
            frozenBalance: { increment: totalRequired }
          }
        });
      }

      // 6.2 Создаем сделку
      const newOrder = await tx.order.create({
        data: {
          adId,
          buyerId,
          sellerId,
          amountAsset,
          amountFiat,
          feeAmount,
          status: 'PENDING'
        },
        include: { 
          ad: { include: { user: true } }, 
          seller: true, 
          buyer: true 
        }
      });

      // 6.3 Создаем стартовое системное сообщение
      let paymentInfo = '';
      if (ad.paymentMethods?.includes('Cash')) {
        paymentInfo = `🤝 Встреча (наличные). Город: ${ad.city || 'Уточняется в чате'}.`;
      } else {
        paymentInfo = ad.description || "Пожалуйста, свяжитесь для получения реквизитов.";
      }

      await tx.message.create({
        data: {
          orderId: newOrder.id,
          senderId: sellerId,
          isSystem: true,
          text: `👋 Сделка открыта!\n\n💰 Сумма к оплате: ${amountFiat.toString()} ${ad.fiat}\n\nℹ️ ${paymentInfo}\n\n⚠️ Внимание: Не нажимайте 'Я оплатил' до фактического перевода средств.`
        }
      });

      return newOrder;
    });

    // 7. ОТПРАВКА УВЕДОМЛЕНИЙ В TELEGRAM
    try {
      await notifyUser(buyerId, 'order_created', {
        orderId: order.id,
        amountFiat: order.amountFiat.toString(),
        fiat: ad.fiat,
        amountAsset: order.amountAsset.toString(),
        asset: ad.asset,
        buyerName: order.buyer.firstName || order.buyer.username || 'Покупатель',
        sellerName: order.seller.firstName || order.seller.username || 'Продавец',
        paymentTime: ad.paymentTime,
      });

      await notifyUser(sellerId, 'order_created', {
        orderId: order.id,
        amountFiat: order.amountFiat.toString(),
        fiat: ad.fiat,
        amountAsset: order.amountAsset.toString(),
        asset: ad.asset,
        buyerName: order.buyer.firstName || order.buyer.username || 'Покупатель',
        sellerName: order.seller.firstName || order.seller.username || 'Продавец',
        paymentTime: ad.paymentTime,
      });
    } catch (e) {
      console.error("Ошибка отправки Telegram-уведомлений:", e);
    }

    return NextResponse.json({ success: true, order });

  } catch (error: any) {
    console.error('Create order error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера при создании сделки',
      details: error.message 
    }, { status: 500 });
  }
}

// GET-запрос для получения всех сделок пользователя
export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.userId;

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { buyerId: userId }, 
          { sellerId: userId }
        ]
      },
      include: { 
        ad: { include: { user: true } }, 
        seller: true, 
        buyer: true 
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

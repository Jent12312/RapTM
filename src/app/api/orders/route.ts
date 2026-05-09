// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/telegram';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';

const createOrderSchema = z.object({
  adId: z.string().uuid(),
  amountAsset: z.number().positive(),
  amountFiat: z.number().positive(),
});

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createOrderSchema.safeParse({
      ...body,
      amountAsset: Number(body.amountAsset),
      amountFiat: Number(body.amountFiat),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { adId, amountAsset, amountFiat } = parsed.data;
    const takerId = authUser.userId; // Тот кто кликнул - это наш авторизованный юзер

    const ad = await prisma.p2PAd.findUnique({ where: { id: adId } });
    if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });

    // ПРАВИЛЬНОЕ РАСПРЕДЕЛЕНИЕ РОЛЕЙ
    let buyerId, sellerId;
    if (ad.type === 'BUY') { // В схеме Prisma BUY/SELL капсом
      // Мейкер (создатель ad) хочет КУПИТЬ крипту.
      // Значит Тейкер (тот кто кликнул) - ПРОДАЕТ крипту.
      buyerId = ad.userId;
      sellerId = takerId;
    } else {
      // Мейкер (создатель ad) хочет ПРОДАТЬ крипту.
      // Значит Тейкер (тот кто кликнул) - ПОКУПАЕТ крипту.
      buyerId = takerId;
      sellerId = ad.userId;
    }

    // ПРОВЕРКА БАЛАНСА ПРОДАВЦА И ЗАМОРОЗКА (ЭСКРОУ)
    const seller = await prisma.user.findUnique({ where: { id: sellerId }, include: { wallet: true } });
    if (!seller || !seller.wallet) return NextResponse.json({ error: 'Seller wallet not found' }, { status: 404 });

    // Получаем курс для расчета комиссии
    const settings = await prisma.systemSetting.findMany({ where: { key: 'EXCHANGE_RATE' } });
    const exchangeRate = parseFloat(settings[0]?.value || '19.5');

    // Рассчитываем комиссию (списывается с продавца)
    const { calculateP2PFee } = await import('@/lib/fees');
    const feeAmount = calculateP2PFee(amountAsset, ad.fiat, seller.level, exchangeRate);

    if (Number(seller.wallet.usdtBalance) < (amountAsset + feeAmount)) {
      return NextResponse.json({ error: 'Недостаточно USDT на балансе (включая комиссию)' }, { status: 400 });
    }

    // ВЫПОЛНЯЕМ АТОМАРНУЮ ОПЕРАЦИЮ: Создание ордера + Заморозка баланса
    const order = await prisma.$transaction(async (tx) => {
      // 1. Списываем с основного, переводим в замороженный
      await tx.wallet.update({
        where: { userId: sellerId },
        data: {
          usdtBalance: { decrement: amountAsset + feeAmount },
          frozenBalance: { increment: amountAsset + feeAmount }
        }
      });

      // 2. Создаем ордер
      const newOrder = await tx.order.create({
        data: {
          adId,
          buyerId,
          sellerId,
          amountAsset,
          amountFiat,
          status: 'PENDING'
        },
        include: { ad: true, seller: true, buyer: true }
      });

      // 3. Отправляем первое системное сообщение с реквизитами
      let paymentInfo = '';
      if (ad.paymentMethods.includes('Cash')) {
        paymentInfo = `🤝 Встреча в городе: ${ad.city}. Свяжитесь в чате для уточнения места.`;
      } else {
        // Если будут другие методы, здесь будет информация о них
        paymentInfo = ad.description || "Свяжитесь с продавцом для получения реквизитов.";
      }

      await tx.message.create({
        data: {
          orderId: newOrder.id,
          senderId: sellerId,
          isSystem: true,
          text: `👋 Сделка открыта! \n\n💰 Сумма к оплате: ${amountFiat} ${ad.fiat} \n\nℹ️ ${paymentInfo} \n\n⚠️ Не нажимайте 'Я оплатил' до фактической передачи средств.`
        }
      });

      return newOrder;
    });

    // Отправка Telegram уведомлений
    const appUrl = process.env.APP_URL || 'https://raptm.jents.online';
    // const orderUrl = `${appUrl}/orders/${order.id}`; // Optional URL logic

    // Уведомление покупателю
    await notifyUser(buyerId, 'order_created', {
      orderId: order.id,
      amountFiat: order.amountFiat,
      fiat: ad.fiat,
      amountAsset: order.amountAsset,
      asset: ad.asset,
      buyerName: order.buyer.firstName || order.buyer.username || 'Покупатель',
      sellerName: order.seller.firstName || order.seller.username || 'Продавец',
      paymentTime: ad.paymentTime,
    });

    // Уведомление продавцу
    await notifyUser(sellerId, 'order_created', {
      orderId: order.id,
      amountFiat: order.amountFiat,
      fiat: ad.fiat,
      amountAsset: order.amountAsset,
      asset: ad.asset,
      buyerName: order.buyer.firstName || order.buyer.username || 'Покупатель',
      sellerName: order.seller.firstName || order.seller.username || 'Продавец',
      paymentTime: ad.paymentTime,
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.userId;

    const orders = await prisma.order.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }]
      },
      include: { ad: true, seller: true, buyer: true, reviews: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
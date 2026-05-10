// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/telegram';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';

// Схема валидации входящих данных
const createOrderSchema = z.object({
  adId: z.string().uuid(),
  amountAsset: z.number().positive(),
  amountFiat: z.number().positive(),
});

export async function POST(req: Request) {
  try {
    // 1. Проверка авторизации
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Парсинг и валидация тела запроса
    const body = await req.json();
    const parsed = createOrderSchema.safeParse({
      ...body,
      amountAsset: Number(body.amountAsset),
      amountFiat: Number(body.amountFiat),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { adId, amountAsset, amountFiat } = parsed.data;
    const takerId = authUser.userId; // Тот, кто нажал кнопку "Создать сделку"

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

    // 4. ПРАВИЛЬНОЕ РАСПРЕДЕЛЕНИЕ РОЛЕЙ (Защита от регистра BUY/buy)
    const isBuyAd = ad.type.toUpperCase() === 'BUY';
    
    let buyerId: string;
    let sellerId: string;

    if (isBuyAd) {
      // Мейкер (создатель ad) хочет КУПИТЬ крипту. Тейкер (авторизованный юзер) ПРОДАЕТ ему.
      buyerId = ad.userId;
      sellerId = takerId;
    } else {
      // Мейкер (создатель ad) хочет ПРОДАТЬ крипту. Тейкер (авторизованный юзер) ПОКУПАЕТ у него.
      buyerId = takerId;
      sellerId = ad.userId;
    }

    // Проверка на торговлю с самим собой
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
    let feeAmount = 0;
    try {
      const settings = await prisma.systemSetting.findMany({ where: { key: 'EXCHANGE_RATE' } });
      const exchangeRate = parseFloat(settings[0]?.value || '19.5');
      const { calculateP2PFee } = await import('@/lib/fees');
      feeAmount = calculateP2PFee(amountAsset, ad.fiat, seller.level, exchangeRate);
    } catch (e) {
      console.error("Ошибка расчета комиссии, используется 0:", e);
      feeAmount = 0; 
    }

    if (Number(seller.wallet.usdtBalance) < (amountAsset + feeAmount)) {
      return NextResponse.json({ error: 'У продавца недостаточно USDT на балансе (включая комиссию)' }, { status: 400 });
    }

    // 6. АТОМАРНАЯ ТРАНЗАКЦИЯ: Заморозка средств + создание ордера + первое сообщение
    const order = await prisma.$transaction(async (tx) => {
      // 6.1 Замораживаем средства у продавца
      await tx.wallet.update({
        where: { userId: sellerId },
        data: {
          usdtBalance: { decrement: amountAsset + feeAmount },
          frozenBalance: { increment: amountAsset + feeAmount }
        }
      });

      // 6.2 Создаем сделку
      const newOrder = await tx.order.create({
        data: {
          adId,
          buyerId,
          sellerId,
          amountAsset,
          amountFiat,
          status: 'PENDING',
          price: ad.price
        },
        // ВАЖНО: Подтягиваем все данные, чтобы фронтенд мог сразу отобразить окно
        include: { 
          ad: { include: { user: true } }, 
          seller: true, 
          buyer: true 
        }
      });

      // 6.3 Создаем стартовое системное сообщение в чате
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
          text: `👋 Сделка открыта!\n\n💰 Сумма к оплате: ${amountFiat} ${ad.fiat}\n\nℹ️ ${paymentInfo}\n\n⚠️ Внимание: Не нажимайте 'Я оплатил' до фактического перевода средств.`
        }
      });

      return newOrder;
    });

    // 7. ОТПРАВКА УВЕДОМЛЕНИЙ В TELEGRAM (В блоке try/catch, чтобы ошибка не отменила сделку)
    try {
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
    } catch (e) {
      console.error("Ошибка отправки Telegram-уведомлений:", e);
    }

    // 8. Возвращаем успешный результат
    return NextResponse.json({ success: true, order });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера при создании сделки' }, { status: 500 });
  }
}

// GET-запрос для получения всех сделок пользователя (Для "Мои Заказы")
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
      // Подтягиваем связанные сущности для корректного отображения
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

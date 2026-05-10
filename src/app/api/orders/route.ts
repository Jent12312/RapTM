// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/telegram';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';

const createOrderSchema = z.object({
  adId: z.string(),
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
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const { adId, amountAsset, amountFiat } = parsed.data;
    const takerId = authUser.userId;

    const ad = await prisma.p2PAd.findUnique({ where: { id: adId } });
    if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });

    // ИСПРАВЛЕНИЕ 1: Защита от регистра букв (buy / BUY)
    const isBuyAd = ad.type.toUpperCase() === 'BUY';

    let buyerId, sellerId;
    if (isBuyAd) {
      buyerId = ad.userId;
      sellerId = takerId;
    } else {
      buyerId = takerId;
      sellerId = ad.userId;
    }

    if (buyerId === sellerId) {
      return NextResponse.json({ error: 'Нельзя торговать со своим же объявлением' }, { status: 400 });
    }

    const seller = await prisma.user.findUnique({ where: { id: sellerId }, include: { wallet: true } });
    if (!seller || !seller.wallet) return NextResponse.json({ error: 'Seller wallet not found' }, { status: 404 });

    // Безопасный расчет комиссии
    let feeAmount = 0;
    try {
      const settings = await prisma.systemSetting.findMany({ where: { key: 'EXCHANGE_RATE' } });
      const exchangeRate = parseFloat(settings[0]?.value || '19.5');
      const { calculateP2PFee } = await import('@/lib/fees');
      feeAmount = calculateP2PFee(amountAsset, ad.fiat, seller.level, exchangeRate);
    } catch (e) {
      console.error("Ошибка расчета комиссии:", e);
      feeAmount = 0; // В случае ошибки модуля fees, сделка все равно пройдет
    }

    if (Number(seller.wallet.usdtBalance) < (amountAsset + feeAmount)) {
      return NextResponse.json({ error: 'Недостаточно USDT на балансе (включая комиссию)' }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: sellerId },
        data: {
          usdtBalance: { decrement: amountAsset + feeAmount },
          frozenBalance: { increment: amountAsset + feeAmount }
        }
      });

      const newOrder = await tx.order.create({
        data: {
          adId,
          buyerId,
          sellerId,
          amountAsset,
          amountFiat,
          status: 'PENDING'
        },
        // ИСПРАВЛЕНИЕ 2: Включаем все нужные данные, чтобы фронтенд не падал!
        include: { 
          ad: { include: { user: true } }, 
          seller: true, 
          buyer: true 
        }
      });

      let paymentInfo = '';
      if (ad.paymentMethods?.includes('Cash')) {
        paymentInfo = `🤝 Встреча в городе: ${ad.city || 'Уточняется'}. Свяжитесь в чате для уточнения места.`;
      } else {
        paymentInfo = ad.description || "Свяжитесь с продавцом для получения реквизитов.";
      }

      await tx.message.create({
        data: {
          orderId: newOrder.id,
          senderId: sellerId,
          isSystem: true,
          text: `👋 Сделка открыта!\n\n💰 Сумма к оплате: ${amountFiat} ${ad.fiat}\n\nℹ️ ${paymentInfo}\n\n⚠️ Не нажимайте 'Я оплатил' до фактической передачи средств.`
        }
      });

      return newOrder;
    });

    try {
      await notifyUser(buyerId, 'order_created', { /* ваши данные */ orderId: order.id });
      await notifyUser(sellerId, 'order_created', { /* ваши данные */ orderId: order.id });
    } catch (e) {
      console.log("Уведомления ТГ отключены или ошибка:", e);
    }

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
      // Убрано reviews: true, чтобы предотвратить краш базы данных
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

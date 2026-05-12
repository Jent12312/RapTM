// src/app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyUser } from '@/lib/telegram';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'COMPLETED', 'CANCELLED', 'DISPUTED']),
});

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { ad: true, seller: true, buyer: true, reviews: true }
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Only buyer or seller can see the order details
    if (order.buyerId !== authUser.userId && order.sellerId !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Fetch order error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { status } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { ad: true, seller: true, buyer: true }
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // PERMISSION CHECK
    if (order.buyerId !== authUser.userId && order.sellerId !== authUser.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const appUrl = process.env.APP_URL || 'https://raptm.jents.online';
    const orderUrl = `${appUrl}/orders/${order.id}`;

    // 1. COMPLETED - Only Seller can confirm completion (release crypto)
    if (status === 'COMPLETED' && order.status !== 'COMPLETED') {
      if (order.sellerId !== authUser.userId) {
        return NextResponse.json({ error: 'Only seller can complete the order' }, { status: 403 });
      }

      const feeAmount = Number(order.feeAmount);

      // Execute transaction: Release escrow
      const [ , , updatedOrder ] = await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: order.sellerId },
          data: { frozenBalance: { decrement: Number(order.amountAsset) + feeAmount } }
        }),
        prisma.wallet.update({
          where: { userId: order.buyerId },
          data: { usdtBalance: { increment: Number(order.amountAsset) } }
        }),
        prisma.order.update({
          where: { id },
          data: { status: 'COMPLETED' },
          include: { ad: true, seller: true, buyer: true }
        })
      ]);

      // Update user stats (trades count, volume)
      const { updateUserStats } = await import('@/lib/userStats');
      await Promise.all([
        updateUserStats(order.buyerId, Number(order.amountAsset)),
        updateUserStats(order.sellerId, Number(order.amountAsset)),
      ]);

      await Promise.all([
        notifyUser(order.buyerId, 'order_completed', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          amountAsset: order.amountAsset,
          asset: order.ad.asset,
        }),
        notifyUser(order.sellerId, 'order_completed', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          amountAsset: order.amountAsset,
          asset: order.ad.asset,
          fee: feeAmount.toFixed(4),
        }),
      ]);

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // 2. PAID - Only Buyer can mark as paid
    if (status === 'PAID' && order.status === 'PENDING') {
      if (order.buyerId !== authUser.userId) {
        return NextResponse.json({ error: 'Only buyer can mark as paid' }, { status: 403 });
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: 'PAID' },
        include: { ad: true, seller: true, buyer: true }
      });

      await notifyUser(order.sellerId, 'order_paid', {
        orderId: order.id,
        amountFiat: order.amountFiat,
        fiat: order.ad.fiat,
        orderUrl,
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // 3. CANCELLED - Return Escrow to Seller
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      if (order.status === 'PAID' && order.buyerId === authUser.userId) {
        return NextResponse.json({ error: 'Cannot cancel after payment. Open a dispute instead.' }, { status: 400 });
      }

      const feeAmount = Number(order.feeAmount);

      const [ , updatedOrder ] = await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: order.sellerId },
          data: { 
            frozenBalance: { decrement: Number(order.amountAsset) + feeAmount },
            usdtBalance: { increment: Number(order.amountAsset) + feeAmount }
          }
        }),
        prisma.order.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: { ad: true, seller: true, buyer: true }
        })
      ]);

      await Promise.all([
        notifyUser(order.buyerId, 'order_cancelled', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          reason: 'Отменена пользователем',
        }),
        notifyUser(order.sellerId, 'order_cancelled', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          reason: 'Отменена пользователем',
        }),
      ]);

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // DISPUTED -> COMPLETED or CANCELLED (Arbitration)
    if (order.status === 'DISPUTED' && (status === 'COMPLETED' || status === 'CANCELLED')) {
      if (!authUser.isAdmin) {
        return NextResponse.json({ error: 'Only admin can resolve a dispute' }, { status: 403 });
      }

      const amount = Number(order.amountAsset);
      const fee = Number(order.feeAmount);
      const totalToSubtract = amount + fee;

      const transactions = [];

      // 1. Update Order status
      transactions.push(
        prisma.order.update({
          where: { id },
          data: { status, isDisputed: false },
          include: { ad: true, seller: true, buyer: true }
        })
      );

      // 2. Wallet updates
      if (status === 'COMPLETED') {
        // From seller's frozen to buyer's balance
        transactions.push(
          prisma.wallet.update({
            where: { userId: order.sellerId },
            data: { frozenBalance: { decrement: totalToSubtract } }
          }),
          prisma.wallet.update({
            where: { userId: order.buyerId },
            data: { usdtBalance: { increment: Number(amount) } }
          })
        );
      } else {
        // Return to seller's balance
        transactions.push(
          prisma.wallet.update({
            where: { userId: order.sellerId },
            data: { 
              frozenBalance: { decrement: totalToSubtract },
              usdtBalance: { increment: totalToSubtract }
            }
          })
        );
      }

      // 3. Admin action log
      transactions.push(
        prisma.adminAction.create({
          data: {
            adminId: authUser.userId,
            action: 'DISPUTE_RESOLVE',
            targetId: id,
            details: `Спор разрешен: ${status}. Сумма: ${amount} ${order.ad.asset}`
          }
        })
      );

      const results = await prisma.$transaction(transactions);
      const updatedOrder = results[0] as any;

      // 4. Update stats if completed
      if (status === 'COMPLETED') {
        const { updateUserStats } = await import('@/lib/userStats');
        await Promise.all([
          updateUserStats(order.sellerId, Number(amount)),
          updateUserStats(order.buyerId, Number(amount))
        ]);
      }

      // 5. Notify users
      await Promise.all([
        notifyUser(order.buyerId, status === 'COMPLETED' ? 'order_completed' : 'order_cancelled', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          reason: 'Решение арбитража',
        }),
        notifyUser(order.sellerId, status === 'COMPLETED' ? 'order_completed' : 'order_cancelled', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          reason: 'Решение арбитража',
        }),
      ]);

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // DISPUTED
    if (status === 'DISPUTED') {
       const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: 'DISPUTED', isDisputed: true },
        include: { ad: true, seller: true, buyer: true }
      });
      
      // Notify both and admin
      await Promise.all([
        notifyUser(order.buyerId, 'order_disputed', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          initiatorName: authUser.userId === order.buyerId ? 'Покупатель' : 'Продавец',
        }),
        notifyUser(order.sellerId, 'order_disputed', {
          orderId: order.id,
          amountFiat: order.amountFiat,
          fiat: order.ad.fiat,
          initiatorName: authUser.userId === order.buyerId ? 'Покупатель' : 'Продавец',
        }),
      ]);

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    return NextResponse.json({ error: 'Invalid transition' }, { status: 400 });
  } catch (error) {
    console.error("Order Update Error:", error);
    return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
  }
}
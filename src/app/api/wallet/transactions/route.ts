// src/app/api/wallet/transactions/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Получить историю транзакций
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const txs = await prisma.cryptoTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(txs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// Создать заявку на ввод/вывод
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, type, network, amount, address, txId } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let transaction;

    if (type === 'WITHDRAWAL') {
      if (user.wallet.usdtBalance < amount) {
        return NextResponse.json({ error: 'Недостаточно средств' }, { status: 400 });
      }
      
      // Списываем средства сразу и создаем заявку
      const result = await prisma.$transaction([
        prisma.wallet.update({
          where: { userId },
          data: { usdtBalance: { decrement: amount } }
        }),
        prisma.cryptoTransaction.create({
          data: { userId, type, network, amount, address, status: 'PENDING' }
        })
      ]);
      transaction = result[1];

    } else if (type === 'DEPOSIT') {
      // Проверка на дубликат TxID, чтобы не пополнили 2 раза по одному хэшу
      const existingTx = await prisma.cryptoTransaction.findFirst({ where: { txId } });
      if (existingTx) {
        return NextResponse.json({ error: 'Этот TxID уже был использован' }, { status: 400 });
      }

      transaction = await prisma.cryptoTransaction.create({
        data: { userId, type, network, amount, txId, status: 'PENDING' }
      });
    }

    // Уведомление в Телеграм админу
    try {
      const msg = type === 'DEPOSIT' 
        ? `📥 Новое пополнение USDT!\nСеть: ${network}\nСумма: ${amount} USDT\nTxID: ${txId}\nЮзер: @${user.username || user.firstName}`
        : `📤 Заявка на вывод USDT!\nСеть: ${network}\nСумма: ${amount} USDT\nАдрес: ${address}\nЮзер: @${user.username || user.firstName}`;

      await fetch(`${process.env.TELEGRAM_BOT_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID, text: msg })
      });
    } catch (e) { console.log('Admin notification failed'); }

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error('Transaction Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
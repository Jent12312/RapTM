import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAdminNotification } from '@/lib/telegram';

const MIN_DEPOSIT_AMOUNTS: Record<string, number> = {
  USDT: 1,
  TMT: 5,
};

const MIN_WITHDRAWAL_AMOUNTS: Record<string, number> = {
  USDT: 5,
  TMT: 10,
};

const CASH_CITIES = ['Ашхабад', 'Туркменабад', 'Мары', 'Дашогуз', 'Балканабад'];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.cryptoTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.cryptoTransaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    console.error('Get Transactions Error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      type,
      method = 'CRYPTO',
      asset = 'USDT',
      network,
      amount,
      address,
      txId,
      city,
      code,
    } = body;

    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, amount' },
        { status: 400 }
      );
    }

    if (!['DEPOSIT', 'WITHDRAWAL'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    if (!['CRYPTO', 'CASH', 'P2P', 'CODE'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid method. Use: CRYPTO, CASH, P2P, CODE' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (type === 'WITHDRAWAL') {
      const minAmount = MIN_WITHDRAWAL_AMOUNTS[asset] || 5;
      if (amount < minAmount) {
        return NextResponse.json(
          { error: `Минимальная сумма вывода: ${minAmount} ${asset}` },
          { status: 400 }
        );
      }

      const balance = asset === 'USDT' ? user.wallet.usdtBalance : user.wallet.tmtBalance;
      if (balance < amount) {
        return NextResponse.json({ error: 'Недостаточно средств' }, { status: 400 });
      }

      const networkLower = network?.toUpperCase();
      const validNetworks = ['TRC20', 'BEP20', 'ERC20', 'APTOS'];
      if (method === 'CRYPTO' && network && !validNetworks.includes(networkLower)) {
        return NextResponse.json(
          { error: 'Invalid network. Use: TRC20, BEP20, ERC20, APTOS' },
          { status: 400 }
        );
      }

      const balanceField = asset === 'USDT' ? 'usdtBalance' : 'tmtBalance';
      const result = await prisma.$transaction([
        prisma.wallet.update({
          where: { userId },
          data: { [balanceField]: { decrement: amount } },
        }),
        prisma.cryptoTransaction.create({
          data: {
            userId,
            type,
            method,
            asset,
            network: network || null,
            amount,
            address,
            status: 'PENDING',
          },
        }),
      ]);

      await sendAdminNotification(
        `📤 <b>Заявка на вывод ${asset}!</b>\n\n` +
        `💰 <b>Сумма:</b> ${amount} ${asset}\n` +
        `🔗 <b>Метод:</b> ${method}\n` +
        `${network ? `🌐 <b>Сеть:</b> ${network}\n` : ''}` +
        `${address ? `📍 <b>Адрес:</b> <code>${address}</code>\n` : ''}` +
        `👤 <b>Юзер:</b> @${user.username || user.firstName} (${user.level})`
      );

      return NextResponse.json({ success: true, transaction: result[1] });
    }

    if (type === 'DEPOSIT') {
      const minAmount = MIN_DEPOSIT_AMOUNTS[asset] || 1;
      if (amount < minAmount) {
        return NextResponse.json(
          { error: `Минимальная сумма депозита: ${minAmount} ${asset}` },
          { status: 400 }
        );
      }

      if (txId) {
        const existingTx = await prisma.cryptoTransaction.findFirst({
          where: { txId, type: 'DEPOSIT' },
        });
        if (existingTx) {
          return NextResponse.json({ error: 'Этот TxID уже был использован' }, { status: 400 });
        }
      }

      if (method === 'CASH' && city) {
        if (!CASH_CITIES.includes(city)) {
          return NextResponse.json(
            { error: `Неверный город. Доступны: ${CASH_CITIES.join(', ')}` },
            { status: 400 }
          );
        }
      }

      if (method === 'CODE' && code) {
        const codeRecord = await prisma.code.findFirst({
          where: { code, status: 'ACTIVE' },
        });
        if (!codeRecord) {
          return NextResponse.json({ error: 'Неверный или неактивный код' }, { status: 400 });
        }
      }

      const transaction = await prisma.cryptoTransaction.create({
        data: {
          userId,
          type,
          method,
          asset,
          network: network || null,
          amount,
          txId: txId || null,
          city: city || null,
          code: code || null,
          status: 'PENDING',
        },
      });

      let adminMessage = `📥 <b>Новое пополнение ${asset}!</b>\n\n`;
      adminMessage += `💰 <b>Сумма:</b> ${amount} ${asset}\n`;
      adminMessage += `🔗 <b>Метод:</b> ${method}\n`;

      if (network) adminMessage += `🌐 <b>Сеть:</b> ${network}\n`;
      if (txId) adminMessage += `📝 <b>TxID:</b> <code>${txId}</code>\n`;
      if (city) adminMessage += `🏙️ <b>Город:</b> ${city}\n`;
      if (code) adminMessage += `🎫 <b>Код:</b> ${code}\n`;
      adminMessage += `👤 <b>Юзер:</b> @${user.username || user.firstName} (${user.level})`;

      await sendAdminNotification(adminMessage);

      return NextResponse.json({ success: true, transaction });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Transaction Error:', error);
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
  }
}
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // убедись, что путь к prisma-клиенту правильный

const CLAIM_COOLDOWN_MINUTES = 5; // ограничение по времени

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешён' });
  }

  const { userId } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Не указан userId' });
  }

  try {
    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Защита от частых запросов: ищем последнюю completed‑транзакцию такого же типа
    const recentClaim = await prisma.transaction.findFirst({
      where: {
        userId,
        type: 'DEPOSIT',
        method: 'SYSTEM',
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - CLAIM_COOLDOWN_MINUTES * 60 * 1000),
        },
      },
      select: { id: true },
    });

    if (recentClaim) {
      return res.status(429).json({
        error: `Повторно можно получить через ${CLAIM_COOLDOWN_MINUTES} мин.`,
      });
    }

    // Убедимся, что кошелёк существует; если нет — создадим
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          usdtBalance: 0,
          tmtBalance: 0,
          bonusBalance: 15,
          referralBonus: 0,
          frozenBalance: 0,
        },
      });
    }

    // Начисляем 1000 USDT атомарно
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { usdtBalance: { increment: 1000 } },
    });

    // Создаём запись транзакции
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        method: 'SYSTEM',
        asset: 'USDT',
        network: null,
        amount: 1000,
        fee: 0,
        address: null,
        txId: `faucet-${Date.now()}`,
        status: 'COMPLETED',
        adminNote: 'Тестовые 1000 USDT (faucet)',
        ip: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || null,
      },
    });

    res.status(200).json({
      success: true,
      newBalance: updatedWallet.usdtBalance.toString(),
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('Claim test USDT error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}
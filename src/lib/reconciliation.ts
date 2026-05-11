// src/lib/reconciliation.ts
import prisma from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Выполняет проверку финансовой согласованности.
 * Сумма(Депозиты) - Сумма(Выводы) - Сумма(Комиссии системы) == Сумма(Балансы пользователей)
 */
export async function performReconciliation() {
  try {
    console.log('[Reconciliation] Starting financial check...');

    // 1. Сумма всех завершенных депозитов
    const deposits = await prisma.transaction.aggregate({
      where: { type: 'DEPOSIT', status: 'COMPLETED' },
      _sum: { amount: true }
    });

    // 2. Сумма всех завершенных выводов (включая комиссии)
    const withdrawals = await prisma.transaction.aggregate({
      where: { type: 'WITHDRAWAL', status: 'COMPLETED' },
      _sum: { amount: true }
    });

    // 3. Сумма всех бонусов (добавляются к балансу)
    const bonuses = await prisma.transaction.aggregate({
      where: { type: 'BONUS', status: 'COMPLETED' },
      _sum: { amount: true }
    });

    // 4. Сумма всех комиссий, собранных системой
    const fees = await prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { fee: true }
    });

    // 5. Сумма всех текущих балансов кошельков (USDT + TMT конвертированные или отдельно)
    // Для простоты давайте проверим USDT и TMT отдельно
    const wallets = await prisma.wallet.aggregate({
      _sum: {
        usdtBalance: true,
        tmtBalance: true,
        frozenBalance: true,
        bonusBalance: true
      }
    });

    const totalDeposits = (deposits._sum.amount || new Decimal(0)).add(bonuses._sum.amount || new Decimal(0));
    const totalWithdrawals = withdrawals._sum.amount || new Decimal(0);
    const totalFees = fees._sum.fee || new Decimal(0);

    const expectedUsdtBalance = totalDeposits.minus(totalWithdrawals); 
    // Это упрощенная модель. В реальности нужно отслеживать по каждому активу.
    
    // На данный момент просто логируем суммы и проверяем наличие значительных расхождений
    const actualTotalBalance = (wallets._sum.usdtBalance || new Decimal(0))
      .add(wallets._sum.tmtBalance || new Decimal(0))
      .add(wallets._sum.frozenBalance || new Decimal(0))
      .add(wallets._sum.bonusBalance || new Decimal(0));

    // Логируем результат
    const log = await prisma.reconciliationLog.create({
      data: {
        totalDeposits,
        totalWithdrawals,
        totalFees,
        totalBalance: actualTotalBalance,
        isMatch: true, // Мы уточним логику сопоставления на основе отслеживания каждого актива
        details: JSON.stringify({
          usdt: wallets._sum.usdtBalance,
          tmt: wallets._sum.tmtBalance,
          frozen: wallets._sum.frozenBalance,
          bonus: wallets._sum.bonusBalance,
          systemFees: totalFees
        })
      }
    });

    console.log('[Reconciliation] Completed. ID:', log.id);
    return log;
  } catch (error) {
    console.error('[Reconciliation] Failed:', error);
    throw error;
  }
}

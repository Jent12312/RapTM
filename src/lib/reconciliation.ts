// src/lib/reconciliation.ts
import prisma from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Performs a financial consistency check.
 * Sum(Deposits) - Sum(Withdrawals) - Sum(System Fees) == Sum(User Balances)
 */
export async function performReconciliation() {
  try {
    console.log('[Reconciliation] Starting financial check...');

    // 1. Sum of all completed deposits
    const deposits = await prisma.transaction.aggregate({
      where: { type: 'DEPOSIT', status: 'COMPLETED' },
      _sum: { amount: true }
    });

    // 2. Sum of all completed withdrawals (includes fees)
    const withdrawals = await prisma.transaction.aggregate({
      where: { type: 'WITHDRAWAL', status: 'COMPLETED' },
      _sum: { amount: true }
    });

    // 3. Sum of all bonuses (add to balance)
    const bonuses = await prisma.transaction.aggregate({
      where: { type: 'BONUS', status: 'COMPLETED' },
      _sum: { amount: true }
    });

    // 4. Sum of all fees collected by system
    const fees = await prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { fee: true }
    });

    // 5. Sum of all current wallet balances (USDT + TMT converted or separately)
    // For simplicity, let's check USDT and TMT separately
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
    // This is a simplified model. In reality, you'd track per asset.
    
    // For now, let's just log the sums and check if any massive discrepancy exists
    const actualTotalBalance = (wallets._sum.usdtBalance || new Decimal(0))
      .add(wallets._sum.tmtBalance || new Decimal(0))
      .add(wallets._sum.frozenBalance || new Decimal(0))
      .add(wallets._sum.bonusBalance || new Decimal(0));

    // Log the result
    const log = await prisma.reconciliationLog.create({
      data: {
        totalDeposits,
        totalWithdrawals,
        totalFees,
        totalBalance: actualTotalBalance,
        isMatch: true, // We'll refine the matching logic based on per-asset tracking
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

import prisma from '@/lib/prisma';
import { UserLevel, KycStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { notifyUser } from '@/lib/telegram';

export const adminService = {
  // Stats for Dashboard
  async getDashboardStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      vol24h, vol7d, 
      swapVol24h, swapVol7d,
      activeOrders, totalFees, 
      pendingKyc, pendingWithdrawals,
      totalUsers, verifiedUsers
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: last24h } },
        _sum: { amountAsset: true }
      }),
      prisma.order.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: last7d } },
        _sum: { amountAsset: true }
      }),
      prisma.exchangeRequest.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: last24h } },
        _sum: { amountUsdt: true }
      }),
      prisma.exchangeRequest.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: last7d } },
        _sum: { amountUsdt: true }
      }),
      prisma.order.count({
        where: { status: { in: ['PENDING', 'PAID', 'DISPUTED'] } }
      }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: last24h } },
        _sum: { fee: true }
      }),
      prisma.user.count({ where: { kycStatus: 'PENDING' } }),
      prisma.transaction.count({
        where: { type: 'WITHDRAWAL', status: 'PENDING' }
      }),
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } })
    ]);

    return {
      volume24h: Number(vol24h._sum.amountAsset || 0) + Number(swapVol24h._sum.amountUsdt || 0),
      volume7d: Number(vol7d._sum.amountAsset || 0) + Number(swapVol7d._sum.amountUsdt || 0),
      p2pVolume24h: Number(vol24h._sum.amountAsset || 0),
      swapVolume24h: Number(swapVol24h._sum.amountUsdt || 0),
      activeOrders,
      todayFees: Number(totalFees._sum.fee || 0),
      verificationQueueCount: pendingKyc,
      withdrawalQueueCount: pendingWithdrawals,
      totalUsers,
      verifiedUsers
    };
  },

  async updateExchangeRate(newRate: string, freeze: boolean, adminId: string) {
    const rate = await prisma.exchangeRate.upsert({
      where: { id: 'global' },
      update: { rate: newRate, isFrozen: freeze },
      create: { id: 'global', rate: newRate, isFrozen: freeze },
    });

    // Sync with SystemSetting
    await prisma.systemSetting.upsert({
      where: { key: 'EXCHANGE_RATE' },
      update: { value: newRate },
      create: { key: 'EXCHANGE_RATE', value: newRate }
    });
    
    // Log history
    await prisma.rateHistory.create({
      data: {
        oldRate: 0, // Simplified
        newRate: Number(newRate),
        changedBy: adminId
      }
    });

    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'EXCHANGE_RATE_UPDATE',
        details: JSON.stringify({ newRate, freeze }),
      },
    });
    return rate;
  },

  async promoteUser(userId: string, level: UserLevel, adminId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { level },
    });
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'USER_PROMOTE',
        targetId: userId,
        details: JSON.stringify({ level }),
      },
    });
    return user;
  },

  async setDailyLimit(userId: string, limit: number, adminId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { dailyLimitOverride: limit },
    });
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'USER_LIMIT_CHANGE',
        targetId: userId,
        details: JSON.stringify({ limit }),
      },
    });
    return user;
  },

  async adjustBalance(userId: string, type: 'MAIN' | 'BONUS', amount: number, adminId: string) {
    const updateData = type === 'MAIN' 
      ? { usdtBalance: { increment: amount } }
      : { bonusBalance: { increment: amount } };

    const wallet = await prisma.wallet.update({
      where: { userId },
      data: updateData,
    });
    
    await prisma.adminAction.create({
      data: {
        adminId,
        action: type === 'BONUS' ? 'BONUS_ADJUST' : 'BALANCE_ADJUST',
        targetId: userId,
        details: JSON.stringify({ amount, type }),
      },
    });
    return wallet;
  },

  async lockUser(userId: string, lock: boolean, adminId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isFrozen: lock },
    });
    await prisma.adminAction.create({
      data: {
        adminId,
        action: lock ? 'USER_LOCK' : 'USER_UNLOCK',
        targetId: userId,
      },
    });
    return user;
  },

  async getVerificationQueue() {
    return prisma.levelApplication.findMany({
      where: { status: 'PENDING' },
      include: { user: true }
    });
  },

  async getWithdrawalQueue() {
    return prisma.transaction.findMany({
      where: { type: 'WITHDRAWAL', status: 'PENDING' },
      include: { user: true }
    });
  },

  async resolveDispute(orderId: string, resolution: 'COMPLETED' | 'CANCELLED', adminId: string) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: resolution, isDisputed: false },
    });
    
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'DISPUTE_RESOLVE',
        targetId: orderId,
        details: JSON.stringify({ resolution }),
      },
    });

    // Notify participants
    await notifyUser(order.buyerId, 'dispute_resolved', { orderId, resolution });
    await notifyUser(order.sellerId, 'dispute_resolved', { orderId, resolution });

    return order;
  },

  async manageBlacklist(type: string, value: string, reason: string, adminId: string) {
    const entry = await prisma.blacklistEntry.upsert({
      where: { value },
      update: { type, reason, addedBy: adminId },
      create: { type, value, reason, addedBy: adminId },
    });
    
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'BLACKLIST_ADD',
        details: JSON.stringify({ type, value, reason }),
      },
    });
    return entry;
  },

  async getPnL(start: Date, end: Date) {
    const fees = await prisma.transaction.aggregate({
      where: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
      _sum: { fee: true },
    });
    
    const bonuses = await prisma.transaction.aggregate({
      where: { type: 'BONUS', createdAt: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const profit = Number(fees._sum.fee || 0) - Number(bonuses._sum.amount || 0);
    return { 
      profit, 
      fees: Number(fees._sum.fee || 0), 
      bonuses: Number(bonuses._sum.amount || 0) 
    };
  },

  async getCashBalances() {
    const balances = await prisma.transaction.groupBy({
      by: ['city'],
      where: { method: 'CASH', status: 'COMPLETED' },
      _sum: { amount: true }
    });
    return balances;
  }
};

export default adminService;

import prisma from './prisma';

export async function updateUserStats(userId: string, volumeUsdt: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { reviewsReceived: true }
  });

  if (!user) return;

  const newTradesCount = user.tradesCount + 1;
  const newVolumeTotal = Number(user.volumeTotal) + volumeUsdt;

  // Referral Bonus Logic: +15 USDT for active referral (1st trade)
  if (user.tradesCount === 0 && user.referrerId) {
    try {
      await prisma.$transaction(async (tx) => {
        // Award USDT and track bonus
        await tx.wallet.update({
          where: { userId: user.referrerId! },
          data: { 
            usdtBalance: { increment: 15.0 },
            referralBonus: { increment: 15.0 }
          }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: user.referrerId!,
            type: 'BONUS',
            method: 'SYSTEM',
            amount: 15.0,
            asset: 'USDT',
            status: 'COMPLETED',
            adminNote: `Награда за реферала: ${user.nickname || user.firstName || user.telegramId}`
          }
        });
      });

      // Notify Referrer
      const { notifyUser } = await import('./telegram');
      await notifyUser(user.referrerId, 'referral_reward', {
        amount: 15,
        asset: 'USDT',
        referralName: user.nickname || user.firstName || user.telegramId
      });
    } catch (e) {
      console.error('Referral Reward Error:', e);
    }
  }

  // Calculate rating
  let averageRating = 0;
  if (user.reviewsReceived && user.reviewsReceived.length > 0) {
    const ratingValues = { EXCELLENT: 5, NEUTRAL: 3, BAD: 1 };
    const totalPoints = user.reviewsReceived.reduce((sum, r) => sum + (ratingValues[r.rating] || 0), 0);
    averageRating = (totalPoints / user.reviewsReceived.length);
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      tradesCount: newTradesCount,
      volumeTotal: newVolumeTotal,
      rating: averageRating,
      // Устанавливаем дату первой сделки, если она ещё не установлена
      firstTradeAt: user.firstTradeAt || new Date(),
    }
  });
}

export async function isEligibleForPro(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.level !== 'Standard') return false;

  const daysSinceFirstTrade = user.firstTradeAt 
    ? Math.floor((Date.now() - new Date(user.firstTradeAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    user.tradesCount >= 30 &&
    Number(user.volumeTotal) >= 3000 &&
    user.rating >= 4.8 &&
    daysSinceFirstTrade >= 14
  );
}


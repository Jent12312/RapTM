import { UserLevel } from '@prisma/client';

export function calculateP2PFee(amountAsset: number, fiat: string, level: UserLevel, exchangeRate: number): number {
  if (fiat === 'TMT') {
    // Фиатные пары: 20 TMT фикс (списывается в USDT эквиваленте)
    return 20 / exchangeRate;
  } else {
    // USDT пары: 0.7% (Standard) / 0.5% (Pro) / 0.2% (Partner)
    const feePercent = level === 'Partner' ? 0.002 : (level === 'Pro' ? 0.005 : 0.007);
    return amountAsset * feePercent;
  }
}

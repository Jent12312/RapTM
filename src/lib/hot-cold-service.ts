// src/lib/hot-cold-service.ts
import prisma from './prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { sendAdminNotification } from './telegram';

/**
 * Checks Hot Wallets and performs automated sweep to Cold storage if threshold is reached.
 */
export async function manageHotColdStorage() {
  try {
    const hotWallets = await prisma.systemWallet.findMany({
      where: { type: 'HOT' }
    });

    for (const wallet of hotWallets) {
      const balance = new Decimal(wallet.balance);
      const threshold = new Decimal(wallet.threshold);

      if (balance.gt(threshold)) {
        const sweepAmount = balance.minus(threshold);
        
        // Find corresponding cold wallet
        const coldWallet = await prisma.systemWallet.findFirst({
          where: { type: 'COLD', network: wallet.network }
        });

        if (!coldWallet) {
          console.warn(`[Hot/Cold] No cold wallet found for network ${wallet.network}`);
          continue;
        }

        console.log(`[Hot/Cold] Threshold reached on ${wallet.network}. Sweeping ${sweepAmount} to cold storage ${coldWallet.address}`);

        // Atomic update of balances
        await prisma.$transaction([
          prisma.systemWallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: sweepAmount } }
          }),
          prisma.systemWallet.update({
            where: { id: coldWallet.id },
            data: { balance: { increment: sweepAmount } }
          }),
          // Log the movement
          prisma.log.create({
            data: {
              action: 'HOT_COLD_SWEEP',
              severity: 'INFO',
              details: `Auto-sweep of ${sweepAmount} ${wallet.network} from HOT to COLD.`
            }
          })
        ]);

        await sendAdminNotification(
          `🏦 <b>HOT -> COLD SWEEP</b>\n\n` +
          `💰 <b>Сумма:</b> ${sweepAmount} ${wallet.network}\n` +
          `📍 <b>Cold Address:</b> <code>${coldWallet.address}</code>\n` +
          `ℹ️ Порог ${threshold} превышен. Излишки переведены в холодное хранилище.`
        );
      }
    }
  } catch (error) {
    console.error('[Hot/Cold] Management failed:', error);
  }
}

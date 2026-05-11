// src/lib/blockchain.ts
import prisma from './prisma';

export type BlockchainNetwork = 'TRC20' | 'BEP20' | 'APTOS';

export interface BlockchainTransaction {
  txId: string;
  network: BlockchainNetwork;
  from: string;
  to: string;
  amount: number;
  asset: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

class BlockchainService {
  /**
   * Генерирует новый адрес для депозита пользователя.
   * В рабочей среде здесь будет вызов провайдера (например, Tatum, Moralis)
   * или использование логики деривации BIP44 из мастер-ключа (XPUB).
   */
  async generateAddress(network: BlockchainNetwork, userId: string): Promise<string> {
    // Проверяем, существует ли уже адрес
    const existing = await prisma.depositAddress.findUnique({
      where: {
        walletId_network: {
          walletId: await this.getWalletId(userId),
          network,
        },
      },
    });

    if (existing) return existing.address;

    // ЗАГЛУШКА: Детерминированный случайный адрес на основе пользователя и сети
    const prefixMap: Record<string, string> = {
      TRC20: 'T',
      BEP20: '0x',
      APTOS: '0x',
    };

    const prefix = prefixMap[network];
    const hash = Buffer.from(`${userId}-${network}-salt`).toString('hex').slice(0, 40);
    const address = prefix + hash;

    // Сохраняем в БД
    const walletId = await this.getWalletId(userId);
    await prisma.depositAddress.create({
      data: {
        walletId,
        network,
        address,
      },
    });

    return address;
  }

  /**
   * Проверяет транзакцию в блокчейне.
   * В рабочей среде здесь будут запрашиваться данные из API обозревателя блокчейна или через RPC-узел.
   */
  async verifyTransaction(txId: string, network: BlockchainNetwork): Promise<BlockchainTransaction | null> {
    // ЗАГЛУШКА
    console.log(`Verifying tx ${txId} on ${network}...`);
    
    // Симулируем задержку API
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Для демонстрационных целей возвращаем успешную транзакцию, если txId начинается с 'test_'
    if (txId.startsWith('test_')) {
      return {
        txId,
        network,
        from: '0xsender_address',
        to: '0xrecipient_address',
        amount: 100.0,
        asset: 'USDT',
        status: 'SUCCESS',
      };
    }

    return null;
  }

  private async getWalletId(userId: string): Promise<string> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) throw new Error('Wallet not found');
    return wallet.id;
  }
}

export const blockchainService = new BlockchainService();

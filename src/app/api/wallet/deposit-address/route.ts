// src/app/api/wallet/deposit-address/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { blockchainService, BlockchainNetwork } from '@/lib/blockchain';
import { z } from 'zod';

const querySchema = z.object({
  network: z.enum(['TRC20', 'BEP20', 'APTOS']),
});

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const network = searchParams.get('network') as BlockchainNetwork;

    const parsed = querySchema.safeParse({ network });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    const net = parsed.data.network;

    // Сначала проверяем, задал ли админ фиксированный адрес в настройках
    const settingKey = `WALLET_${net}`;
    const customAddress = await prisma.systemSetting.findUnique({
      where: { key: settingKey }
    });

    if (customAddress && customAddress.value && customAddress.value.trim() !== '') {
      return NextResponse.json({ 
        success: true, 
        address: customAddress.value,
        network: net 
      });
    }

    const address = await blockchainService.generateAddress(net, authUser.userId);

    return NextResponse.json({ 
      success: true, 
      address,
      network: parsed.data.network 
    });
  } catch (error: any) {
    console.error('Deposit Address Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get deposit address' }, { status: 500 });
  }
}

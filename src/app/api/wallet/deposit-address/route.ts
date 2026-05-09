// src/app/api/wallet/deposit-address/route.ts
import { NextResponse } from 'next/server';
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

    const address = await blockchainService.generateAddress(parsed.data.network, authUser.userId);

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

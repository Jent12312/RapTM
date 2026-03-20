import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const { userId } = await req.json();
  
  const updatedWallet = await prisma.wallet.update({
    where: { userId },
    data: { usdtBalance: { increment: 100 } }
  });

  return NextResponse.json({ success: true, balance: updatedWallet.usdtBalance });
}
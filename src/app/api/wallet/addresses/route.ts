// src/app/api/wallet/addresses/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';

const addressSchema = z.object({
  network: z.enum(['TRC20', 'BEP20', 'ERC20', 'APTOS']),
  address: z.string().min(10),
  label: z.string().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
});

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const wallet = await prisma.wallet.findUnique({
      where: { userId: authUser.userId },
      include: {
        withdrawalAddresses: {
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    return NextResponse.json({ addresses: wallet.withdrawalAddresses });
  } catch (error) {
    console.error('Get Addresses Error:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = addressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { network, address, label, isDefault } = parsed.data;

    const wallet = await prisma.wallet.findUnique({
      where: { userId: authUser.userId },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (isDefault) {
      await prisma.withdrawalAddress.updateMany({
        where: { walletId: wallet.id, network: network.toUpperCase() },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.withdrawalAddress.create({
      data: {
        walletId: wallet.id,
        network: network.toUpperCase(),
        address,
        label: label || null,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ success: true, address: newAddress });
  } catch (error) {
    console.error('Add Address Error:', error);
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    // Check if address belongs to the user
    const address = await prisma.withdrawalAddress.findUnique({
        where: { id: addressId },
        include: { wallet: true }
    });

    if (!address || address.wallet.userId !== authUser.userId) {
        return NextResponse.json({ error: 'Address not found or unauthorized' }, { status: 404 });
    }

    await prisma.withdrawalAddress.delete({
      where: { id: addressId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Address Error:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
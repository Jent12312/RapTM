// src/app/api/wallet/addresses/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
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
    const body = await req.json();
    const { userId, network, address, label, isDefault } = body;

    if (!userId || !network || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, network, address' },
        { status: 400 }
      );
    }

    const validNetworks = ['TRC20', 'BEP20', 'ERC20', 'APTOS'];
    if (!validNetworks.includes(network.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid network. Use: TRC20, BEP20, ERC20, APTOS' },
        { status: 400 }
      );
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
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
    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
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
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['EXCHANGE_RATE', 'EXCHANGE_FEE']
        }
      }
    });

    const settingsMap = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {
      EXCHANGE_RATE: '19.5', // Fallback defaults
      EXCHANGE_FEE: '1'
    });

    return NextResponse.json(settingsMap);
  } catch (error) {
    // Return defaults if DB fails
    return NextResponse.json({
      EXCHANGE_RATE: '19.5',
      EXCHANGE_FEE: '1'
    });
  }
}

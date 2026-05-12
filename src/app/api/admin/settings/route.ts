import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';

// GET /api/admin/settings
export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json(settingsMap);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST /api/admin/settings
export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { key, value } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Если меняем курс, записываем в историю и обновляем спец. таблицу
    if (key === 'EXCHANGE_RATE' || key === 'RATE_FROZEN') {
      const isRate = key === 'EXCHANGE_RATE';
      const rateVal = isRate ? parseFloat(value) : undefined;
      const frozenVal = !isRate ? (value === 'true') : undefined;

      if (isRate) {
        const oldSetting = await prisma.systemSetting.findUnique({ where: { key: 'EXCHANGE_RATE' } });
        const oldRate = oldSetting ? parseFloat(oldSetting.value) : 0;
        
        await prisma.rateHistory.create({
          data: {
            oldRate,
            newRate: rateVal!,
            changedBy: authUser.userId
          }
        });
      }

      await prisma.exchangeRate.upsert({
        where: { id: 'global' },
        update: { 
          ...(rateVal !== undefined && { rate: rateVal }),
          ...(frozenVal !== undefined && { isFrozen: frozenVal })
        },
        create: { 
          id: 'global',
          rate: rateVal || 19.5,
          isFrozen: frozenVal || false
        }
      });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });

    // Audit log
    await prisma.adminAction.create({
      data: {
        adminId: authUser.userId,
        action: 'SETTINGS_CHANGE',
        targetId: key,
        details: `Изменена настройка ${key} на ${value}`,
        ip
      }
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Settings save error [ADMIN]:', error);
    return NextResponse.json({ 
      error: 'Failed to save setting', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

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

    console.log(`[ADMIN] Settings change request: ${key} = ${value} from IP ${ip}`);

    // Если меняем курс, записываем в историю и обновляем спец. таблицу
    if (key === 'EXCHANGE_RATE' || key === 'RATE_FROZEN') {
      const isRate = key === 'EXCHANGE_RATE';
      let rateVal: number | undefined;
      let frozenVal: boolean | undefined;

      if (isRate) {
        rateVal = parseFloat(value);
        if (isNaN(rateVal)) {
          return NextResponse.json({ error: 'Invalid rate value' }, { status: 400 });
        }
      } else {
        frozenVal = value === 'true' || value === true;
      }

      if (isRate && rateVal !== undefined) {
        try {
          const oldSetting = await prisma.systemSetting.findUnique({ where: { key: 'EXCHANGE_RATE' } });
          const oldRate = oldSetting ? parseFloat(oldSetting.value) : 0;
          
          await prisma.rateHistory.create({
            data: {
              oldRate,
              newRate: rateVal,
              changedBy: authUser.userId
            }
          });
        } catch (historyError) {
          console.error('[ADMIN] Failed to save rate history:', historyError);
          // Продолжаем выполнение, даже если история не сохранилась
        }
      }

      try {
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
        console.log(`[ADMIN] exchangeRate table updated: rate=${rateVal}, frozen=${frozenVal}`);
      } catch (upsertError) {
        console.error('[ADMIN] ExchangeRate table upsert failed:', upsertError);
        return NextResponse.json({ error: 'Failed to update global exchange rate table', details: String(upsertError) }, { status: 500 });
      }
    }

    try {
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

      console.log(`[ADMIN] SystemSetting ${key} successfully updated to ${value}`);
      return NextResponse.json(setting);
    } catch (dbError) {
      console.error(`[ADMIN] SystemSetting upsert failed for ${key}:`, dbError);
      return NextResponse.json({ 
        error: 'Failed to save setting to database', 
        details: dbError instanceof Error ? dbError.message : String(dbError) 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Settings save error [ADMIN]:', error);
    return NextResponse.json({ 
      error: 'Failed to save setting', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

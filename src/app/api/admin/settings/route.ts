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

    // Если меняем курс, записываем в историю
    if (key === 'EXCHANGE_RATE') {
      const oldSetting = await prisma.systemSetting.findUnique({ where: { key: 'EXCHANGE_RATE' } });
      const oldRate = oldSetting ? parseFloat(oldSetting.value) : 0;
      const newRate = parseFloat(value);

      await prisma.rateHistory.create({
        data: {
          oldRate,
          newRate,
          changedBy: authUser.userId
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
    console.error('Settings save error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

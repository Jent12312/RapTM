// src/app/api/admin/system/hot-cold-sweep/route.ts
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/getAuthUser';
import { manageHotColdStorage } from '@/lib/hot-cold-service';
import { logAction } from '@/lib/logger';

/**
 * Ручной запуск процесса перемещения средств с горячих на холодные кошельки.
 * Доступно только администраторам.
 */
export async function POST(req: Request) {
  try {
    // 1. Проверка авторизации и прав админа
    const authUser = await getAuthUser(true);
    if (!authUser || !authUser.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 2. Логируем действие админа
    await logAction({
      userId: authUser.userId,
      action: 'ADMIN_TRIGGER_HOT_COLD_SWEEP',
      severity: 'WARNING',
      details: 'Administrator triggered manual hot-to-cold sweep process.',
      ip
    });

    // 3. Запускаем процесс
    // В реальности это может занять время, поэтому можно запустить без await 
    // или дождаться завершения, если кошельков немного.
    await manageHotColdStorage();

    return NextResponse.json({ 
      success: true, 
      message: 'Hot-to-cold sweep process executed successfully. Check logs for details.' 
    });

  } catch (error) {
    console.error('Hot-Cold Sweep Error:', error);
    return NextResponse.json({ error: 'Failed to execute sweep process' }, { status: 500 });
  }
}

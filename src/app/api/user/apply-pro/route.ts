import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { isEligibleForPro } from '@/lib/userStats';
import { sendAdminNotification } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = authUser.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.level === 'Pro' || user.level === 'Partner') {
      return NextResponse.json({ error: 'User already has advanced level' }, { status: 400 });
    }

    // Проверка соответствия критериям
    const isEligible = await isEligibleForPro(userId);
    if (!isEligible) {
      return NextResponse.json({ error: 'User is not eligible for Pro status' }, { status: 400 });
    }

    // Отправка уведомления админу (в реальном приложении можно создать заявку в БД)
    await sendAdminNotification(
      `💎 <b>Новая заявка на статус Pro!</b>\n\n` +
      `👤 <b>Пользователь:</b> @${user.username || user.firstName}\n` +
      `🆔 <b>ID:</b> <code>${user.telegramId}</code>\n` +
      `📊 <b>Сделок:</b> ${user.tradesCount}\n` +
      `💰 <b>Объём:</b> ${user.volumeTotal} USDT\n` +
      `⭐️ <b>Рейтинг:</b> ${user.rating.toFixed(2)}\n\n` +
      `Пожалуйста, проверьте пользователя и обновите уровень в админ-панели.`
    );

    return NextResponse.json({ success: true, message: 'Application sent to support' });
  } catch (error) {
    console.error('Apply Pro error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

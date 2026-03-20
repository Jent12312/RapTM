import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (body.inline_query) {
      const queryId = body.inline_query.id;
      const queryText = body.inline_query.query;

      if (queryText.startsWith('profile_')) {
        const userId = queryText.replace('profile_', '');
        
        const user = await prisma.user.findFirst({
          where: { OR: [{ id: userId }, { telegramId: userId }] }
        });

        let statsText = `❌ Пользователь не найден`;
        
        if (user) {
          // Вычисляем РЕАЛЬНУЮ статистику
          const reviews = await prisma.review.findMany({ where: { targetId: user.id } });
          const orders = await prisma.order.findMany({
            where: { OR: [{ buyerId: user.id }, { sellerId: user.id }], status: 'COMPLETED' }
          });

          const goodReviews = reviews.filter(r => r.rating === 'GOOD').length;
          const totalReviews = reviews.length;
          const ratingPercent = totalReviews > 0 ? Math.round((goodReviews / totalReviews) * 100) : 0;
          const volume = orders.reduce((acc, curr) => acc + curr.amountAsset, 0);

          statsText = `👤 <b>Мерчант: ${user.nickname || user.firstName}</b> ⚡️\n\n🛡 Статус: ${user.isVerified ? 'Проверен' : 'Базовый'}\n📊 Сделок: ${orders.length}\n✅ Выполнено: 100%\n💎 Объём: ${volume.toFixed(2)} USDT\n👍 Рейтинг: ${ratingPercent}%\n\n👇 <i>Нажмите кнопку ниже, чтобы открыть профиль продавца в Rapira TM!</i>`;
        }

        const responsePayload = {
          inline_query_id: queryId,
          results: [{
            type: 'article',
            id: 'profile_card',
            title: user ? `Профиль: ${user.nickname || user.firstName}` : 'Не найдено',
            description: 'Поделиться статистикой продавца',
            thumbnail_url: 'https://cdn-icons-png.flaticon.com/512/6001/6001368.png', 
            input_message_content: {
              message_text: statsText,
              parse_mode: 'HTML'
            },
            reply_markup: {
              inline_keyboard: [[
                { text: '📋 Посмотреть профиль', url: `https://t.me/rapira_tm_bot/app?startapp=user_${userId}` }
              ]]
            }
          }],
          cache_time: 0
        };

        await fetch(`https://api.telegram.org/bot${TOKEN}/answerInlineQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(responsePayload)
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: true });
  }
}
// src/app/api/webhook/telegram/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!TOKEN) {
      console.error("ОШИБКА: Нет токена TELEGRAM_BOT_TOKEN");
      return NextResponse.json({ ok: true });
    }

    if (body.inline_query) {
      const queryId = body.inline_query.id;
      const queryText = body.inline_query.query;

      if (queryText.startsWith('profile_')) {
        const userId = queryText.replace('profile_', '');
        
        const user = await prisma.user.findFirst({
          where: { OR: [{ id: userId }, { telegramId: userId }] }
        });

        // Используем HTML вместо Markdown (он на 100% стабильный)
        const messageText = user 
          ? `👤 <b>Мерчант: ${user.firstName}</b> ⚡️\n\n🛡 Статус: ${user.isVerified ? 'Проверен' : 'Базовый'}\n📊 Сделок: 0\n✅ Выполнено: 0%\n💎 Объём: 0 USDT\n\n👇 <i>Нажмите кнопку ниже, чтобы открыть профиль продавца в Rapira TM!</i>`
          : `❌ Пользователь не найден`;

        const responsePayload = {
          inline_query_id: queryId,
          results: [{
            type: 'article',
            id: 'profile_card',
            title: user ? `Профиль: ${user.firstName}` : 'Не найдено',
            description: 'Нажмите, чтобы отправить профиль продавца',
            thumbnail_url: 'https://cdn-icons-png.flaticon.com/512/6001/6001368.png', 
            input_message_content: {
              message_text: messageText,
              parse_mode: 'HTML' // <-- ИСПОЛЬЗУЕМ HTML
            },
            reply_markup: {
              inline_keyboard: [[
                { 
                  text: '📋 Посмотреть профиль', 
                  // ВАЖНО: ЗАМЕНИ rapira_tm_bot НА СВОЕГО БОТА
                  url: `https://t.me/rapira_tm_bot/app?startapp=user_${userId}` 
                }
              ]]
            }
          }],
          cache_time: 0
        };

        const tgRes = await fetch(`https://api.telegram.org/bot${TOKEN}/answerInlineQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(responsePayload)
        });
        
        const tgData = await tgRes.json();
        console.log("Ответ от Telegram:", tgData); // Запишем ответ от ТГ в логи Vercel
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ ok: true });
  }
}
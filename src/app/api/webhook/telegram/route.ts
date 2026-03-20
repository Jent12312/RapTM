// src/app/api/webhook/telegram/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Получаем токен из переменных окружения
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Если это Inline запрос (когда пишут @твой_бот profile_123)
    if (body.inline_query) {
      const queryId = body.inline_query.id;
      const queryText = body.inline_query.query; // тут будет "profile_6859842859"

      if (queryText.startsWith('profile_')) {
        const userId = queryText.replace('profile_', '');
        
        // Ищем продавца в базе данных
        const user = await prisma.user.findFirst({
          where: { OR: [{ id: userId }, { telegramId: userId }] }
        });

        // Формируем красивый текст для сообщения
        const messageText = user 
          ? `👤 **Мерчант: ${user.firstName}** ⚡️\n\n🛡 Статус: ${user.isVerified ? 'Проверен' : 'Базовый'}\n📊 Сделок: 0\n✅ Выполнено: 0%\n💎 Объём: 0 USDT\n\n👇 *Нажмите кнопку ниже, чтобы открыть безопасный профиль продавца в Rapira TM!*`
          : `❌ Пользователь не найден`;

        // Формируем ответ для Телеграма (ту самую карточку, которая всплывает над клавиатурой)
        const responsePayload = {
          inline_query_id: queryId,
          results: [
            {
              type: 'article',
              id: 'profile_card',
              title: user ? `Профиль: ${user.firstName}` : 'Не найдено',
              description: 'Нажмите, чтобы отправить профиль продавца',
              // Можешь заменить эту ссылку на свой логотип Rapira
              thumbnail_url: 'https://cdn-icons-png.flaticon.com/512/6001/6001368.png', 
              input_message_content: {
                message_text: messageText,
                parse_mode: 'Markdown'
              },
              reply_markup: {
                inline_keyboard: [[
                  // Та самая кнопка, открывающая Mini App по Дип-линку
                  { 
                    text: '📋 Посмотреть профиль', 
                    url: `https://t.me/rapira_tm_bot/app?startapp=user_${userId}` 
                  }
                ]]
              }
            }
          ],
          cache_time: 0 // Не кешировать, чтобы данные всегда были свежими
        };

        // Отправляем сформированную карточку обратно в Телеграм
        await fetch(`https://api.telegram.org/bot${TOKEN}/answerInlineQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(responsePayload)
        });
      }
    }

    // Всегда отвечаем 200 OK, чтобы Телеграм понял, что мы приняли запрос
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ ok: false });
  }
}
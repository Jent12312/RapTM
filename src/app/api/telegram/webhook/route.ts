// src/app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotification } from '@/lib/telegram';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Webhook для получения обновлений от Telegram Bot
 * Telegram отправляет POST запросы при любых взаимодействиях с ботом
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Telegram webhook received:', JSON.stringify(body, null, 2));

    // 1. Обработка Inline Query (поиск профиля)
    if (body.inline_query) {
      await handleInlineQuery(body.inline_query);
      return NextResponse.json({ ok: true });
    }

    // 2. Обработка нового сообщения
    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id;
      const telegramId = message.from.id.toString();
      const text = message.text;

      // Находим или создаём пользователя
      let user = await prisma.user.findUnique({
        where: { telegramId },
      });

      if (!user) {
        // Пользователь не найден - создаём нового
        user = await prisma.user.create({
          data: {
            telegramId,
            username: message.from.username,
            firstName: message.from.first_name,
            tgChatId: chatId.toString(),
          },
        });
      } else {
        // Обновляем chatId (мог измениться)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            tgChatId: chatId.toString(),
            username: message.from.username,
            firstName: message.from.first_name,
          },
        });
      }

      // Обработка команд
      if (text?.startsWith('/')) {
        await handleCommand(chatId, text, user);
      }

      // Обработка start_param (привязка аккаунта)
      if (text === '/start' && message.from) {
        const startParam = message.start_parameter;
        if (startParam && startParam.startsWith('USER_')) {
          const userId = startParam.replace('USER_', '');
          await prisma.user.update({
            where: { id: userId },
            data: { tgChatId: chatId.toString() },
          });
          await sendMessage(chatId, '✅ Аккаунт успешно привязан!\n\nТеперь вы будете получать уведомления о сделках.');
        }
      }
    }

    // 3. Обработка callback query (кнопки)
    if (body.callback_query) {
      const callback = body.callback_query;
      const chatId = callback.message.chat.id;
      const data = callback.data;

      await handleCallback(chatId, data);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: false, error: 'Webhook error' });
  }
}

/**
 * Обработка Inline Query (поиск профиля для shares)
 */
async function handleInlineQuery(inlineQuery: any) {
  const queryId = inlineQuery.id;
  const queryText = inlineQuery.query;

  if (queryText.startsWith('profile_')) {
    const userId = queryText.replace('profile_', '');

    const user = await prisma.user.findFirst({
      where: { OR: [{ id: userId }, { telegramId: userId }] }
    });

    let statsText = `❌ Пользователь не найден`;

    if (user) {
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

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerInlineQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responsePayload)
    });
  }
}

/**
 * Обработка команд бота
 */
async function handleCommand(chatId: number, command: string, user: any) {
  const cmd = command.split(' ')[0].toLowerCase();
  const args = command.split(' ').slice(1);

  switch (cmd) {
    case '/start':
      await sendMessage(chatId, `
👋 <b>Добро пожаловать, ${user.firstName || 'Пользователь'}!</b>

Я ваш персональный P2P ассистент.

📋 <b>Мои команды:</b>
/status - Проверить статус сделок
/help - Помощь
/notifications - Управление уведомлениями
/enable - Включить уведомления
/disable - Отключить уведомления
/unlink - Отвязать аккаунт

🔗 Для привязки аккаунта используйте кнопку в приложении.
      `.trim());
      break;

    case '/status':
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { buyerId: user.id },
            { sellerId: user.id },
          ],
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (orders.length === 0) {
        await sendMessage(chatId, 'У вас нет активных сделок.');
      } else {
        let message = '📊 <b>Ваши активные сделки:</b>\n\n';
        for (const order of orders) {
          message += `🛒 <code>${order.id}</code>\n`;
          message += `💰 ${order.amountFiat} ${order.status === 'PENDING' ? '⏳ Ожидание' : '✅ Оплачено'}\n\n`;
        }
        await sendMessage(chatId, message);
      }
      break;

    case '/help':
      await sendMessage(chatId, `
❓ <b>Помощь</b>

🤖 Я P2P бот для уведомлений о сделках.

📱 <b>Как это работает:</b>
1. Привяжите аккаунт в приложении
2. Получайте уведомления о сделках
3. Управляйте настройками

⚙️ <b>Команды:</b>
/start - Начать общение
/status - Статус сделок
/notifications - Настройки
/unlink - Отвязать аккаунт
      `.trim());
      break;

    case '/notifications':
      const notificationsEnabled = user.tgNotifications !== false;
      await sendMessage(
        chatId,
        `🔔 <b>Уведомления:</b> ${notificationsEnabled ? '✅ Включены' : '❌ Отключены'}\n\nИспользуйте /enable или /disable для управления.`
      );
      break;

    case '/enable':
      await prisma.user.update({
        where: { id: user.id },
        data: { tgNotifications: true },
      });
      await sendMessage(chatId, '✅ Уведомления включены!');
      break;

    case '/disable':
      await prisma.user.update({
        where: { id: user.id },
        data: { tgNotifications: false },
      });
      await sendMessage(chatId, '❌ Уведомления отключены!');
      break;

    case '/unlink':
      await prisma.user.update({
        where: { id: user.id },
        data: { tgChatId: null },
      });
      await sendMessage(chatId, '🔗 Аккаунт отвязан. Используйте /start для повторной привязки.');
      break;

    default:
      await sendMessage(chatId, '❓ Неизвестная команда. Используйте /help для списка команд.');
  }
}

/**
 * Обработка callback query (кнопки под сообщениями)
 */
async function handleCallback(chatId: number, data: string) {
  // Парсим данные callback
  const [action, ...args] = data.split(':');

  switch (action) {
    case 'confirm_payment':
      const orderId = args[0];
      await sendMessage(chatId, `✅ Оплата по сделке ${orderId} подтверждена!`);
      break;

    case 'dispute':
      const disputeOrderId = args[0];
      await sendMessage(chatId, `⚠️ Спор по сделке ${disputeOrderId} открыт. Ожидайте администратора.`);
      break;

    default:
      console.log('Unknown callback:', data);
  }
}

/**
 * Отправка сообщения через Telegram API
 */
async function sendMessage(chatId: number, text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

// GET для проверки webhook
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Telegram webhook is running',
    timestamp: new Date().toISOString(),
  });
}

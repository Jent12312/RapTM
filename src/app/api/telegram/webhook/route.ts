// src/app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotification, sendAdminNotification } from '@/lib/telegram';
import { t, Language } from '@/lib/dictionaries';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL || 'https://rap-tm.vercel.app';

// Helper function for localization
function getLocalizedText(user: any, key: Parameters<typeof t>[1], replacements?: { [key: string]: string | number }) {
  let text = t(user.language as Language || 'ru', key);
  if (replacements) {
    for (const placeholder in replacements) {
      text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(replacements[placeholder]));
    }
  }
  return text;
}

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

        // Проверка выбора языка
        if (startParam && startParam.startsWith('lang_')) {
          const lang = startParam.replace('lang_', '');
          await prisma.user.update({
            where: { id: user.id },
            data: { language: lang as 'ru' | 'tm' | 'en' },
          });
          const langNames: Record<string, string> = {
            ru: '🇷🇺 Русский',
            tm: '🇹🇲 Türkmençe',
            en: '🇬🇧 English',
          };
          await sendMessage(chatId, `✅ Язык выбран: ${langNames[lang] || lang}\n\nТеперь вы будете получать уведомления на этом языке.`);
          return NextResponse.json({ ok: true });
        }

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
      const fromId = callback.from.id.toString();

      await handleCallback(chatId, data, fromId);
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
            { text: '📋 Посмотреть профиль', url: `${APP_URL}?startapp=user_${userId}` }
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
      // Проверяем, выбран ли уже язык
      if (user.language) {
        await sendMessage(chatId, getLocalizedText(user, 'botWelcomeUser', { username: user.firstName || getLocalizedText(user, 'userLabel') }) + '\n\n' +
                                  getLocalizedText(user, 'botP2PAssistant') + '\n\n' +
                                  getLocalizedText(user, 'botMyCommands') + '\n' +
                                  getLocalizedText(user, 'botCheckTrades') + '\n' +
                                  getLocalizedText(user, 'botHelpCommand') + '\n' +
                                  getLocalizedText(user, 'botNotificationsCommand') + '\n' +
                                  getLocalizedText(user, 'botEnableNotifications') + '\n' +
                                  getLocalizedText(user, 'botDisableNotifications') + '\n' +
                                  getLocalizedText(user, 'botUnlinkAccount') + '\n\n' +
                                  getLocalizedText(user, 'botConnectAccountTip'));
      } else {
        // Показываем выбор языка
        const keyboard = [[
          { text: getLocalizedText(user, 'botRussian'), callback_data: 'lang:ru' },
          { text: getLocalizedText(user, 'botTurkmen'), callback_data: 'lang:tm' },
          { text: getLocalizedText(user, 'botEnglish'), callback_data: 'lang:en' }
        ]];
        await sendMessageWithKeyboard(
          chatId,
          getLocalizedText(user, 'botWelcome') + '\n\n' + getLocalizedText(user, 'botSelectLanguage'),
          keyboard
        );
      }
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
        await sendMessage(chatId, getLocalizedText(user, 'botNoActiveDeals'));
      } else {
        // Формируем сообщение с кнопками для каждой сделки
        const keyboard = orders.map(order => [{
          text: ` ${order.amountFiat} ${order.status === 'PENDING' ? '⏳' : '✅'}`,
          url: `${APP_URL}?startapp=order_${order.id}`
        }]);

        await sendMessageWithKeyboard(chatId, getLocalizedText(user, 'botYourActiveDeals'), keyboard);
      }
      break;

    case '/help':
      await sendMessage(chatId, getLocalizedText(user, 'botHelpTitle') + '\n\n' +
                                getLocalizedText(user, 'botHelpDesc1') + '\n\n' +
                                getLocalizedText(user, 'botHelpDesc2') + '\n\n' +
                                getLocalizedText(user, 'botHelpCommands') + '\n' +
                                getLocalizedText(user, 'botCheckTrades') + '\n' +
                                getLocalizedText(user, 'botHelpCommand') + '\n' +
                                getLocalizedText(user, 'botNotificationsCommand') + '\n' +
                                getLocalizedText(user, 'botUnlinkAccount'));
      break;

    case '/notifications':
      const notificationsEnabled = user.tgNotifications !== false;
      await sendMessage(
        chatId,
        getLocalizedText(user, 'botNotificationsStatus', { status: notificationsEnabled ? getLocalizedText(user, 'botEnabled') : getLocalizedText(user, 'botDisabled') })
      );
      break;

    case '/enable':
      await prisma.user.update({
        where: { id: user.id },
        data: { tgNotifications: true },
      });
      await sendMessage(chatId, getLocalizedText(user, 'botNotificationsEnabled'));
      break;

    case '/disable':
      await prisma.user.update({
        where: { id: user.id },
        data: { tgNotifications: false },
      });
      await sendMessage(chatId, getLocalizedText(user, 'botNotificationsDisabled'));
      break;

    case '/unlink':
      await prisma.user.update({
        where: { id: user.id },
        data: { tgChatId: null },
      });
      await sendMessage(chatId, getLocalizedText(user, 'botAccountUnlinked'));
      break;

    default:
      await sendMessage(chatId, getLocalizedText(user, 'botUnknownCommand'));
  }
}

/**
 * Обработка callback query (кнопки под сообщениями)
 */
async function handleCallback(chatId: number, data: string, fromId: string) {
  // Парсим данные callback
  const [action, ...args] = data.split(':');

  // Получаем пользователя для локализации
  const user = await prisma.user.findUnique({
    where: { telegramId: fromId },
  });

  switch (action) {
    case 'lang':
      const lang = args[0];

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { language: lang as 'ru' | 'tm' | 'en' },
        });

        const langNames: Record<string, string> = {
          ru: getLocalizedText(user, 'botRussian'),
          tm: getLocalizedText(user, 'botTurkmen'),
          en: getLocalizedText(user, 'botEnglish'),
        };

        await sendMessage(chatId, getLocalizedText(user, 'botLanguageSelected') + ` ${langNames[lang] || lang}` + '\n\n' + getLocalizedText(user, 'botConnectAccountTip'));
      }
      break;

    case 'confirm_payment':
      const orderId = args[0];
      await sendMessage(chatId, getLocalizedText(user || { language: 'ru' }, 'botPaymentConfirmed', { orderId }));
      break;

    case 'dispute':
      const disputeOrderId = args[0];
      await sendMessage(chatId, getLocalizedText(user || { language: 'ru' }, 'botDisputeOpened', { orderId: disputeOrderId }));
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

/**
 * Отправка сообщения с клавиатурой (inline buttons)
 */
async function sendMessageWithKeyboard(
  chatId: number,
  text: string,
  keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>>
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to send Telegram message with keyboard:', error);
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

// src/lib/telegram.ts

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;
const APP_URL = process.env.APP_URL || 'https://rap-tm.vercel.app';

// Типы уведомлений
export type NotificationType =
  | 'order_created'      // Новая сделка
  | 'order_paid'         // Покупатель подтвердил оплату
  | 'order_completed'    // Сделка завершена
  | 'order_cancelled'    // Сделка отменена
  | 'order_disputed'     // Открыт спор
  | 'kyc_approved'       // KYC одобрен
  | 'kyc_rejected'       // KYC отклонён
  | 'new_message'        // Новое сообщение в чате
  | 'review_received'    // Получен отзыв
  | 'ad_published'       // Объявление опубликовано
  | 'ad_expired'         // Объявление истекло
  | 'welcome';           // Приветственное сообщение

interface NotificationData {
  type: NotificationType;
  userId: string;
  data: Record<string, any>;
}

interface TelegramMessage {
  text: string;
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      url?: string;
      callback_data?: string;
    }>>;
  };
}

/**
 * Отправка уведомления пользователю
 */
export async function sendNotification(
  chatId: string | null | undefined,
  type: NotificationType,
  data: Record<string, any> = {}
): Promise<boolean> {
  if (!chatId || !TELEGRAM_BOT_TOKEN) {
    console.log('Telegram notifications disabled:', { chatId, hasToken: !!TELEGRAM_BOT_TOKEN });
    return false;
  }

  const messageObj = formatNotification(type, data);

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageObj.text,
        parse_mode: 'HTML',
        reply_markup: messageObj.reply_markup,
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram API Error:', result);
    }

    return result.ok;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

/**
 * Форматирование сообщения в зависимости от типа уведомления
 */
function formatNotification(type: NotificationType, data: Record<string, any>): TelegramMessage {
  const appUrl = APP_URL.replace('https://', '').replace('http://', '');
  
  switch (type) {
    case 'order_created': {
      const orderId = data.orderId;
      return {
        text: `
🛒 <b>Новая сделка создана!</b>

💰 Сумма: <b>${data.amountFiat} ${data.fiat}</b>
🪙 Криптовалюта: <b>${data.amountAsset} ${data.asset}</b>

👤 Покупатель: ${data.buyerName}
👤 Продавец: ${data.sellerName}

Статус: <b>Ожидание оплаты</b>
⏱ Время на оплату: ${data.paymentTime} мин
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📋 Открыть сделку',
              url: `https://t.me/rapira_tm_bot/app?startapp=order_${orderId}`
            }
          ]]
        }
      };
    }

    case 'order_paid': {
      const orderId = data.orderId;
      return {
        text: `
✅ <b>Покупатель подтвердил оплату!</b>

🛒 Сделка: <code>${orderId}</code>
💰 Сумма: <b>${data.amountFiat} ${data.fiat}</b>

Продавец, пожалуйста:
1️⃣ Проверьте получение средств
2️⃣ Подтвердите сделку в приложении
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📋 Открыть сделку',
              url: `https://t.me/rapira_tm_bot/app?startapp=order_${orderId}`
            }
          ]]
        }
      };
    }

    case 'order_completed': {
      const orderId = data.orderId;
      return {
        text: `
🎉 <b>Сделка завершена!</b>

🛒 Сделка: <code>${orderId}</code>
💰 Сумма: <b>${data.amountFiat} ${data.fiat}</b>
🪙 Получено: <b>${data.amountAsset} ${data.asset}</b>

Спасибо за использование P2P Market! 🙏
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '👛 Вернуться в кошелек',
              url: `https://t.me/rapira_tm_bot/app?startapp=wallet`
            }
          ]]
        }
      };
    }

    case 'order_cancelled': {
      const orderId = data.orderId;
      return {
        text: `
❌ <b>Сделка отменена</b>

🛒 Сделка: <code>${orderId}</code>
💰 Сумма: <b>${data.amountFiat} ${data.fiat}</b>

Причина: ${data.reason || 'Отменена пользователем'}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📋 Мои сделки',
              url: `https://t.me/rapira_tm_bot/app?startapp=my_orders`
            }
          ]]
        }
      };
    }

    case 'order_disputed': {
      const orderId = data.orderId;
      return {
        text: `
⚠️ <b>ОТКРЫТ СПОР!</b>

🛒 Сделка: <code>${orderId}</code>
💰 Сумма: <b>${data.amountFiat} ${data.fiat}</b>

👤 Инициатор: ${data.initiatorName}

Администратор рассмотрит спор в ближайшее время.
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📋 Открыть сделку',
              url: `https://t.me/rapira_tm_bot/app?startapp=order_${orderId}`
            }
          ]]
        }
      };
    }

    case 'kyc_approved':
      return {
        text: `
✅ <b>KYC одобрен!</b>

Ваш аккаунт успешно верифицирован 🎉

Теперь вам доступны:
✅ Создание объявлений без лимитов
✅ Участие в эксклюзивных сделках
✅ Повышенный уровень доверия

Спасибо за верификацию!
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📋 Перейти в P2P',
              url: `https://t.me/rapira_tm_bot/app?startapp=p2p`
            }
          ]]
        }
      };

    case 'kyc_rejected':
      return {
        text: `
❌ <b>KYC отклонён</b>

К сожалению, ваши документы не прошли проверку.

Причина: ${data.reason}

Вы можете загрузить документы повторно.
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📤 Повторить KYC',
              url: `https://t.me/rapira_tm_bot/app?startapp=kyc`
            }
          ]]
        }
      };

    case 'new_message': {
      const orderId = data.orderId;
      return {
        text: `
💬 <b>Новое сообщение</b>

👤 От: ${data.senderName}
🛒 Сделка: <code>${orderId}</code>

"${data.preview}"
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '💬 Открыть чат',
              url: `https://t.me/rapira_tm_bot/app?startapp=order_${orderId}`
            }
          ]]
        }
      };
    }

    case 'review_received':
      return {
        text: `
⭐ <b>Новый отзыв!</b>

👤 От: ${data.authorName}
⭐ Оценка: ${data.rating}

"${data.comment || 'Без комментария'}"

Продолжайте в том же духе! 🙌
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '👤 Мой профиль',
              url: `https://t.me/rapira_tm_bot/app?startapp=profile`
            }
          ]]
        }
      };

    case 'ad_published':
      return {
        text: `
📢 <b>Объявление опубликовано!</b>

${data.type === 'buy' ? '🟢 Покупка' : '🔴 Продажа'} ${data.asset}
💰 Цена: ${data.price} ${data.fiat}
📊 Лимиты: ${data.minLimit} - ${data.maxLimit} ${data.fiat}

Ваше объявление теперь видно в маркете!
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📋 Мои объявления',
              url: `https://t.me/rapira_tm_bot/app?startapp=my_ads`
            }
          ]]
        }
      };

    case 'ad_expired':
      return {
        text: `
⏰ <b>Объявление истекло</b>

Ваше объявление было деактивировано.

Вы можете создать новое объявление в любое время.
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '➕ Создать объявление',
              url: `https://t.me/rapira_tm_bot/app?startapp=create_ad`
            }
          ]]
        }
      };

    case 'welcome':
      return {
        text: `
👋 <b>Добро пожаловать в P2P Market!</b>

Спасибо за подключение к уведомлениям.

Теперь вы будете получать:
🔔 Уведомления о новых сделках
🔔 Статусы оплаты и подтверждения
🔔 Сообщения от контрагентов
🔔 Важные обновления безопасности

💡 <b>Совет:</b> Включите уведомления, чтобы не пропустить важные события!
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🚀 Открыть приложение',
              url: `https://t.me/rapira_tm_bot/app`
            }
          ]]
        }
      };

    default:
      return {
        text: `🔔 Уведомление: ${JSON.stringify(data)}`,
      };
  }
}

/**
 * Отправка уведомления пользователю по userId
 * (требуется подключение к БД)
 */
export async function notifyUser(
  userId: string,
  type: NotificationType,
  data: Record<string, any> = {}
): Promise<boolean> {
  // Динамический импорт prisma для избежания циклических зависимостей
  const { default: prisma } = await import('@/lib/prisma');
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tgChatId: true, tgNotifications: true },
  });

  if (!user?.tgChatId || user.tgNotifications === false) {
    return false;
  }

  return sendNotification(user.tgChatId, type, data);
}

/**
 * Установка webhook для Telegram Bot
 */
export async function setWebhook(): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_URL) {
    console.warn('Telegram webhook not configured');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: TELEGRAM_WEBHOOK_URL,
        allowed_updates: ['message', 'callback_query'],
      }),
    });

    const result = await response.json();
    console.log('Telegram webhook result:', result);
    
    return result.ok;
  } catch (error) {
    console.error('Failed to set Telegram webhook:', error);
    return false;
  }
}

/**
 * Удаление webhook
 */
export async function deleteWebhook(): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`;
    const response = await fetch(url);
    const result = await response.json();
    
    return result.ok;
  } catch (error) {
    console.error('Failed to delete Telegram webhook:', error);
    return false;
  }
}

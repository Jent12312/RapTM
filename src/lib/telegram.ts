// src/lib/telegram.ts

import { t, Language } from './dictionaries';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
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
 * Получение локализованного текста
 */
function getLocalizedText(lang: Language, key: keyof typeof import('./dictionaries')['dict']['ru'], replacements?: Record<string, string | number>): string {
  let text = t(lang, key);
  if (replacements) {
    for (const [placeholder, value] of Object.entries(replacements)) {
      text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
    }
  }
  return text;
}

/**
 * Отправка уведомления пользователю с локализацией
 */
export async function sendNotification(
  chatId: string | null | undefined,
  type: NotificationType,
  data: Record<string, any> = {},
  language: Language = 'ru'
): Promise<boolean> {
  if (!chatId || !TELEGRAM_BOT_TOKEN) {
    console.log('Telegram notifications disabled:', { chatId, hasToken: !!TELEGRAM_BOT_TOKEN });
    return false;
  }

  const messageObj = formatNotification(type, data, language);

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
 * Отправка уведомления администратору
 */
export async function sendAdminNotification(
  message: string,
  extraData?: Record<string, any>
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    return false;
  }

  try {
    // Получаем всех администраторов из БД
    const { default: prisma } = await import('@/lib/prisma');
    const admins = await prisma.user.findMany({
      where: { isAdmin: true, tgChatId: { not: null } },
      select: { tgChatId: true },
    });

    if (admins.length === 0) {
      console.log('No admin chat IDs found');
      return false;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    // Отправляем всем админам
    const promises = admins.map(async (admin) => {
      if (!admin.tgChatId) return;

      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: admin.tgChatId,
            text: message,
            parse_mode: 'HTML',
            ...(extraData?.reply_markup && { reply_markup: extraData.reply_markup }),
          }),
        });
      } catch (error) {
        console.error(`Failed to send admin notification to ${admin.tgChatId}:`, error);
      }
    });

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    return false;
  }
}

/**
 * Форвард сообщения от пользователя администраторам
 */
export async function forwardMessageToAdmins(
  fromUser: { telegramId: string; username?: string | null; firstName?: string | null },
  messageText: string,
  chatId: string
): Promise<void> {
  const adminMessage = `
📨 <b>Новое сообщение от пользователя</b>

👤 <b>От:</b> ${fromUser.firstName || fromUser.username || fromUser.telegramId}
🆔 <b>Telegram ID:</b> <code>${fromUser.telegramId}</code>
💬 <b>Чат:</b> <code>${chatId}</code>

📝 <b>Сообщение:</b>
${messageText}
  `.trim();

  await sendAdminNotification(adminMessage);
}

/**
 * Форматирование сообщения в зависимости от типа уведомления с локализацией
 */
function formatNotification(
  type: NotificationType,
  data: Record<string, any>,
  language: Language = 'ru'
): TelegramMessage {
  const appUrl = APP_URL.replace('https://', '').replace('http://', '');

  switch (type) {
    case 'order_created': {
      const orderId = data.orderId;
      return {
        text: `
${getLocalizedText(language, 'botNewOrder')}

${getLocalizedText(language, 'botOrderAmount')}: <b>${data.amountFiat} ${data.fiat}</b>
${getLocalizedText(language, 'botCryptoAmount')}: <b>${data.amountAsset} ${data.asset}</b>

${getLocalizedText(language, 'botBuyer')}: ${data.buyerName}
${getLocalizedText(language, 'botSeller')}: ${data.sellerName}

${getLocalizedText(language, 'botStatus')}: <b>${getLocalizedText(language, 'botPendingPayment')}</b>
${getLocalizedText(language, 'botPaymentTime')}: ${data.paymentTime} ${getLocalizedText(language, 'time')}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botOpenOrder'),
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
${getLocalizedText(language, 'botOrderPaid')}

${getLocalizedText(language, 'orderId')}: <code>${orderId}</code>
${getLocalizedText(language, 'botOrderAmount')}: <b>${data.amountFiat} ${data.fiat}</b>

${getLocalizedText(language, 'orderPaidSellerMessage', { seller: getLocalizedText(language, 'botSeller') })}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botOpenOrder'),
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
${getLocalizedText(language, 'botOrderCompleted')}

${getLocalizedText(language, 'orderId')}: <code>${orderId}</code>
${getLocalizedText(language, 'botOrderAmount')}: <b>${data.amountFiat} ${data.fiat}</b>
${getLocalizedText(language, 'botReceived')}: <b>${data.amountAsset} ${data.asset}</b>

${getLocalizedText(language, 'botThankYou')}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botBackToWallet'),
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
${getLocalizedText(language, 'botOrderCancelled')}

${getLocalizedText(language, 'orderId')}: <code>${orderId}</code>
${getLocalizedText(language, 'botOrderAmount')}: <b>${data.amountFiat} ${data.fiat}</b>

${getLocalizedText(language, 'botReason')}: ${data.reason || getLocalizedText(language, 'botCancelledByUser')}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botMyOrders'),
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
${getLocalizedText(language, 'botDisputeOpened')}

${getLocalizedText(language, 'orderId')}: <code>${orderId}</code>
${getLocalizedText(language, 'botOrderAmount')}: <b>${data.amountFiat} ${data.fiat}</b>

${getLocalizedText(language, 'botInitiator')}: ${data.initiatorName}

${getLocalizedText(language, 'botAdminWillReview')}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botOpenOrder'),
              url: `https://t.me/rapira_tm_bot/app?startapp=order_${orderId}`
            }
          ]]
        }
      };
    }

    case 'kyc_approved':
      return {
        text: `
${getLocalizedText(language, 'botKYCApproved')}

${getLocalizedText(language, 'botAccountVerified')}

${getLocalizedText(language, 'botNowAvailable')}
✅ ${getLocalizedText(language, 'botUnlimitedAds')}
✅ ${getLocalizedText(language, 'botExclusiveDeals')}
✅ ${getLocalizedText(language, 'botTrustedLevel')}

${getLocalizedText(language, 'botThankForVerify')}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botGoToP2P'),
              url: `https://t.me/rapira_tm_bot/app?startapp=p2p`
            }
          ]]
        }
      };

    case 'kyc_rejected':
      return {
        text: `
${getLocalizedText(language, 'botKYCRejected')}

${getLocalizedText(language, 'botTryAgain')}

${getLocalizedText(language, 'botReason')}: ${data.reason}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botRetryKYC'),
              url: `https://t.me/rapira_tm_bot/app?startapp=kyc`
            }
          ]]
        }
      };

    case 'new_message': {
      const orderId = data.orderId;
      return {
        text: `
${getLocalizedText(language, 'botNewMessage')}

${getLocalizedText(language, 'botFrom')}: ${data.senderName}
${getLocalizedText(language, 'orderId')}: <code>${orderId}</code>

"${data.preview}"
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botOpenChat'),
              url: `https://t.me/rapira_tm_bot/app?startapp=order_${orderId}`
            }
          ]]
        }
      };
    }

    case 'review_received':
      return {
        text: `
${getLocalizedText(language, 'botNewReview')}

${getLocalizedText(language, 'botFromUser')}: ${data.authorName}
⭐ ${getLocalizedText(language, 'rating') || 'Оценка'}: ${data.rating}

"${data.comment || getLocalizedText(language, 'noComment') || 'Без комментария'}"

${getLocalizedText(language, 'botKeepItUp')}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botMyProfile'),
              url: `https://t.me/rapira_tm_bot/app?startapp=profile`
            }
          ]]
        }
      };

    case 'ad_published':
      return {
        text: `
${getLocalizedText(language, 'botAdPublished')}

${data.type === 'buy' ? getLocalizedText(language, 'buy') : getLocalizedText(language, 'sell')} ${data.asset}
${getLocalizedText(language, 'botOrderAmount')}: ${data.price} ${data.fiat}
📊 ${getLocalizedText(language, 'limit')}: ${data.minLimit} - ${data.maxLimit} ${data.fiat}

${getLocalizedText(language, 'botYourAd')}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botMyAds'),
              url: `https://t.me/rapira_tm_bot/app?startapp=my_ads`
            }
          ]]
        }
      };

    case 'ad_expired':
      return {
        text: `
${getLocalizedText(language, 'botAdExpired')}

${getLocalizedText(language, 'botAdDeactivated')}

${getLocalizedText(language, 'botCreateNewAd')}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botCreateAd'),
              url: `https://t.me/rapira_tm_bot/app?startapp=create_ad`
            }
          ]]
        }
      };

    case 'welcome':
      return {
        text: `
${getLocalizedText(language, 'botWelcome')}

${getLocalizedText(language, 'botThanksForConnect')}

${getLocalizedText(language, 'botNowYouWillReceive')}
${getLocalizedText(language, 'botOrderNotifications')}
${getLocalizedText(language, 'botPaymentStatus')}
${getLocalizedText(language, 'botMessages')}
${getLocalizedText(language, 'botSecurityUpdates')}

${getLocalizedText(language, 'botTip')}
        `.trim(),
        reply_markup: {
          inline_keyboard: [[
            {
              text: getLocalizedText(language, 'botOpenApp'),
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
    select: { tgChatId: true, tgNotifications: true, language: true },
  });

  if (!user?.tgChatId || user.tgNotifications === false) {
    return false;
  }

  return sendNotification(
    user.tgChatId,
    type,
    data,
    (user.language as Language) || 'ru'
  );
}

/**
 * Установка webhook для Telegram Bot
 */
export async function setWebhook(): Promise<boolean> {
  const TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;

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

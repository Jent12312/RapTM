// src/lib/telegram.ts

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;

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

  const message = formatNotification(type, data);
  
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
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
function formatNotification(type: NotificationType, data: Record<string, any>): string {
  switch (type) {
    case 'order_created':
      return `
🛒 <b>Новая сделка создана!</b>

💰 Сумма: <b>${data.amountFiat} ${data.fiat}</b>
🪙 Криптовалюта: <b>${data.amountAsset} ${data.asset}</b>

👤 Покупатель: ${data.buyerName}
👤 Продавец: ${data.sellerName}

Статус: <b>Ожидание оплаты</b>
⏱ Время на оплату: ${data.paymentTime} мин

<a href="${data.orderUrl}">Открыть сделку</a>
      `.trim();

    case 'order_paid':
      return `
✅ <b>Покупатель подтвердил оплату!</b>

🛒 Сделка: <code>${data.orderId}</code>
💰 Сумма: <b>${data.amountFiat} ${data.fiat}</b>

Продавец, пожалуйста:
1️⃣ Проверьте получение средств
2️⃣ Подтвердите сделку в приложении

<a href="${data.orderUrl}">Открыть сделку</a>
      `.trim();

    case 'order_completed':
      return `
🎉 <b>Сделка завершена!</b>

🛒 Сделка: <code>${data.orderId}</code>
💰 Сумма: <b>${data.amountFiat} ${data.fiat}</b>
🪙 Получено: <b>${data.amountAsset} ${data.asset}</b>

Спасибо за использование P2P Market! 🙏
      `.trim();

    case 'order_cancelled':
      return `
❌ <b>Сделка отменена</b>

🛒 Сделка: <code>${data.orderId}</code>
💰 Сумма: <b>${data.amountFiat} ${data.fiat}</b>

Причина: ${data.reason || 'Отменена пользователем'}
      `.trim();

    case 'order_disputed':
      return `
⚠️ <b>ОТКРЫТ СПОР!</b>

🛒 Сделка: <code>${data.orderId}</code>
💰 Сумма: <b>${data.amountFiat} ${data.fiat}</b>

👤 Инициатор: ${data.initiatorName}

Администратор рассмотрит спор в ближайшее время.
      `.trim();

    case 'kyc_approved':
      return `
✅ <b>KYC одобрен!</b>

Ваш аккаунт успешно верифицирован 🎉

Теперь вам доступны:
✅ Создание объявлений без лимитов
✅ Участие в эксклюзивных сделках
✅ Повышенный уровень доверия

Спасибо за верификацию!
      `.trim();

    case 'kyc_rejected':
      return `
❌ <b>KYC отклонён</b>

К сожалению, ваши документы не прошли проверку.

Причина: ${data.reason}

Вы можете загрузить документы повторно.
      `.trim();

    case 'new_message':
      return `
💬 <b>Новое сообщение</b>

👤 От: ${data.senderName}
🛒 Сделка: <code>${data.orderId}</code>

"${data.preview}"

<a href="${data.orderUrl}">Открыть чат</a>
      `.trim();

    case 'review_received':
      return `
⭐ <b>Новый отзыв!</b>

👤 От: ${data.authorName}
⭐ Оценка: ${data.rating}

"${data.comment || 'Без комментария'}"

Продолжайте в том же духе! 🙌
      `.trim();

    case 'ad_published':
      return `
📢 <b>Объявление опубликовано!</b>

${data.type === 'buy' ? '🟢 Покупка' : '🔴 Продажа'} ${data.asset}
💰 Цена: ${data.price} ${data.fiat}
📊 Лимиты: ${data.minLimit} - ${data.maxLimit} ${data.fiat}

Ваше объявление теперь видно в маркете!
      `.trim();

    case 'ad_expired':
      return `
⏰ <b>Объявление истекло</b>

Ваше объявление было деактивировано.

Вы можете создать новое объявление в любое время.
      `.trim();

    case 'welcome':
      return `
👋 <b>Добро пожаловать в P2P Market!</b>

Спасибо за подключение к уведомлениям.

Теперь вы будете получать:
🔔 Уведомления о новых сделках
🔔 Статусы оплаты и подтверждения
🔔 Сообщения от контрагентов
🔔 Важные обновления безопасности

💡 <b>Совет:</b> Включите уведомления, чтобы не пропустить важные события!

<a href="${data.appUrl}">Открыть приложение</a>
      `.trim();

    default:
      return `🔔 Уведомление: ${JSON.stringify(data)}`;
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

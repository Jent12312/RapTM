import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const JWT_SECRET = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'default-secret-key-change-in-prod';
const JWT_EXPIRES_IN = '24h';

const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface TelegramAuthData {
  query_id?: string;
  user: string; // JSON-строка
  auth_date: string;
  hash: string;
  [key: string]: string | undefined;
}

/**
 * Проверяет initData Telegram Web App с помощью HMAC-SHA256
 * @param initData - необработанная строка initData из Telegram WebApp
 * @returns Разобранные данные пользователя и другие поля, если они валидны, иначе null
 */
export function validateTelegramWebAppData(initData: string): { user: any; [key: string]: any } | null {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not defined');
    return null;
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) return null;

    params.delete('hash');
    
    // Сортируем ключи и создаем строку для проверки данных
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем секретный ключ, используя "WebAppData" и токен бота
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN).digest();
    
    // Вычисляем хеш
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      console.warn('Telegram auth hash mismatch');
      return null;
    }

    // Проверяем срок действия (24 часа — стандарт для WebApps)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    
    if (now - authDate > 86400) {
      console.warn('Telegram auth data expired');
      return null;
    }

    const result: any = {};
    params.forEach((value, key) => {
      if (key === 'user') {
        result[key] = JSON.parse(value);
      } else {
        result[key] = value;
      }
    });

    return result;
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return null;
  }
}

/**
 * Подписывает JWT-токен с полезной нагрузкой пользователя
 */
export async function signJwt(payload: { userId: string; telegramId: string; role?: string; sessionVersion?: number }): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(encodedSecret);
    
  return jwt;
}

/**
 * Проверяет JWT-токен
 */
export async function verifyJwt(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload;
  } catch (error) {
    return null;
  }
}

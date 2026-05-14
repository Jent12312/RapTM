import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { rateLimit } from './lib/rate-limiter';

// Секретный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'default-secret-key-change-in-prod';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

// Маршруты, не требующие токена
const publicRoutes = [
  '/api/auth',
  '/api/telegram/webhook',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  // 1. Rate Limiting
  if (pathname.startsWith('/api')) {
    const { success, remaining, reset } = rateLimit(`rl_${ip}`, {
      limit: 100, // 100 requests
      window: 60 * 1000, // per minute
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }
  }

  // 2. Пропускаем публичные маршруты
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 3. Защищаем только /api маршруты
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Исключение: /api/p2p GET доступен всем для просмотра
  if (pathname === '/api/p2p' && request.method === 'GET') {
    return NextResponse.next();
  }

  // 4. Получаем токен из Cookies ИЛИ из заголовка Authorization (Фикс для iOS/Telegram)
  let token = request.cookies.get('auth_token')?.value;

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
  }

  try {
    // 5. Проверяем JWT-токен через `jose` (Edge-совместимая библиотека)
    const { payload } = await jwtVerify(token, encodedSecret);
    const userId = payload.userId as string;

    // Прокидываем userId в заголовки запроса, чтобы не декодировать токен повторно в route.ts
    const requestHeaders = new Headers(request.headers);
    if (userId) {
      requestHeaders.set('x-user-id', userId);
    }

    // ВАЖНО: Мы удалили вызов Prisma из Middleware. 
    // Запросы к БД нужно делать в конечных route.ts, где поддерживается Node.js

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Middleware JWT Error:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
  }
}

// Указываем, для каких путей работает Middleware
export const config = {
  matcher: ['/api/:path*'],
};
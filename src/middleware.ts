import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { rateLimit } from './lib/rate-limiter';

// Секретный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'ultra_12_token_Qq12';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

// Маршруты, не требующие токена
const publicRoutes = [
  '/api/auth',
  '/api/telegram/webhook',
];

export async function middleware(request: NextRequest) 
{
  const { pathname } = request.nextUrl;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  // Ограничений запросов
  if (pathname.startsWith('/api')) 
  {
    const { success, remaining, reset } = rateLimit(`rl_${ip}`, {
      limit: 100, 
      window: 60 * 1000, 
    });

    if (!success) 
    {
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

  // Пропускаем публичные маршруты
  if (publicRoutes.some(route => pathname.startsWith(route))) return NextResponse.next();

  // Защищаем только /api маршруты
  if (!pathname.startsWith('/api')) return NextResponse.next();
  
  // Исключение: /api/p2p GET доступен всем для просмотра
  if (pathname === '/api/p2p' && request.method === 'GET') return NextResponse.next(); 

  //Получаем токен 
  let token = request.cookies.get('auth_token')?.value;

  if (!token) 
  {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7);
  }

  if (!token) return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 }); 

  try 
  {
    // Проверяем JWT-токен через `jose`
    const { payload } = await jwtVerify(token, encodedSecret);
    const userId = payload.userId as string;

    // Прокидываем userId в заголовки запроса, чтобы не декодировать токен повторно
    const requestHeaders = new Headers(request.headers);
    if (userId) requestHeaders.set('x-user-id', userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } 
  catch (error) 
  {
    console.error('Middleware JWT Error:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
  }
}

export const config = { matcher: ['/api/:path*'], };
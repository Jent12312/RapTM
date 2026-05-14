import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { rateLimit } from './lib/rate-limiter';

const JWT_SECRET = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'default-secret-key-change-in-prod';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

// Routes that don't require authentication
const publicRoutes = [
  '/api/auth',
  '/api/telegram/webhook',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  // 1. Rate Limiting (Simple protection for all API routes)
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

  // 2. Check if the route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Only protect /api routes for now (and maybe others later)
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Special case: /api/p2p GET is public for browsing
  if (pathname === '/api/p2p' && request.method === 'GET') {
    return NextResponse.next();
  }

  // 3. Get token from cookies
  let token = request.cookies.get('auth_token')?.value;

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Убираем 'Bearer '
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
  }

  try {
    // 4. Verify token
    const { payload } = await jwtVerify(token, encodedSecret);
    const userId = payload.userId as string;

    if (userId) {
      // Import prisma and cache dynamically
      const { default: prisma } = await import('./lib/prisma');
      const { cache } = await import('./lib/cache');

      const cacheKey = `user_status_${userId}`;
      
      // Читаем кэш как объект (как это делает getAuthUser.ts)
      let cachedStatus = cache.get<{ isBlocked: boolean; sessionVersion?: number }>(cacheKey);

      if (!cachedStatus) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { isBlocked: true, sessionVersion: true }
        });
        cachedStatus = { isBlocked: user?.isBlocked || false, sessionVersion: user?.sessionVersion || undefined };
        cache.set(cacheKey, cachedStatus, 300); // Кэшируем на 5 минут
      }

      if (cachedStatus.isBlocked) {
        return NextResponse.json({ error: 'Ваш аккаунт заблокирован' }, { status: 403 });
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware JWT Error:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
  }
}

// Config to limit middleware to specific paths
export const config = {
  matcher: ['/api/:path*'],
};

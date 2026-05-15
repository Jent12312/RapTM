import { cookies } from 'next/headers';
import { verifyJwt } from './auth';
import prisma from './prisma';
import { cache } from './cache';

export interface AuthUser {
  userId: string;
  telegramId: string;
  role?: string;
  isBlocked?: boolean;
  isAdmin?: boolean;
}

/**
 * Извлекает и проверяет аутентифицированного пользователя из куки JWT.
 * Возвращает полезную нагрузку пользователя или null, если он не аутентифицирован.
 * @param checkDb Если true (по умолчанию true), получает пользователя из базы данных для проверки статуса (заблокирован и т. д.)
 */
export async function getAuthUser(checkDb = true): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const payload = await verifyJwt(token);
    if (!payload || !payload.userId) return null;

    const userId = payload.userId as string;
    const authUser: AuthUser = {
      userId,
      telegramId: payload.telegramId as string,
      role: payload.role as string | undefined,
      isAdmin: (payload.role as string) === 'admin' || payload.telegramId === '6859842859',
    };

    const sessionVersion = payload.sessionVersion as number | undefined;

    // Check cache first for blocked status
    const cacheKey = `user_status_${userId}`;
    const cachedStatus = cache.get<{ isBlocked: boolean; sessionVersion?: number }>(cacheKey);

    if (cachedStatus) {
      if (cachedStatus.isBlocked) return null;
      if (sessionVersion !== undefined && cachedStatus.sessionVersion !== sessionVersion) return null;
      
      authUser.isBlocked = cachedStatus.isBlocked;
      return authUser;
    }

    if (checkDb || sessionVersion !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isBlocked: true, sessionVersion: true }
      });
      
      if (!user) return null;

      // Update cache
      cache.set(cacheKey, { isBlocked: user.isBlocked, sessionVersion: user.sessionVersion }, 300); // 5 min cache

      if (user.isBlocked) return null;
      
      // Если токен имеет sessionVersion, она должна совпадать с базой данных
      if (sessionVersion !== undefined && user.sessionVersion !== sessionVersion) {
        console.warn(`Session mismatch for user ${userId}: Token(${sessionVersion}) != DB(${user.sessionVersion})`);
        return null;
      }

      authUser.isBlocked = user.isBlocked;
    }

    return authUser;
  } catch (error) {
    return null;
  }
}

import { cookies } from 'next/headers';
import { verifyJwt } from './auth';
import prisma from './prisma';

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
 * @param checkDb Если true, получает пользователя из базы данных для проверки статуса (заблокирован и т. д.)
 */
export async function getAuthUser(checkDb = false): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const payload = await verifyJwt(token);
    if (!payload || !payload.userId) return null;

    const authUser: AuthUser = {
      userId: payload.userId as string,
      telegramId: payload.telegramId as string,
      role: payload.role as string | undefined,
      isAdmin: (payload.role as string) === 'admin',
    };

    const sessionVersion = payload.sessionVersion as number | undefined;

    if (checkDb || sessionVersion !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: authUser.userId },
        select: { isBlocked: true, sessionVersion: true }
      });
      
      if (!user || user.isBlocked) return null;
      
      // Если токен имеет sessionVersion, она должна совпадать с базой данных
      if (sessionVersion !== undefined && user.sessionVersion !== sessionVersion) {
        console.warn(`Session mismatch for user ${authUser.userId}: Token(${sessionVersion}) != DB(${user.sessionVersion})`);
        return null;
      }

      authUser.isBlocked = user.isBlocked;
    }

    return authUser;
  } catch {
    return null;
  }
}

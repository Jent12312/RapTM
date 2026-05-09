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
 * Extracts and verifies the authenticated user from the JWT cookie.
 * Returns the user payload or null if not authenticated.
 * @param checkDb If true, fetches the user from the database to check status (blocked, etc)
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
      
      // If token has a sessionVersion, it must match the database
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

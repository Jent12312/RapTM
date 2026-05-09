import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { generateTwoFactorSecret, verifyTwoFactorToken } from '@/lib/2fa';
import { logAction } from '@/lib/logger';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    const { id } = await context.params;

    if (!authUser || authUser.userId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ 
      where: { id },
      select: { twoFactorEnabled: true }
    });
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ 
      enabled: user.twoFactorEnabled,
      method: 'GOOGLE_AUTHENTICATOR'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// Setup or Disable 2FA
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    const { id } = await context.params;

    if (!authUser || authUser.userId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, token } = body; // action: 'setup', 'enable', 'disable'

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (action === 'setup') {
      // Generate new secret (but don't enable yet)
      const { secret, qrCodeUrl } = await generateTwoFactorSecret(user.username || user.telegramId);
      
      // Save secret temporarily (we'll save it for real once verified)
      // For simplicity in this demo, we just return it. 
      // In a real app, you might save it as "pending" or just keep it in session/state.
      return NextResponse.json({ 
        success: true, 
        secret,
        qrCode: qrCodeUrl
      });
    }

    if (action === 'enable') {
      const { secret } = body;
      const isValid = verifyTwoFactorToken(token, secret);
      
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id },
        data: { 
          twoFactorSecret: secret,
          twoFactorEnabled: true 
        }
      });

      await logAction({
        userId: id,
        action: '2FA_ENABLED',
        details: 'User enabled Google Authenticator'
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'disable') {
      // To disable, must provide current token
      if (!user.twoFactorSecret) {
        return NextResponse.json({ error: '2FA not setup' }, { status: 400 });
      }

      const isValid = verifyTwoFactorToken(token, user.twoFactorSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id },
        data: { 
          twoFactorSecret: null,
          twoFactorEnabled: false 
        }
      });

      await logAction({
        userId: id,
        action: '2FA_DISABLED',
        severity: 'WARNING',
        details: 'User disabled Google Authenticator'
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('2FA POST Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

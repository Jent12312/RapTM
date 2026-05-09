import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/getAuthUser';
import { z } from 'zod';
import crypto from 'crypto';

const emailSchema = z.object({
  email: z.string().email(),
});

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

// In-memory store for verification codes (for simplicity, in prod use Redis)
const verificationCodes: Record<string, { code: string, expires: number }> = {};

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    
    // SEND CODE
    if (body.action === 'send') {
      const parsed = emailSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

      const { email } = parsed.data;
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      verificationCodes[email] = {
        code,
        expires: Date.now() + 10 * 60 * 1000 // 10 mins
      };

      console.log(`Verification code for ${email}: ${code}`);
      // In prod: await sendEmail(email, 'Your verification code', code);

      return NextResponse.json({ success: true, message: 'Verification code sent to email' });
    }

    // VERIFY CODE
    if (body.action === 'verify') {
      const parsed = verifySchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });

      const { email, code } = parsed.data;
      const stored = verificationCodes[email];

      if (!stored || stored.code !== code || Date.now() > stored.expires) {
        return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
      }

      delete verificationCodes[email];

      await prisma.user.update({
        where: { id: authUser.userId },
        data: { 
          email,
          isEmailVerified: true 
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

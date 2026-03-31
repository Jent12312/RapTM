// src/app/api/user/[id]/kyc/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/user/[id]/kyc - Отправка заявки на KYC
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { kycPhotoUrl } = body;

    // Проверяем текущего пользователя
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Если уже верифицирован - отказываем
    if (user.kycStatus === 'verified' || user.isVerified) {
      return NextResponse.json({ error: 'Already verified' }, { status: 400 });
    }

    // Если уже есть pending заявка - отказываем
    if (user.kycStatus === 'pending') {
      return NextResponse.json({ error: 'KYC already pending' }, { status: 400 });
    }

    // Обновляем статус на pending
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        kycStatus: 'pending',
        kycPhotoUrl: kycPhotoUrl || null
      }
    });

    // Уведомление админу в ЛС
    try {
      const msg = `📋 Новая заявка на KYC!\n\nПользователь: ${user.firstName || user.username} (@${user.username || 'unknown'})\nTelegram ID: ${user.telegramId}\n\nТребуется проверка документов.`;
      
      await fetch(`${process.env.TELEGRAM_BOT_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID,
          text: msg
        })
      });
    } catch (e) {
      console.log('Admin KYC notification failed');
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('KYC submit error:', error);
    return NextResponse.json({ error: 'Failed to submit KYC' }, { status: 500 });
  }
}

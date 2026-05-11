// src/lib/logger.ts
import prisma from './prisma';

export type LogSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export async function logAction(params: {
  userId?: string;
  action: string;
  severity?: LogSeverity;
  details?: string;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await prisma.log.create({
      data: {
        userId: params.userId,
        action: params.action,
        severity: params.severity || 'INFO',
        details: params.details,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to write log:', error);
    // Не выбрасываем ошибку, чтобы сбой логгера не нарушил работу приложения
  }
}

// Быстрый вызов для алертов безопасности
export async function logSecurityAlert(userId: string, action: string, details: string) {
  return logAction({
    userId,
    action,
    severity: 'CRITICAL',
    details,
  });
}

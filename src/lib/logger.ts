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
    // Don't throw, we don't want logger failure to break the app
  }
}

// Shortcut for security alerts
export async function logSecurityAlert(userId: string, action: string, details: string) {
  return logAction({
    userId,
    action,
    severity: 'CRITICAL',
    details,
  });
}

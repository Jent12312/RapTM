import { z } from 'zod';

// Общая схема пагинации
export const paginationSchema = z.object({
  page: z.string().optional().transform(v => Math.max(1, parseInt(v || '1', 10))),
  limit: z.string().optional().transform(v => Math.min(100, Math.max(1, parseInt(v || '20', 10)))),
}).transform(v => ({
  ...v,
  offset: (v.page! - 1) * v.limit!,
}));

// Общая схема UUID
export const uuidSchema = z.string().uuid();

// Общая схема суммы
export const amountSchema = z.number().positive();

// Схема блокировки пользователя
export const blockUserSchema = z.object({
  action: z.enum(['block', 'unblock']),
  reason: z.string().optional(),
});

// Схема проверки 2FA
export const verify2faSchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

// Схема настройки 2FA
export const setup2faSchema = z.object({
  password: z.string().min(1, 'Password is required to setup 2FA'),
});

// Схема создания P2P ордера
export const createP2POrderSchema = z.object({
  adId: z.string().uuid(),
  amountAsset: z.number().positive(),
  amountFiat: z.number().positive(),
});

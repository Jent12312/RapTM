import { z } from 'zod';

// Common Pagination Schema
export const paginationSchema = z.object({
  page: z.string().optional().transform(v => Math.max(1, parseInt(v || '1', 10))),
  limit: z.string().optional().transform(v => Math.min(100, Math.max(1, parseInt(v || '20', 10)))),
});

// Common UUID Schema
export const uuidSchema = z.string().uuid();

// Common Amount Schema
export const amountSchema = z.number().positive();

// User Blocking Schema
export const blockUserSchema = z.object({
  action: z.enum(['block', 'unblock']),
  reason: z.string().optional(),
});

// 2FA Verification Schema
export const verify2faSchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

// 2FA Setup Schema
export const setup2faSchema = z.object({
  password: z.string().min(1, 'Password is required to setup 2FA'),
});

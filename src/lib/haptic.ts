// src/lib/haptic.ts
import WebApp from '@twa-dev/sdk';

/**
 * Утилита для работы с виброоткликом (Haptic Feedback) в Telegram Mini App.
 */
export const haptic = {
  /**
   * Уведомление о событии (успех, ошибка, предупреждение).
   */
  notification: (type: 'error' | 'success' | 'warning') => {
    try {
      WebApp.HapticFeedback.notificationOccurred(type);
    } catch (e) {
      console.warn('HapticFeedback.notification error:', e);
    }
  },

  /**
   * Короткий ударный отклик разной интенсивности.
   */
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    try {
      WebApp.HapticFeedback.impactOccurred(style);
    } catch (e) {
      console.warn('HapticFeedback.impact error:', e);
    }
  },

  /**
   * Отклик при изменении состояния (например, переключение тумблера).
   */
  selection: () => {
    try {
      WebApp.HapticFeedback.selectionChanged();
    } catch (e) {
      console.warn('HapticFeedback.selection error:', e);
    }
  },

  // Быстрые вызовы
  success: () => haptic.notification('success'),
  error: () => haptic.notification('error'),
  warning: () => haptic.notification('warning'),
  light: () => haptic.impact('light'),
  medium: () => haptic.impact('medium'),
  heavy: () => haptic.impact('heavy'),
};

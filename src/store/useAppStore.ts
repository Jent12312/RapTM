// src/store/useAppStore.ts
import { create } from 'zustand';
import { Language } from '../lib/dictionaries';

type Tab = 'wallet' | 'exchange' | 'p2p' | 'profile';
export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface AppState {
  language: Language;
  activeTab: Tab;
  isBalanceVisible: boolean;
  
  user: any | null;
  balances: { tmt: number; usdt: number };
  
  ads: any[];
  isLoadingAds: boolean;
  
  toasts: ToastMessage[]; // <-- НОВОЕ
  
  setLanguage: (lang: Language) => void;
  setActiveTab: (tab: Tab) => void;
  toggleBalance: () => void;
  
  initUser: (tgData: any) => Promise<void>;
  fetchAds: () => Promise<void>;
  
  addToast: (message: string, type: ToastType) => void; // <-- НОВОЕ
  removeToast: (id: string) => void; // <-- НОВОЕ
}

export const useAppStore = create<AppState>((set) => ({
  language: 'ru',
  activeTab: 'wallet',
  isBalanceVisible: true,
  user: null,
  balances: { tmt: 0, usdt: 0 },
  
  ads: [],
  isLoadingAds: false,
  toasts: [],

  setLanguage: (lang) => set({ language: lang }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleBalance: () => set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),

  initUser: async (tgData) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tgData.id,
          username: tgData.username,
          firstName: tgData.first_name,
          photo_url: tgData.photo_url,
        }),
      });
      const data = await res.json();
      if (data.success) {
        set({
          user: data.user,
          balances: {
            tmt: data.user.wallet.tmtBalance,
            usdt: data.user.wallet.usdtBalance
          }
        });
      }
    } catch (err) {
      console.error("Ошибка авторизации:", err);
    }
  },

  fetchAds: async () => {
    set({ isLoadingAds: true });
    try {
      const res = await fetch('/api/p2p');
      if (res.ok) {
        const data = await res.json();
        set({ ads: data, isLoadingAds: false });
      }
    } catch (error) {
      console.error("Ошибка загрузки объявлений:", error);
      set({ isLoadingAds: false });
    }
  },

  addToast: (message, type) => {
    const id = Date.now().toString();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // Автоудаление через 3 секунды
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
    
    // Вибрация Telegram
    import('@twa-dev/sdk').then((WebApp) => {
      const t = WebApp.default;
      if (type === 'success') t.HapticFeedback.notificationOccurred('success');
      if (type === 'error') t.HapticFeedback.notificationOccurred('error');
      if (type === 'info') t.HapticFeedback.impactOccurred('medium');
    });
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}));
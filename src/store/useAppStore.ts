// src/store/useAppStore.ts
import { create } from 'zustand';
import { Language } from '../lib/dictionaries';
import { haptic } from '../lib/haptic';

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
  balances: { tmt: number; usdt: number; bonus: number };
  
  ads: any[];
  isLoadingAds: boolean;
  
  toasts: ToastMessage[];
  
  setLanguage: (lang: Language) => void;
  setActiveTab: (tab: Tab) => void;
  toggleBalance: () => void;
  
  initUser: (initData: string) => Promise<void>;
  logout: () => void;
  fetchAds: () => Promise<void>;
  
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  language: 'ru',
  activeTab: 'wallet',
  isBalanceVisible: true,
  user: null,
  balances: { tmt: 0, usdt: 0, bonus: 0 },
  
  ads: [],
  isLoadingAds: false,
  toasts: [],

  setLanguage: (lang) => set({ language: lang }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleBalance: () => {
    haptic.light();
    set((state) => ({ isBalanceVisible: !state.isBalanceVisible }));
  },

  initUser: async (initData: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();
      if (data.success) {
        set({
          user: data.user,
          balances: {
            tmt: data.user.wallet.tmtBalance,
            usdt: data.user.wallet.usdtBalance,
            bonus: data.user.wallet.bonusBalance
          }
        });
      } else {
        console.error("Ошибка авторизации: ", data.error);
        get().addToast("Ошибка авторизации. Пожалуйста, перезапустите приложение.", "error");
      }
    } catch (err) {
      console.error("Ошибка авторизации:", err);
      get().addToast("Ошибка сети при авторизации.", "error");
    }
  },

  logout: () => {
    set({
      user: null,
      balances: { tmt: 0, usdt: 0, bonus: 0 },
      ads: []
    });
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
    
    // Вибрация
    if (type === 'success') haptic.success();
    else if (type === 'error') haptic.error();
    else haptic.medium();

    // Автоудаление через 3 секунды
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}));
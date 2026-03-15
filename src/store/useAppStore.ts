// src/store/useAppStore.ts
import { create } from 'zustand';
import { Language } from '../lib/dictionaries';

type Tab = 'wallet' | 'exchange' | 'p2p' | 'profile';

interface AppState {
  language: Language;
  activeTab: Tab;
  isBalanceVisible: boolean;
  
  user: any | null;
  balances: { tmt: number; usdt: number };
  
  // Добавляем хранилище для объявлений
  ads: any[];
  isLoadingAds: boolean;
  
  setLanguage: (lang: Language) => void;
  setActiveTab: (tab: Tab) => void;
  toggleBalance: () => void;
  
  initUser: (tgData: any) => Promise<void>;
  
  // Функция загрузки объявлений из базы
  fetchAds: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'ru',
  activeTab: 'wallet',
  isBalanceVisible: true,
  user: null,
  balances: { tmt: 0, usdt: 0 },
  
  ads: [],
  isLoadingAds: false,

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
      const res = await fetch('/api/p2p'); // Дергаем наш GET роут
      if (res.ok) {
        const data = await res.json();
        set({ ads: data, isLoadingAds: false });
      }
    } catch (error) {
      console.error("Ошибка загрузки объявлений:", error);
      set({ isLoadingAds: false });
    }
  }
}));
// src/store/useAppStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  referralInfo: { isNew: boolean; referrerName: string | null } | null;
  
  setLanguage: (lang: Language) => void;
  setActiveTab: (tab: Tab) => void;
  toggleBalance: () => void;
  
  initUser: (initData: string) => Promise<void>;
  logout: () => void;
  fetchAds: () => Promise<void>;
  
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'ru',
      activeTab: 'wallet',
      isBalanceVisible: true,
      user: null,
      balances: { tmt: 0, usdt: 0, bonus: 0 },
      
      ads: [],
      isLoadingAds: false,
      toasts: [],
      referralInfo: null,

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
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error("Auth server error:", errorText);
            get().addToast("Ошибка сервера при авторизации.", "error");
            return;
          }

          const data = await res.json();
          if (data.success && data.user) {
            set({
              user: data.user,
              balances: {
                tmt: Number(data.user?.wallet?.tmtBalance) || 0,
                usdt: Number(data.user?.wallet?.usdtBalance) || 0,
                bonus: Number(data.user?.wallet?.bonusBalance) || 0
              },
              referralInfo: data.isNewReferral ? { isNew: true, referrerName: data.referrerName } : null
            });
          } else {
            console.error("Ошибка авторизации: ", data.error);
            get().addToast("Ошибка авторизации. Перезапустите приложение.", "error");
          }
        } catch (err) {
          console.error("Ошибка авторизации (Network/JSON):", err);
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
            // Безопасное извлечение массива
            const adsArray = Array.isArray(data) ? data : (data?.ads || data?.data || []);
            set({ ads: Array.isArray(adsArray) ? adsArray : [], isLoadingAds: false });
          } else {
            console.error("Ads fetch error: status", res.status);
            set({ ads: [], isLoadingAds: false });
          }
        } catch (error) {
          console.error("Ошибка загрузки объявлений:", error);
          set({ ads: [], isLoadingAds: false });
        }
      },

      addToast: (message, type) => {
        const id = Date.now().toString();
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        
        if (type === 'success') haptic.success();
        else if (type === 'error') haptic.error();
        else haptic.medium();

        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 3000);
      },

      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }),
    {
      name: 'rapira-app-storage',
      // Сохраняем в кэш телефона только настройки интерфейса, 
      // чтобы юзер и балансы всегда загружались свежими с сервера
      partialize: (state) => ({
        language: state.language,
        isBalanceVisible: state.isBalanceVisible,
      }),
    }
  )
);

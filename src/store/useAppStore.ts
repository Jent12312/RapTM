import { create } from 'zustand';
import { Language } from '../lib/dictionaries';

type Tab = 'wallet' | 'exchange' | 'p2p' | 'profile';

interface AppState {
  language: Language;
  activeTab: Tab;
  isBalanceVisible: boolean;
  balances: { tmt: number; usdt: number };
  
  setLanguage: (lang: Language) => void;
  setActiveTab: (tab: Tab) => void;
  toggleBalance: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'ru',
  activeTab: 'wallet',
  isBalanceVisible: true,
  balances: { tmt: 1240.50, usdt: 60.51 }, // Пока захардкодим 

  setLanguage: (lang) => set({ language: lang }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleBalance: () => set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),
}));
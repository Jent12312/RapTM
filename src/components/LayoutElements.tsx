'use client';

import { useAppStore } from '@/store/useAppStore';
import { t, Language } from '@/lib/dictionaries';
import { Wallet, ArrowRightLeft, Users } from 'lucide-react';

export function Header() {
  const { language, setLanguage, setActiveTab } = useAppStore();

  const LangBtn = ({ lang, label }: { lang: Language, label: string }) => (
    <button 
      onClick={() => setLanguage(lang)}
      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${language === lang ? 'bg-white shadow-sm' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 flex justify-between items-center bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <LangBtn lang="ru" label="RU" />
        <LangBtn lang="tm" label="TM" />
        <LangBtn lang="en" label="EN" />
      </div>
      <button 
        onClick={() => setActiveTab('profile')} 
        className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-2xl active:scale-95 transition-all border border-gray-100"
      >
        <span className="text-xs font-bold text-gray-500">{t(language, 'userLabel')}</span>
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
          A
        </div>
      </button>
    </div>
  );
}

export function BottomNav() {
  const { language, activeTab, setActiveTab } = useAppStore();

  const NavBtn = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-600 scale-105' : 'text-gray-400'}`}
      >
        <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[9px] font-black uppercase tracking-tighter italic">{label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-8 py-5 flex justify-between items-center z-50 rounded-t-[2.5rem]">
      <NavBtn id="wallet" icon={Wallet} label={t(language, 'navGapjyk')} />
      <NavBtn id="exchange" icon={ArrowRightLeft} label={t(language, 'navAlys')} />
      <NavBtn id="p2p" icon={Users} label={t(language, 'navP2P')} />
    </nav>
  );
}
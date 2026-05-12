'use client';

import { useAppStore } from '@/store/useAppStore';
import { t, Language } from '@/lib/dictionaries';
import { Wallet, ArrowRightLeft, Users } from 'lucide-react';

export function Header() {
  const { language, setLanguage, setActiveTab, user } = useAppStore();

  const LangBtn = ({ lang, label }: { lang: Language, label: string }) => (
    <button
      onClick={() => setLanguage(lang)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
        language === lang
          ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );

  const displayName = user?.nickname || user?.firstName || user?.username || 'Пользователь';
  const avatarSrc = user?.avatarUrl || null;

  return (
    <div className="px-5 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50 h-16">
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <LangBtn lang="ru" label="RU" />
        <LangBtn lang="tm" label="TM" />
        <LangBtn lang="en" label="EN" />
      </div>
      <button
        onClick={() => setActiveTab('profile')}
        className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-full active:scale-95 transition-all shadow-sm ring-1 ring-slate-100"
      >
        <span className="text-xs font-medium text-slate-600 max-w-[100px] truncate">{displayName}</span>
        {avatarSrc ? (
          <img src={avatarSrc} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
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
        className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 ${
          isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-500'
        }`}
      >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-emerald-50' : 'bg-transparent'}`}>
          <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-semibold' : ''}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
      <nav className="mx-auto max-w-md bg-white/90 backdrop-blur-xl border border-slate-100/50 shadow-2xl shadow-slate-200/50 px-6 py-2 flex justify-between items-center rounded-3xl pointer-events-auto">
        <NavBtn id="wallet" icon={Wallet} label={t(language, 'navGapjyk')} />
        <NavBtn id="exchange" icon={ArrowRightLeft} label={t(language, 'navAlys')} />
        <NavBtn id="p2p" icon={Users} label={t(language, 'navP2P')} />
      </nav>
    </div>
  );
}
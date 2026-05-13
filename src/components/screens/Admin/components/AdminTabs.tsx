'use client';

import { t, Language } from '@/lib/dictionaries';
import { AlertTriangle, ShieldCheck, Users, RefreshCw, UserX, TrendingUp } from 'lucide-react';

interface AdminTabsProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  language: Language;
  counts: {
    disputes: number;
    kyc: number;
    exchanges: number;
    crypto: number;
    levels: number;
  };
}

export default function AdminTabs({ activeTab, setActiveTab, language, counts }: AdminTabsProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: null }, // Dashboard logic might be separate or just one of the tabs
    { id: 'disputes', label: t(language, 'adminDisputes'), icon: AlertTriangle, count: counts.disputes, activeClass: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
    { id: 'kyc', label: t(language, 'adminKYC'), icon: ShieldCheck, count: counts.kyc, activeClass: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' },
    { id: 'exchanges', label: t(language, 'adminExchanges'), icon: null, count: counts.exchanges, activeClass: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' },
    { id: 'crypto', label: t(language, 'adminCrypto'), icon: null, count: counts.crypto, activeClass: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' },
    { id: 'users', label: t(language, 'adminUsers'), icon: null, activeClass: 'bg-purple-50 text-purple-600 ring-1 ring-purple-200' },
    { id: 'partners', label: t(language, 'adminPartners'), icon: Users, activeClass: 'bg-purple-900 text-white shadow-lg' },
    { id: 'stats', label: t(language, 'adminStats'), icon: null, activeClass: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' },
    { id: 'settings', label: t(language, 'exSettings'), icon: RefreshCw, activeClass: 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200' },
    { id: 'blacklist', label: 'ЧС', icon: UserX, activeClass: 'bg-red-900 text-white shadow-lg' },
    { id: 'cash', label: 'Кассы', icon: RefreshCw, activeClass: 'bg-amber-900 text-white shadow-lg' },
    { id: 'levels', label: 'Уровни', icon: TrendingUp, count: counts.levels, activeClass: 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' },
    { id: 'logs', label: 'Логи', icon: null },
    { id: 'audit', label: 'Аудит', icon: null },
    { id: 'stability', label: 'Стабильность', icon: null },
  ];

  return (
    <div className="bg-white px-4 py-3 sticky top-[60px] z-20 border-b border-slate-100">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                isActive 
                  ? (tab.activeClass || 'bg-slate-900 text-white shadow-lg') 
                  : 'bg-slate-50 text-slate-500'
              }`}
            >
              {Icon && <Icon className="w-4 h-4 inline mr-1" />}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-current' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

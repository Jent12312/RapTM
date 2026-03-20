'use client';

import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { Eye, EyeOff, Plus, ArrowDownToLine, RefreshCcw } from 'lucide-react';

export default function WalletScreen() {
  const { language, isBalanceVisible, toggleBalance, balances, setActiveTab } = useAppStore();

  return (
    <div className="px-5 py-2 space-y-8 animate-in fade-in duration-500">
      {/* Главная карточка (Стиль кредитной карты) */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-[2rem] p-7 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden">
        {/* Декоративные круги для красоты */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">{t(language, 'balanceLabel')}</p>
            <button 
              onClick={toggleBalance} 
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all active:scale-95"
            >
              {isBalanceVisible ? <Eye className="w-4 h-4 text-emerald-50" /> : <EyeOff className="w-4 h-4 text-emerald-50" />}
            </button>
          </div>
          
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="text-4xl font-bold tracking-tight">
              {isBalanceVisible ? balances.tmt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '****'}
            </h2>
            <span className="text-lg font-medium text-emerald-100">TMT</span>
          </div>
          <p className="text-sm text-emerald-200 mt-1 font-medium">
            ≈ {isBalanceVisible ? balances.usdt.toFixed(2) : '****'} USDT
          </p>
        </div>
        
        {/* Кнопки действий */}
        <div className="grid grid-cols-3 gap-4 mt-8 relative z-10">
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 bg-white/15 group-hover:bg-white/25 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all active:scale-95">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium tracking-wide text-emerald-50">{t(language, 'salmak')}</span>
          </button>
          
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 bg-white/15 group-hover:bg-white/25 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all active:scale-95">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium tracking-wide text-emerald-50">{t(language, 'cykarmak')}</span>
          </button>
          
          <button onClick={() => setActiveTab('exchange')} className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 bg-white text-emerald-600 shadow-lg shadow-black/10 rounded-2xl flex items-center justify-center transition-all active:scale-95 group-hover:scale-105">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium tracking-wide text-emerald-50">{t(language, 'alyCaly')}</span>
          </button>
        </div>
      </div>

      {/* Список валют */}
      <div className="pb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">{t(language, 'walyutalar')}</h3>
        <div className="space-y-3">
          {/* USDT Карточка */}
          <div className="bg-white p-4 rounded-3xl flex justify-between items-center shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                ₮
              </div>
              <div>
                <div className="font-bold text-slate-800 text-base">Tether USDT</div>
                <div className="text-xs font-medium text-slate-400">{t(language, 'digitalDollar')}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800 text-lg">{balances.usdt.toFixed(2)}</div>
            </div>
          </div>
          
          {/* TMT Карточка */}
          <div className="bg-white p-4 rounded-3xl flex justify-between items-center shadow-sm ring-1 ring-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                M
              </div>
              <div>
                <div className="font-bold text-slate-800 text-base">TMT (Manat)</div>
                <div className="text-xs font-medium text-slate-400">{t(language, 'localCurrency')}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800 text-lg">{balances.tmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
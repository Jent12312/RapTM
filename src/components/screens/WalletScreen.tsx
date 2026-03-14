'use client';

import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { Eye, EyeOff } from 'lucide-react';

export default function WalletScreen() {
  const { language, isBalanceVisible, toggleBalance, balances, setActiveTab } = useAppStore();

  return (
    <div className="p-4 space-y-8 animate-in fade-in duration-300">
      {/* Главная зеленая карточка */}
      <div className="bg-emerald-600 rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] opacity-80 uppercase font-black tracking-[0.2em]">{t(language, 'balanceLabel')}</p>
          <div className="flex items-center gap-3 mt-2">
            <h2 className="text-4xl font-black italic">
              {isBalanceVisible ? balances.tmt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '****'}
            </h2>
            <span className="text-xl font-light opacity-80">TMT</span>
            <button onClick={toggleBalance} className="p-2 bg-white/10 rounded-full backdrop-blur-md active:scale-95 transition-all">
              {isBalanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-sm opacity-70 mt-2 font-medium">
            ≈ {isBalanceVisible ? balances.usdt.toFixed(2) : '****'} USDT
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mt-10 relative z-10">
          <button className="bg-white/20 p-4 rounded-3xl text-center backdrop-blur-md active:scale-95 transition-all">
            <span className="block text-[10px] font-black uppercase tracking-tighter">{t(language, 'salmak')}</span>
          </button>
          <button className="bg-white/20 p-4 rounded-3xl text-center backdrop-blur-md active:scale-95 transition-all">
            <span className="block text-[10px] font-black uppercase tracking-tighter">{t(language, 'cykarmak')}</span>
          </button>
          <button onClick={() => setActiveTab('exchange')} className="bg-white text-emerald-700 p-4 rounded-3xl text-center shadow-xl font-black active:scale-95 transition-all">
            <span className="block text-[10px] uppercase tracking-tighter">{t(language, 'alyCaly')}</span>
          </button>
        </div>
      </div>

      {/* Список валют */}
      <div>
        <h3 className="text-xl font-black mb-4 ml-2">{t(language, 'walyutalar')}</h3>
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-[2rem] flex justify-between items-center shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl italic">₮</div>
              <div>
                <div className="font-black text-gray-800">Tether USDT</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Digital Dollar</div>
              </div>
            </div>
            <div className="text-right font-black text-xl">{balances.usdt.toFixed(2)}</div>
          </div>
          
          <div className="bg-white p-5 rounded-[2rem] flex justify-between items-center shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">M</div>
              <div>
                <div className="font-black text-gray-800">TMT (Manat)</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Local Currency</div>
              </div>
            </div>
            <div className="text-right font-black text-xl">{balances.tmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
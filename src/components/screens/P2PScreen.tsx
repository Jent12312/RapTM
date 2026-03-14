'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { BadgeCheck, Clock, MapPin, Filter } from 'lucide-react';

// Фейковые данные (моки) для объявлений
const mockAds = [
  {
    id: '1', type: 'buy', merchant: 'Azat_Crypto', verified: true, trades: 1450, completion: 99.8,
    price: 19.80, limitMin: 1000, limitMax: 50000, time: 15, city: 'Ашхабад'
  },
  {
    id: '2', type: 'buy', merchant: 'Murad_TMT', verified: false, trades: 342, completion: 95.5,
    price: 19.85, limitMin: 500, limitMax: 15000, time: 30, city: 'Мары'
  },
  {
    id: '3', type: 'sell', merchant: 'Vepa_Exchange', verified: true, trades: 8900, completion: 100,
    price: 19.50, limitMin: 5000, limitMax: 200000, time: 15, city: 'Ашхабад'
  }
];

export default function P2PScreen() {
  const { language } = useAppStore();
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy'); // 'buy' - я хочу купить USDT, 'sell' - я хочу продать USDT

  // Фильтруем объявления по типу
  const filteredAds = mockAds.filter(ad => ad.type === tradeType);

  return (
    <div className="pb-32 animate-in fade-in duration-300">
      
      {/* Верхние табы: Купить / Продать */}
      <div className="bg-white px-4 pt-2 pb-4 shadow-sm sticky top-[72px] z-40 border-b border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setTradeType('buy')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${tradeType === 'buy' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
          >
            {t(language, 'buy')} USDT
          </button>
          <button 
            onClick={() => setTradeType('sell')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${tradeType === 'sell' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500'}`}
          >
            {t(language, 'sell')} USDT
          </button>
        </div>

        {/* Фильтры (Сумма, Способ) */}
        <div className="flex gap-2 mt-4">
          <button className="flex items-center gap-1 bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            {t(language, 'amount')} <Filter className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-semibold ring-1 ring-emerald-200">
            <MapPin className="w-3 h-3" /> {t(language, 'cash')}
          </button>
        </div>
      </div>

      {/* Список объявлений */}
      <div className="px-4 py-4 space-y-4">
        {filteredAds.map((ad) => (
          <div key={ad.id} className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
            {/* Шапка карточки: Продавец и стата */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 text-sm">{ad.merchant}</span>
                  {ad.verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {ad.trades} {t(language, 'trades')} • {ad.completion}%
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                <Clock className="w-3 h-3" /> {ad.time} min
              </div>
            </div>

            {/* Цена и Лимиты */}
            <div className="flex justify-between items-end mt-4">
              <div>
                <div className="text-2xl font-bold text-slate-800 tracking-tight">
                  {ad.price.toFixed(2)} <span className="text-sm font-medium text-slate-400">TMT</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  {t(language, 'limit')}: {ad.limitMin.toLocaleString()} - {ad.limitMax.toLocaleString()} TMT
                </div>
                {/* Метод оплаты */}
                <div className="flex items-center gap-1 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-bold text-slate-600">{t(language, 'cash')} ({ad.city})</span>
                </div>
              </div>

              {/* Кнопка действия */}
              <button 
                className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 ${
                  tradeType === 'buy' 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200' 
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                }`}
              >
                {tradeType === 'buy' ? t(language, 'buyBtn') : t(language, 'sellBtn')}
              </button>
            </div>
          </div>
        ))}
        
        {filteredAds.length === 0 && (
          <div className="text-center py-10 text-slate-400 font-medium text-sm">
            Нет доступных объявлений
          </div>
        )}
      </div>

    </div>
  );
}
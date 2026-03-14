'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { BadgeCheck, Clock, MapPin, Filter, X, ArrowDownUp } from 'lucide-react';

// Обновленные моки с добавлением USD и поля fiat
const mockAds = [
  { id: '1', type: 'buy', fiat: 'TMT', merchant: 'Azat_Crypto', verified: true, trades: 1450, completion: 99.8, price: 19.80, limitMin: 1000, limitMax: 50000, time: 15, city: 'Ашхабад' },
  { id: '2', type: 'buy', fiat: 'TMT', merchant: 'Murad_TMT', verified: false, trades: 342, completion: 95.5, price: 19.85, limitMin: 500, limitMax: 15000, time: 30, city: 'Мары' },
  { id: '3', type: 'sell', fiat: 'TMT', merchant: 'Vepa_Exchange', verified: true, trades: 8900, completion: 100, price: 19.50, limitMin: 5000, limitMax: 200000, time: 15, city: 'Ашхабад' },
  { id: '4', type: 'buy', fiat: 'USD', merchant: 'VIP_Dollars', verified: true, trades: 5120, completion: 99.9, price: 1.01, limitMin: 100, limitMax: 10000, time: 15, city: 'Ашхабад' },
  { id: '5', type: 'sell', fiat: 'USD', merchant: 'Global_Trade', verified: true, trades: 120, completion: 91.0, price: 0.99, limitMin: 500, limitMax: 5000, time: 45, city: 'Туркменабад' },
];

export default function P2PScreen() {
  const { language } = useAppStore();
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy'); 
  const [fiatCurrency, setFiatCurrency] = useState<'TMT' | 'USD'>('TMT'); // Новый стейт для фиата
  
  // Стейты для модалки (Bottom Sheet)
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [tradeAmount, setTradeAmount] = useState('');

  // Фильтруем по типу (Покупка/Продажа) и по Фиату (TMT/USD)
  const filteredAds = mockAds.filter(ad => ad.type === tradeType && ad.fiat === fiatCurrency);

  // Обработчик закрытия модалки
  const closeModal = () => {
    setSelectedAd(null);
    setTradeAmount('');
  };

  return (
    <div className="pb-32 animate-in fade-in duration-300">
      
      {/* Верхний блок: Фильтры */}
      <div className="bg-white px-4 pt-2 pb-4 shadow-sm sticky top-[72px] z-30 border-b border-slate-100">
        
        {/* Табы: Купить / Продать */}
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

        {/* Фильтры: Валюта, Сумма, Способ */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {/* Селектор Фиата */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button 
              onClick={() => setFiatCurrency('TMT')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${fiatCurrency === 'TMT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
            >
              TMT
            </button>
            <button 
              onClick={() => setFiatCurrency('USD')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${fiatCurrency === 'USD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
            >
              USD
            </button>
          </div>

          <button className="flex items-center gap-1.5 bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 ring-1 ring-slate-200 shrink-0">
            {t(language, 'amount')} <Filter className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-semibold ring-1 ring-emerald-200 shrink-0">
            <MapPin className="w-3 h-3" /> {t(language, 'cash')}
          </button>
        </div>
      </div>

      {/* Список объявлений */}
      <div className="px-4 py-4 space-y-4 relative z-10">
        {filteredAds.map((ad) => (
          <div key={ad.id} className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
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

            <div className="flex justify-between items-end mt-4">
              <div>
                <div className="text-2xl font-bold text-slate-800 tracking-tight">
                  {ad.price.toFixed(2)} <span className="text-sm font-medium text-slate-400">{ad.fiat}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  {t(language, 'limit')}: {ad.limitMin.toLocaleString()} - {ad.limitMax.toLocaleString()} {ad.fiat}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{t(language, 'cash')} ({ad.city})</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedAd(ad)}
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
            Нет доступных объявлений для {fiatCurrency}
          </div>
        )}
      </div>

      {/* Всплывающая модалка создания сделки (Bottom Sheet) */}
      {selectedAd && (
        <>
          {/* Темный фон */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
            onClick={closeModal}
          ></div>
          
          {/* Сама карточка снизу */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-6 z-50 animate-in slide-in-from-bottom duration-300 shadow-2xl mx-auto max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {selectedAd.type === 'buy' ? 'Покупка USDT' : 'Продажа USDT'}
              </h3>
              <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500 active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl mb-6 ring-1 ring-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Цена сделки</p>
                <p className="text-lg font-bold text-slate-800">{selectedAd.price.toFixed(2)} {selectedAd.fiat}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Продавец</p>
                <p className="text-sm font-bold text-slate-700">{selectedAd.merchant}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 relative">
              <div className="bg-white ring-1 ring-slate-200 rounded-2xl p-4 flex justify-between items-center focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Я плачу</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full text-2xl font-bold text-slate-800 outline-none bg-transparent mt-1"
                  />
                </div>
                <div className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">{selectedAd.fiat}</div>
              </div>

              {/* Иконка перевода посередине */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full border border-slate-100 z-10">
                <div className="bg-slate-50 p-2 rounded-full text-slate-400">
                  <ArrowDownUp className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-slate-50 ring-1 ring-slate-100 rounded-2xl p-4 flex justify-between items-center opacity-80">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Я получаю</label>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {tradeAmount ? (Number(tradeAmount) / selectedAd.price).toFixed(2) : '0.00'}
                  </div>
                </div>
                <div className="font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-lg">USDT</div>
              </div>
            </div>

            <button 
              className={`w-full py-5 rounded-[2rem] font-bold text-lg text-white shadow-xl active:scale-95 transition-all ${
                selectedAd.type === 'buy' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-red-500 shadow-red-200'
              }`}
            >
              Подтвердить сделку
            </button>
          </div>
        </>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { BadgeCheck, Clock, MapPin, Filter, X, ArrowDownUp, RefreshCw } from 'lucide-react';
import OrderScreen from './OrderScreen';

export default function P2PScreen() {
  const { language, ads, isLoadingAds, fetchAds, user } = useAppStore();
  
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [asset, setAsset] = useState<'USDT' | 'TMT'>('USDT');
  const [fiat, setFiat] = useState<'TMT' | 'USD'>('TMT');
  
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Загружаем объявления при открытии экрана
  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Защита: нельзя купить TMT за TMT
  useEffect(() => {
    if (asset === 'TMT' && fiat === 'TMT') setFiat('USD');
  }, [asset, fiat]);

  // Фильтруем РЕАЛЬНЫЕ объявления из базы
  const filteredAds = ads.filter(ad => ad.type === tradeType && ad.asset === asset && ad.fiat === fiat);

  const closeModal = () => {
    setSelectedAd(null);
    setTradeAmount('');
  };

  const calculateReceiveAmount = () => {
    if (!tradeAmount || !selectedAd) return '0.00';
    const amount = Number(tradeAmount);
    if (selectedAd.type === 'buy') {
      return (amount / selectedAd.price).toFixed(2);
    } else {
      return (amount * selectedAd.price).toFixed(2);
    }
  };

    const handleStartOrder = async () => {
    if (!tradeAmount) return alert("Введите сумму");
    
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adId: selectedAd.id,
        buyerId: user.id,
        amountAsset: calculateReceiveAmount(),
        amountFiat: tradeAmount
      })
    });
    
    const data = await res.json();
    if (data.success) {
      setActiveOrder(data.order);
      setSelectedAd(null); // Закрываем модалку выбора суммы
    }
  };

    if (activeOrder) {
    return <OrderScreen order={activeOrder} onClose={() => setActiveOrder(null)} />;
  }


  return (
    <div className="pb-32 animate-in fade-in duration-300">
      
      {/* --- Верхняя панель (Фильтры) --- */}
      <div className="bg-white px-4 pt-2 pb-4 shadow-sm sticky top-[72px] z-30 border-b border-slate-100 space-y-4">
        
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setTradeType('buy')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${tradeType === 'buy' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}>Купить</button>
          <button onClick={() => setTradeType('sell')} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${tradeType === 'sell' ? 'bg-white text-red-500 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}>Продать</button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setAsset('USDT')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${asset === 'USDT' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-50 text-slate-500'}`}>
            <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">₮</div> USDT
          </button>
          <button onClick={() => setAsset('TMT')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${asset === 'TMT' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'bg-slate-50 text-slate-500'}`}>
            <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px]">M</div> TMT
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide items-center justify-between">
          <div className="flex gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button disabled={asset === 'TMT'} onClick={() => setFiat('TMT')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${fiat === 'TMT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'} ${asset === 'TMT' ? 'opacity-30' : ''}`}>TMT</button>
              <button onClick={() => setFiat('USD')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${fiat === 'USD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>USD</button>
            </div>
            <button className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 ring-1 ring-slate-200 shrink-0">Сумма <Filter className="w-3 h-3" /></button>
          </div>
          
          {/* Кнопка обновления списка */}
          <button onClick={fetchAds} className="p-2 bg-slate-100 text-slate-500 rounded-xl active:rotate-180 transition-all duration-300">
            <RefreshCw className={`w-4 h-4 ${isLoadingAds ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* --- Список реальных объявлений --- */}
      <div className="px-4 py-4 space-y-4 relative z-10">
        {isLoadingAds ? (
          // Скелетон загрузки
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 animate-pulse h-36"></div>
          ))
        ) : filteredAds.length > 0 ? (
          filteredAds.map((ad) => (
            <div key={ad.id} className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    {/* Берем имя создателя из связи user (которую мы добавили в API) */}
                    <span className="font-bold text-slate-800 text-sm">{ad.user?.firstName || 'Мерчант'}</span>
                    {ad.user?.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Новый продавец</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                  <Clock className="w-3 h-3" /> 15 min
                </div>
              </div>

              <div className="flex justify-between items-end mt-4">
                <div>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight">
                    {ad.price.toFixed(2)} <span className="text-sm font-medium text-slate-400">{ad.fiat}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">
                    Лимит: {ad.minLimit.toLocaleString()} - {ad.maxLimit.toLocaleString()} {ad.fiat}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Наличные ({ad.city})</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedAd(ad)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 ${
                    tradeType === 'buy' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  {tradeType === 'buy' ? 'Купить' : 'Продать'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-400 font-medium text-sm bg-white rounded-[2rem] ring-1 ring-slate-100">
            <div className="text-4xl mb-2">🔍</div>
            Нет активных объявлений для<br/>
            <span className="text-slate-800 font-bold">{asset} за {fiat}</span>
          </div>
        )}
      </div>

      {/* --- Модалка сделки --- */}
      {selectedAd && (
        <>
          {/* z-[60] перекроет нижнюю навигацию */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity" onClick={closeModal}></div>
          
          {/* z-[70], добавили max-h-[90vh], overflow-y-auto и pb-12 для скролла на небольших экранах */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-6 z-[70] animate-in slide-in-from-bottom duration-300 shadow-2xl mx-auto max-w-md max-h-[90vh] overflow-y-auto pb-12">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {selectedAd.type === 'buy' ? `Покупка ${selectedAd.asset}` : `Продажа ${selectedAd.asset}`}
              </h3>
              <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500 active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl mb-6 ring-1 ring-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Курс</p>
                <p className="text-lg font-bold text-slate-800">{selectedAd.price.toFixed(2)} {selectedAd.fiat} / 1 {selectedAd.asset}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Продавец</p>
                <p className="text-sm font-bold text-slate-700">{selectedAd.user?.firstName || 'Мерчант'}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 relative">
              <div className="bg-white ring-1 ring-slate-200 rounded-2xl p-4 flex justify-between items-center focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {selectedAd.type === 'buy' ? 'Я плачу' : 'Я отдаю'}
                  </label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full text-2xl font-bold text-slate-800 outline-none bg-transparent mt-1"
                  />
                </div>
                <div className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                  {selectedAd.type === 'buy' ? selectedAd.fiat : selectedAd.asset}
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full border border-slate-100 z-10">
                <div className="bg-slate-50 p-2 rounded-full text-slate-400"><ArrowDownUp className="w-4 h-4" /></div>
              </div>

              <div className="bg-slate-50 ring-1 ring-slate-100 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Я получаю</label>
                  <div className={`text-2xl font-bold mt-1 ${selectedAd.type === 'buy' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {calculateReceiveAmount()}
                  </div>
                </div>
                <div className={`font-bold px-3 py-1 rounded-lg ${selectedAd.type === 'buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {selectedAd.type === 'buy' ? selectedAd.asset : selectedAd.fiat}
                </div>
              </div>
            </div>

            <button 
              onClick={handleStartOrder} // <-- ЗАМЕНИТЬ ЭТО
              className={`w-full py-5 rounded-[2rem] font-bold text-lg text-white shadow-xl active:scale-95 transition-all ${
                selectedAd.type === 'buy' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-red-500 shadow-red-200'
              }`}
            >
              Начать сделку
            </button>
          </div>
        </>
      )}
    </div>
  );
}
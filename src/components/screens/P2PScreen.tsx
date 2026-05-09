'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import {
  BadgeCheck, Clock, MapPin, Filter, X,
  ArrowDownUp, RefreshCw, MessageSquare, User, TrendingUp
} from 'lucide-react';
import { haptic } from '@/lib/haptic';
import Skeleton from '@/components/ui/Skeleton';
import PullToRefresh from '@/components/ui/PullToRefresh';

// Импортируем дочерние экраны
import MerchantProfileModal from './MerchantProfileModal';
import MyOrdersScreen from './MyOrdersScreen';
import OrderScreen from './OrderScreen';

export default function P2PScreen() {
  const { language, ads, isLoadingAds, fetchAds, user } = useAppStore();

  // Состояния для рыночных цен
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});

  // Загрузка рыночных цен при загрузке компонента
  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        const pairs = ['USDT/TMT', 'USDT/USD', 'TMT/USDT', 'TMT/USD'];
        const prices: Record<string, number> = {};
        
        for (const pair of pairs) {
          const [asset, fiat] = pair.split('/');
          const res = await fetch(`/api/market-price?asset=${asset}&fiat=${fiat}`);
          const data = await res.json();
          if (data.basePrice) {
            prices[pair] = data.basePrice;
          }
        }
        
        setMarketPrices(prices);
      } catch (error) {
        console.error('Failed to fetch market prices:', error);
      }
    };

    fetchMarketPrices();
  }, []);

  // Функция для вычисления цены объявления
  const getAdPrice = (ad: any) => {
    const pair = `${ad.asset}/${ad.fiat}`;
    const basePrice = marketPrices[pair] || 0;
    
    if (ad.priceType === 'floating') {
      const percent = ad.price || 0;
      return basePrice * (1 + percent / 100);
    } else {
      return ad.price || 0;
    }
  };

  const tradeTypeLabel = (type: 'buy' | 'sell') => {
    return type === 'buy' ? t(language, 'buy') : t(language, 'sell');
  };
  
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [asset, setAsset] = useState<'USDT' | 'TMT'>('USDT');
  const [fiat, setFiat] = useState<'TMT' | 'USD'>('TMT');
  
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [viewingMerchant, setViewingMerchant] = useState<any>(null);
  const [isViewingChats, setIsViewingChats] = useState(false);
  const [filterAmount, setFilterAmount] = useState('');
  
  const [tradeAmount, setTradeAmount] = useState('');

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);


  const targetAdType = tradeType === 'buy' ? 'sell' : 'buy';
  const filteredAds = ads.filter(ad => {
    const matchBase = ad.type === targetAdType && ad.asset === asset && ad.fiat === fiat;
    if (!filterAmount) return matchBase;
    const amount = Number(filterAmount);
    return matchBase && amount >= ad.minLimit && amount <= ad.maxLimit;
  });

  const closeModal = () => {
    haptic.light();
    setSelectedAd(null);
    setTradeAmount('');
  };

  useEffect(() => {
    if (selectedAd && user) {
      const { addToast } = useAppStore.getState();
      const sellerId = selectedAd.type === 'sell' ? selectedAd.userId : user.id;
      
      if (selectedAd.asset === 'USDT' && selectedAd.type === 'sell') {
        fetch(`/api/wallet/balance?userId=${sellerId}`)
          .then(res => res.json())
          .then(data => {
            if (data.usdtBalance < selectedAd.minLimit) {
              addToast('У мерчанта недостаточно USDT для сделки', 'error');
              setSelectedAd(null);
            }
          });
      }
    }
  }, [selectedAd, user]);

  const calculateReceiveAmount = () => {
    if (!tradeAmount || !selectedAd) return '0.00';
    const amount = Number(tradeAmount);
    const price = getAdPrice(selectedAd);
    
    if (selectedAd.type === 'buy') {
      return (amount / price).toFixed(2);
    } else {
      return (amount * price).toFixed(2);
    }
  };

  const handleStartOrder = async () => {
    haptic.medium();
    const { addToast } = useAppStore.getState();
    const inputAmount = Number(tradeAmount);

    if (!inputAmount) {
      addToast("Введите сумму", "error");
      return;
    }

    if (inputAmount < selectedAd.minLimit || inputAmount > selectedAd.maxLimit) {
      addToast(`Лимит: от ${selectedAd.minLimit} до ${selectedAd.maxLimit}`, "error");
      return;
    }

    let amountAsset, amountFiat;
    if (tradeType === 'buy') {
      amountFiat = inputAmount;
      amountAsset = Number(calculateReceiveAmount());
    } else {
      amountAsset = inputAmount;
      amountFiat = Number(calculateReceiveAmount());
    }

    if (selectedAd.asset === 'USDT') {
      const sellerId = selectedAd.type === 'buy' ? user.id : selectedAd.userId;
      
      try {
        const res = await fetch(`/api/wallet/balance?userId=${sellerId}`);
        const data = await res.json();
        
        if (data.usdtBalance < amountAsset) {
          addToast('Недостаточно USDT на балансе', 'error');
          return;
        }
      } catch (e) {
        addToast('Ошибка проверки баланса', 'error');
        return;
      }
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adId: selectedAd.id,
        takerId: user.id,
        amountAsset,
        amountFiat
      })
    });

    const data = await res.json();
    if (data.success) {
      haptic.success();
      addToast("Сделка успешно создана!", "success");
      setActiveOrder(data.order);
      setSelectedAd(null);
    } else {
      haptic.error();
      addToast(data.error || "Ошибка при создании сделки", "error");
    }
  };

  const onPullRefresh = async () => {
    haptic.impact('heavy');
    await fetchAds();
  };

  if (activeOrder) {
    return <OrderScreen order={activeOrder} onClose={() => setActiveOrder(null)} />;
  }
  if (viewingMerchant) {
    return <MerchantProfileModal merchant={viewingMerchant} onClose={() => setViewingMerchant(null)} />;
  }
  if (isViewingChats) {
    return <MyOrdersScreen onClose={() => setIsViewingChats(false)} />;
  }

  return (
    <PullToRefresh onRefresh={onPullRefresh}>
      <div className="pb-32 animate-in fade-in duration-300">
        
        <div className="bg-white px-4 pt-2 pb-4 shadow-sm sticky top-[72px] z-30 border-b border-slate-100 space-y-4">
          
          <div className="flex justify-between items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-2xl flex-1">
              <button
                onClick={() => { haptic.selection(); setTradeType('buy'); }}
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${tradeType === 'buy' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}
              >
                {t(language, 'buy')}
              </button>
              <button
                onClick={() => { haptic.selection(); setTradeType('sell'); }}
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${tradeType === 'sell' ? 'bg-white text-red-500 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}
              >
                {t(language, 'sell')}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { haptic.light(); setIsViewingChats(true); }}
                className="p-3 bg-white text-slate-600 rounded-2xl ring-1 ring-slate-200 shadow-sm active:scale-95 transition-all"
              >
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={() => { haptic.light(); setIsViewingChats(true); }}
                className="p-3 bg-white text-blue-500 rounded-2xl ring-1 ring-slate-200 shadow-sm relative active:scale-95 transition-all"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => { haptic.selection(); setAsset('USDT'); }} 
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${asset === 'USDT' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-50 text-slate-500'}`}
            >
              <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">₮</div> USDT
            </button>
            <button 
              onClick={() => { haptic.selection(); setAsset('TMT'); }} 
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${asset === 'TMT' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'bg-slate-50 text-slate-500'}`}
            >
              <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px]">M</div> TMT
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide items-center justify-between">
            <div className="flex gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button onClick={() => { haptic.selection(); setFiat('TMT'); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${fiat === 'TMT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>TMT</button>
                <button onClick={() => { haptic.selection(); setFiat('USD'); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${fiat === 'USD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>USD</button>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl ring-1 ring-slate-200 transition-all focus-within:ring-emerald-500 focus-within:bg-white shrink-0">
                <input 
                  type="number" 
                  placeholder={t(language, 'amount')}
                  value={filterAmount}
                  onChange={(e) => setFilterAmount(e.target.value)}
                  className="bg-transparent outline-none text-xs font-bold w-16 text-slate-800 placeholder-slate-500"
                />
                <Filter className="w-3 h-3 text-slate-400" />
              </div>
            </div>
            <button onClick={() => { haptic.medium(); fetchAds(); }} className="p-2 bg-slate-100 text-slate-500 rounded-xl active:rotate-180 transition-all duration-300">
              <RefreshCw className={`w-4 h-4 ${isLoadingAds ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4 relative z-10">
          {isLoadingAds ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-[2rem]" />)
          ) : filteredAds.length > 0 ? (
            filteredAds.map((ad) => (
              <div key={ad.id} className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { haptic.light(); setViewingMerchant(ad.user); }}
                        className="font-bold text-slate-800 text-sm hover:underline"
                      >
                        {ad.user?.nickname || ad.user?.firstName || ad.user?.username || t(language, 'userLabel')}
                      </button>
                      {ad.user?.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400 font-bold">{ad.user?.tradesCount || 0} {t(language, 'trades')}</span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                        ★ {(ad.user?.rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg ring-1 ring-slate-100">
                    <Clock className="w-3 h-3" /> {ad.paymentTime || 15} {t(language, 'time')}
                  </div>
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-slate-800 tracking-tight">
                        {getAdPrice(ad).toFixed(2)} <span className="text-sm font-medium text-slate-400">{ad.fiat}</span>
                      </div>
                      {ad.priceType === 'floating' && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md ring-1 ring-blue-100 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Float {ad.price > 0 ? '+' : ''}{ad.price}%
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-1">
                      {t(language, 'limit')}: {ad.minLimit.toLocaleString()} - {ad.maxLimit.toLocaleString()} {ad.fiat}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 font-bold text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[10px] uppercase">{t(language, 'cash')} ({ad.city})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { haptic.medium(); setSelectedAd(ad); }}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 ${
                      tradeType === 'buy' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    }`}
                  >
                    {tradeType === 'buy' ? t(language, 'buyBtn') : t(language, 'sellBtn')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-slate-400 font-medium text-sm bg-white rounded-[2rem] ring-1 ring-slate-100 shadow-inner">
              <div className="text-4xl mb-3">🔍</div>
              {t(language, 'noAds')} <br/><span className="text-slate-800 font-bold">{asset} / {fiat}</span>
            </div>
          )}
        </div>

        {selectedAd && (
          <>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity" onClick={closeModal}></div>

            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-6 z-[70] animate-in slide-in-from-bottom duration-300 shadow-2xl mx-auto max-w-md max-h-[90vh] overflow-y-auto pb-12">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  {selectedAd.type === 'buy' ? `${t(language, 'buy')} ${selectedAd.asset}` : `${t(language, 'sell')} ${selectedAd.asset}`}
                </h3>
                <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500 active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl mb-4 ring-1 ring-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t(language, 'price')}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-slate-800">{getAdPrice(selectedAd).toFixed(2)} {selectedAd.fiat} / 1 {selectedAd.asset}</p>
                    {selectedAd.priceType === 'floating' && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md ring-1 ring-blue-100">
                        Float {selectedAd.price > 0 ? '+' : ''}{selectedAd.price}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t(language, 'userLabel')}</p>
                  <button onClick={() => { haptic.light(); setSelectedAd(null); setViewingMerchant(selectedAd.user); }} className="text-sm font-bold text-blue-600 flex items-center gap-1 justify-end">
                    {selectedAd.user?.firstName || t(language, 'userLabel')}
                    {selectedAd.user?.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl mb-6 ring-1 ring-amber-100 border-l-4 border-amber-400">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">{t(language, 'p2pTradeConditions')}</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {selectedAd.paymentTime || 15} {t(language, 'time')}
                  </span>
                </div>
                <p className="text-xs font-medium text-amber-900 leading-relaxed">
                  {selectedAd.description || t(language, 'adminNoOps')}
                </p>
              </div>

              <div className="space-y-4 mb-8 relative">
                <div className="bg-white ring-1 ring-slate-200 rounded-2xl p-4 flex justify-between items-center focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {selectedAd.type === 'buy' ? t(language, 'payAmount') : t(language, 'payAmount')}
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      className="w-full text-2xl font-bold text-slate-800 outline-none bg-transparent mt-1 placeholder-slate-500"
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'receiveAmount')}</label>
                    <div className={`text-2xl font-bold mt-1 ${selectedAd.type === 'buy' ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {calculateReceiveAmount()}
                    </div>
                  </div>
                  <div className={`font-bold px-3 py-1 rounded-lg ${selectedAd.type === 'buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedAd.type === 'buy' ? selectedAd.asset : selectedAd.fiat}
                  </div>
                </div>
              </div>

              {(() => {
                const userTrades = user.ordersAsBuyer?.length || 0;

                if (selectedAd.reqKyc && !user.isVerified) {
                  return (
                    <div className="w-full py-4 text-center rounded-[2rem] font-bold text-sm bg-slate-100 text-slate-400 border border-slate-200">
                      ❌ {t(language, 'p2pVerifyCode')}
                    </div>
                  );
                }
                if (selectedAd.reqMinTrades > userTrades) {
                  return (
                    <div className="w-full py-4 text-center rounded-[2rem] font-bold text-sm bg-slate-100 text-slate-400 border border-slate-200">
                      ❌ {t(language, 'p2pMinTrades')}: {selectedAd.reqMinTrades}
                    </div>
                  );
                }

                return (
                  <button
                    onClick={handleStartOrder}
                    className={`w-full py-5 rounded-[2rem] font-bold text-lg text-white shadow-xl active:scale-95 transition-all mt-4 ${
                      selectedAd.type === 'buy' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-red-500 shadow-red-200'
                    }`}
                  >
                    {t(language, 'orderId')}
                  </button>
                );
              })()}
            </div>
          </>
        )}
      </div>
    </PullToRefresh>
  );
}
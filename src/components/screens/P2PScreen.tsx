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
import { Share } from 'lucide-react';

import MerchantProfileModal from './MerchantProfileModal';
import MyOrdersScreen from './MyOrdersScreen';
import OrderScreen from './OrderScreen';

interface P2PScreenProps {
  initialAd?: any;
  onAdClose?: () => void;
}

export default function P2PScreen({ initialAd, onAdClose }: P2PScreenProps) {
  const { language, ads, isLoadingAds, fetchAds, user, addToast } = useAppStore();

  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        const pairs = ['USDT/TMT', 'USDT/USD', 'TMT/USDT', 'TMT/USD'];
        const prices: Record<string, number> = {};
        for (const pair of pairs) {
          const [asset, fiat] = pair.split('/');
          const res = await fetch(`/api/market-price?asset=${asset}&fiat=${fiat}`);
          const data = await res.json();
          if (data.basePrice) prices[pair] = data.basePrice;
        }
        setMarketPrices(prices);
      } catch (error) {
        console.error('Failed to fetch market prices:', error);
      }
    };
    fetchMarketPrices();
  }, []);

  const getAdPrice = (ad: any) => {
    const pair = `${ad.asset}/${ad.fiat}`;
    const basePrice = marketPrices[pair] || 0;
    if (ad.priceType === 'floating') {
      const percent = Number(ad.price) || 0;
      return basePrice * (1 + percent / 100);
    }
    return Number(ad.price) || 0;
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

  useEffect(() => {
    if (initialAd) {
      setSelectedAd(initialAd);
      setAsset(initialAd.asset);
      setFiat(initialAd.fiat);
      setTradeType(initialAd.type.toLowerCase() === 'buy' ? 'sell' : 'buy');
    }
  }, [initialAd]);

  const targetAdType = tradeType === 'buy' ? 'sell' : 'buy';
  const filteredAds = (Array.isArray(ads) ? ads : []).filter(ad => {
    const matchBase = ad.type.toLowerCase() === targetAdType && ad.asset === asset && ad.fiat === fiat;
    if (!filterAmount) return matchBase;
    const amount = Number(filterAmount);
    return matchBase && amount >= ad.minLimit && amount <= ad.maxLimit;
  });

  const handleCopyLink = (ad: any) => {
    haptic.medium();
    const link = `https://t.me/rapira_tm_bot/app?startapp=ad_${ad.id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        addToast(language === 'ru' ? "Ссылка скопирована" : language === 'tm' ? "Salgysy kopiýalandy" : "Link copied", "success");
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        addToast(language === 'ru' ? "Ссылка скопирована" : language === 'tm' ? "Salgysy kopiýalandy" : "Link copied", "success");
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const closeModal = () => {
    haptic.light();
    setSelectedAd(null);
    setTradeAmount('');
    if (onAdClose) onAdClose();
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
    if (selectedAd.type === 'buy') return (amount / price).toFixed(2);
    return (amount * price).toFixed(2);
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
      body: JSON.stringify({ adId: selectedAd.id, takerId: user.id, amountAsset, amountFiat })
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

          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => { haptic.selection(); setAsset('USDT'); }} 
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${asset === 'USDT' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}
            >
              <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">₮</div> USDT
            </button>
            <button 
              onClick={() => { haptic.selection(); setAsset('TMT'); }} 
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${asset === 'TMT' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}
            >
              <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">M</div> TMT
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
            <button onClick={() => { haptic.medium(); onPullRefresh(); }} className="p-2 bg-slate-100 text-slate-500 rounded-xl active:rotate-180 transition-all duration-300">
              <RefreshCw className={`w-4 h-4 ${isLoadingAds ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4 relative z-10">
          {isLoadingAds ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-[2rem]" />)
          ) : filteredAds.length > 0 ? (
            filteredAds.map((ad) => (
              <div key={ad.id} className="group relative bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 hover:ring-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {ad.user?.avatarUrl ? (
                        <img src={ad.user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-50" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm">
                          {(ad.user?.nickname || ad.user?.firstName || 'U').charAt(0)}
                        </div>
                      )}
                      {ad.user?.isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => { haptic.light(); setViewingMerchant(ad.user); }}
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors"
                      >
                        {ad.user?.nickname || ad.user?.firstName || ad.user?.username || t(language, 'userLabel')}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{ad.user?.tradesCount || 0} {t(language, 'trades')}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        <span className="text-[10px] text-emerald-600 font-black">★ {(ad.user?.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopyLink(ad); }}
                      className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90"
                    >
                      <Share className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl ring-1 ring-slate-100 uppercase tracking-wider">
                      <Clock className="w-3 h-3" /> {ad.paymentTime || 15} MIN
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">
                          {getAdPrice(ad).toFixed(2)}
                        </span>
                        <span className="text-sm font-bold text-slate-400 uppercase">{ad.fiat}</span>
                      </div>
                      {ad.priceType === 'floating' && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest ring-1 ring-blue-100">
                          <TrendingUp className="w-2.5 h-2.5" /> Market {ad.price > 0 ? '+' : ''}{ad.price}%
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex flex-col gap-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {t(language, 'limit')}: <span className="text-slate-800">{ad.minLimit.toLocaleString()} - {ad.maxLimit.toLocaleString()} {ad.fiat}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t(language, 'cash')} • {ad.city}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { haptic.medium(); setSelectedAd(ad); }}
                    className={`h-12 w-full rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
                      tradeType === 'buy' 
                        ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800' 
                        : 'bg-red-500 text-white shadow-red-100 hover:bg-red-600'
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

            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 z-[70] animate-in slide-in-from-bottom duration-500 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] mx-auto max-w-lg max-h-[95vh] overflow-y-auto pb-16">
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>

              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedAd.type === 'buy' ? `${t(language, 'buy')} ${selectedAd.asset}` : `${t(language, 'sell')} ${selectedAd.asset}`}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Оформление сделки</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCopyLink(selectedAd)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl active:scale-95 transition-all hover:bg-blue-50 hover:text-blue-600">
                    <Share className="w-5 h-5" />
                  </button>
                  <button onClick={closeModal} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-95 transition-all hover:bg-slate-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Price Banner */}
              <div className="bg-slate-900 p-6 rounded-[2.5rem] mb-6 shadow-xl shadow-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <TrendingUp className="w-24 h-24 text-white" />
                </div>
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">{t(language, 'price')}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white">{getAdPrice(selectedAd).toFixed(2)}</span>
                      <span className="text-sm font-bold text-white/60">{selectedAd.fiat}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Мерчант</p>
                    <button onClick={() => { haptic.light(); setSelectedAd(null); setViewingMerchant(selectedAd.user); }} className="text-sm font-black text-blue-400 flex items-center gap-1.5 justify-end group">
                      <span className="group-hover:underline">{selectedAd.user?.nickname || selectedAd.user?.firstName || t(language, 'userLabel')}</span>
                      {selectedAd.user?.isVerified && <BadgeCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Conditions Card */}
              <div className="bg-amber-50 p-6 rounded-[2.5rem] mb-8 ring-1 ring-amber-100 relative group transition-all hover:bg-amber-100/50">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-200">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">{t(language, 'p2pTradeConditions')}</span>
                  </div>
                  <span className="text-[10px] font-black text-amber-700 bg-white/50 backdrop-blur px-3 py-1.5 rounded-xl ring-1 ring-amber-200 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> {selectedAd.paymentTime || 15} MIN
                  </span>
                </div>
                <p className="text-xs font-bold text-amber-900 leading-relaxed opacity-80">
                  {selectedAd.description || t(language, 'adminNoOps')}
                </p>
              </div>

              {/* Input Section */}
              <div className="space-y-4 mb-10 relative">
                <div className="bg-white ring-1 ring-slate-200 rounded-[2.5rem] p-6 shadow-sm focus-within:ring-2 focus-within:ring-slate-900 transition-all group">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {selectedAd.type === 'buy' ? 'Я плачу' : 'Я продаю'}
                    </label>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-focus-within:text-slate-900 transition-colors">
                      Лимит: {selectedAd.minLimit} - {selectedAd.maxLimit}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      className="w-full text-4xl font-black text-slate-900 outline-none bg-transparent placeholder-slate-200 tracking-tighter"
                    />
                    <div className="font-black text-slate-900 bg-slate-100 px-4 py-2 rounded-2xl text-sm">
                      {selectedAd.type === 'buy' ? selectedAd.fiat : selectedAd.asset}
                    </div>
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="bg-white p-2 rounded-full shadow-lg ring-4 ring-slate-50">
                    <div className="bg-slate-900 p-2 rounded-full text-white shadow-xl">
                      <ArrowDownUp className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 ring-1 ring-slate-100 rounded-[2.5rem] p-6 group transition-all hover:bg-slate-100/50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t(language, 'receiveAmount')}</label>
                  <div className="flex justify-between items-center">
                    <div className={`text-4xl font-black tracking-tighter ${selectedAd.type === 'buy' ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {calculateReceiveAmount()}
                    </div>
                    <div className={`font-black px-4 py-2 rounded-2xl text-sm shadow-sm ${selectedAd.type === 'buy' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                      {selectedAd.type === 'buy' ? selectedAd.asset : selectedAd.fiat}
                    </div>
                  </div>
                </div>
              </div>

              {(() => {
                const userTrades = user.ordersAsBuyer?.length || 0;
                if (selectedAd.reqKyc && !user.isVerified) {
                  return (
                    <div className="w-full py-6 text-center rounded-[2.5rem] font-black text-sm bg-slate-100 text-slate-400 border border-slate-200 uppercase tracking-widest">
                      ❌ {t(language, 'p2pVerifyCode')}
                    </div>
                  );
                }
                if (selectedAd.reqMinTrades > userTrades) {
                  return (
                    <div className="w-full py-6 text-center rounded-[2.5rem] font-black text-sm bg-slate-100 text-slate-400 border border-slate-200 uppercase tracking-widest">
                      ❌ {t(language, 'p2pMinTrades')}: {selectedAd.reqMinTrades}
                    </div>
                  );
                }
                return (
                  <button
                    onClick={handleStartOrder}
                    className={`w-full py-6 rounded-[2.5rem] font-black text-lg text-white shadow-2xl active:scale-95 transition-all mt-4 uppercase tracking-[0.1em] ${
                      selectedAd.type === 'buy' 
                        ? 'bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600' 
                        : 'bg-red-500 shadow-red-200 hover:bg-red-600'
                    }`}
                  >
                    Открыть сделку
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
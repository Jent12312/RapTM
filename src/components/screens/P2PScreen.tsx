'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import {
  BadgeCheck, Clock, MapPin, Filter, X,
  ArrowDownUp, RefreshCw, MessageSquare, User, TrendingUp, Share, ShieldAlert
} from 'lucide-react';
import { haptic } from '@/lib/haptic';
import Skeleton from '@/components/ui/Skeleton';
import PullToRefresh from '@/components/ui/PullToRefresh';

import MerchantProfileModal from './MerchantProfileModal';
import MyOrdersScreen from './MyOrdersScreen';
import OrderScreen from './OrderScreen';

// --- ТИПИЗАЦИЯ ---
interface P2PScreenProps {
  initialAd?: any;
  onAdClose?: () => void;
}

type TradeType = 'buy' | 'sell';
type Asset = 'USDT' | 'TMT' | 'USD';
type Fiat = 'TMT' | 'USD' | 'USDT';

export default function P2PScreen({ initialAd, onAdClose }: P2PScreenProps) {
  const { language, ads, isLoadingAds, fetchAds, user, addToast } = useAppStore();

  // --- СОСТОЯНИЯ ---
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [asset, setAsset] = useState<Asset>('USDT');
  const [fiat, setFiat] = useState<Fiat>('TMT');
  
  const [filterAmount, setFilterAmount] = useState('');
  const [tradeAmount, setTradeAmount] = useState('');
  
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [viewingMerchant, setViewingMerchant] = useState<any>(null);
  const [isViewingChats, setIsViewingChats] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- ЭФФЕКТЫ ---
  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        const pairs = ['USDT/TMT', 'USDT/USD', 'USDT/USDT', 'TMT/USDT', 'TMT/USD', 'USD/USDT', 'USD/USD', 'TMT/TMT'];
        const prices: Record<string, number> = {};
        
        await Promise.all(pairs.map(async (pair) => {
          const [a, f] = pair.split('/');
          if (a === f) {
            prices[pair] = 1.00;
            return;
          }
          const res = await fetch(`/api/market-price?asset=${a}&fiat=${f}`);
          const data = await res.json();
          if (data.basePrice) prices[pair] = data.basePrice;
        }));
        
        setMarketPrices(prices);
      } catch (error) {
        console.error('Failed to fetch market prices:', error);
      }
    };
    fetchMarketPrices();
  }, []);

  useEffect(() => {
    if (initialAd) {
      setSelectedAd(initialAd);
      setAsset(initialAd.asset);
      setFiat(initialAd.fiat);
      setTradeType(initialAd.type.toLowerCase() === 'buy' ? 'sell' : 'buy');
    }
  }, [initialAd]);

  // --- ВЫЧИСЛЕНИЯ (МЕМОИЗАЦИЯ) ---
  const getAdPrice = useCallback((ad: any) => {
    const pair = `${ad.asset}/${ad.fiat}`;
    let basePrice = marketPrices[pair];

    // Если валюты одинаковые, база всегда 1.0
    if (ad.asset === ad.fiat) basePrice = 1.00;
    
    // Если база всё еще не найдена (и валюты разные), ставим 0 или пытаемся фоллбэк
    if (basePrice === undefined) basePrice = 0;

    if (ad.priceType?.toUpperCase() === 'FLOATING') {
      const percent = Number(ad.price) || 0;
      return basePrice * (1 + percent / 100);
    }
    return Number(ad.price) || 0;
  }, [marketPrices]);

  const filteredAds = useMemo(() => {
    const targetAdType = tradeType === 'buy' ? 'sell' : 'buy';
    const amount = Number(filterAmount);
    
    return (Array.isArray(ads) ? ads : [])
      .filter(ad => {
        const matchBase = ad.type.toLowerCase() === targetAdType && ad.asset === asset && ad.fiat === fiat;
        if (!matchBase) return false;
        if (amount > 0) return amount >= ad.minLimit && amount <= ad.maxLimit;
        return true;
      })
      .sort((a, b) => {
        const priceA = getAdPrice(a);
        const priceB = getAdPrice(b);
        return tradeType === 'buy' ? priceA - priceB : priceB - priceA;
      });
  }, [ads, tradeType, asset, fiat, filterAmount, getAdPrice]);

  const calculateReceiveAmount = useMemo(() => {
    if (!tradeAmount || !selectedAd) return '0.00';
    const amount = Number(tradeAmount);
    const price = getAdPrice(selectedAd);
    if (price === 0) return '0.00';
    
    return selectedAd.type === 'buy' 
      ? (amount / price).toFixed(2) 
      : (amount * price).toFixed(2);
  }, [tradeAmount, selectedAd, getAdPrice]);

  // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
  const handleCopyLink = (ad: any) => {
    haptic.medium();
    const link = `https://t.me/rapira_tm_bot/app?startapp=ad_${ad.id}`;
    
    const notifySuccess = () => addToast(language === 'ru' ? "Ссылка скопирована" : "Link copied", "success");

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(notifySuccess).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        notifySuccess();
      } catch (err) {
        addToast(t(language, 'error'), "error");
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

  const handleStartOrder = async () => {
    haptic.medium();
    const inputAmount = Number(tradeAmount);
    
    if (!inputAmount) return addToast(t(language, 'enterAmount'), "error");
    if (inputAmount < selectedAd.minLimit || inputAmount > selectedAd.maxLimit) {
      return addToast(`${t(language, 'limit')}: ${selectedAd.minLimit} - ${selectedAd.maxLimit}`, "error");
    }

    setIsProcessing(true);
    try {
      const amountAsset = tradeType === 'buy' ? Number(calculateReceiveAmount) : inputAmount;
      const amountFiat = tradeType === 'buy' ? inputAmount : Number(calculateReceiveAmount);

      // Проверка баланса перед сделкой (только если мы продаем актив или покупаем у мерчанта актив)
      const assetField = selectedAd.asset === 'TMT' ? 'tmtBalance' : 'usdtBalance';
      const sellerId = selectedAd.type === 'buy' ? user.id : selectedAd.userId;
      
      try {
        const balanceRes = await fetch(`/api/wallet/balance?userId=${sellerId}`);
        if (!balanceRes.ok) {
          const errData = await balanceRes.json();
          throw new Error(errData.error || 'Failed to check balance');
        }
        
        const balanceData = await balanceRes.json();
        const sellerBalance = Number(balanceData[assetField] || 0);
        
        if (sellerBalance < amountAsset) {
          addToast(t(language, selectedAd.asset === 'TMT' ? 'insufficientTmtSeller' : 'insufficientUsdtSeller'), 'error');
          setIsProcessing(false);
          return;
        }
      } catch (balanceError: any) {
        console.error('Balance check error:', balanceError);
        // Мы не блокируем сделку здесь, так как сервер все равно проверит баланс,
        // но логируем ошибку для отладки.
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: selectedAd.id, takerId: user.id, amountAsset, amountFiat })
      });
      
      const data = await res.json();
      
      if (data.success) {
        haptic.success();
        addToast(t(language, 'orderCreated'), "success");
        setActiveOrder(data.order);
        setSelectedAd(null);
      } else {
        haptic.error();
        addToast(data.error || t(language, 'orderUpdateError'), "error");
      }
    } catch (e) {
      addToast(t(language, 'exConnectionError'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const onPullRefresh = async () => {
    haptic.impact('heavy');
    await fetchAds();
  };

  // --- РЕНДЕРИНГ ДРУГИХ ЭКРАНОВ ---
  if (activeOrder) return <OrderScreen order={activeOrder} onClose={() => setActiveOrder(null)} />;
  if (viewingMerchant) return <MerchantProfileModal merchant={viewingMerchant} onClose={() => setViewingMerchant(null)} />;
  if (isViewingChats) return <MyOrdersScreen onClose={() => setIsViewingChats(false)} />;

  return (
    <PullToRefresh onRefresh={onPullRefresh}>
      <div className="pb-32 min-h-screen bg-slate-50/50 animate-in fade-in duration-300">
        
        {/* --- HEADER --- */}
        <div className="bg-white px-4 pt-4 pb-4 shadow-sm sticky top-0 z-30 border-b border-slate-100 space-y-4 rounded-b-[2.5rem]">
          
          {/* Top Actions: Buy/Sell Toggle & Icons */}
          <div className="flex justify-between items-center gap-3">
            <div className="flex bg-slate-100/80 p-1 rounded-2xl flex-1 relative h-11">
              <div 
                className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out
                ${tradeType === 'buy' ? 'left-1' : 'left-[calc(50%+1px)]'}`} 
              />
              <button
                onClick={() => { haptic.selection(); setTradeType('buy'); }}
                className={`flex-1 text-sm font-black rounded-xl relative z-10 transition-colors ${tradeType === 'buy' ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                {t(language, 'buy')}
              </button>
              <button
                onClick={() => { haptic.selection(); setTradeType('sell'); }}
                className={`flex-1 text-sm font-black rounded-xl relative z-10 transition-colors ${tradeType === 'sell' ? 'text-red-500' : 'text-slate-400'}`}
              >
                {t(language, 'sell')}
              </button>
            </div>

            <div className="flex gap-2 shrink-0">
              <button onClick={() => { haptic.light(); setIsViewingChats(true); }} className="w-11 h-11 flex items-center justify-center bg-slate-50 text-slate-500 rounded-2xl active:scale-95 transition-all border border-slate-100/50">
                <User className="w-5 h-5" />
              </button>
              <button onClick={() => { haptic.light(); setIsViewingChats(true); }} className="w-11 h-11 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl active:scale-95 transition-all relative border border-blue-100/50">
                <MessageSquare className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-blue-50"></span>
              </button>
            </div>
          </div>

          {/* Combined Selectors & Filter Row */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <div className="flex items-center gap-1.5 pr-2 border-r border-slate-100">
                {(['USDT', 'USD', 'TMT'] as Asset[]).map((a) => (
                  <button 
                    key={a}
                    onClick={() => { haptic.selection(); setAsset(a); }} 
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border whitespace-nowrap
                      ${asset === a 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                        : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${asset === a ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {a === 'USDT' ? '₮' : a === 'USD' ? '$' : 'M'}
                    </div>
                    {a}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-1.5 pl-1">
                {(['TMT', 'USD', 'USDT'] as Fiat[]).map((f) => (
                  <button 
                    key={f}
                    onClick={() => { haptic.selection(); setFiat(f); }} 
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all border whitespace-nowrap
                      ${fiat === f 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 px-4 h-11 rounded-2xl border border-slate-100 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm flex-1 group">
                <Filter className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="number" 
                  placeholder={t(language, 'amount')}
                  value={filterAmount}
                  onChange={(e) => setFilterAmount(e.target.value)}
                  className="bg-transparent outline-none text-sm font-bold w-full text-slate-800 placeholder-slate-400"
                />
                {filterAmount && (
                  <button onClick={() => setFilterAmount('')} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => { haptic.medium(); onPullRefresh(); }} 
                className={`h-11 w-11 flex items-center justify-center bg-slate-50 text-slate-500 rounded-2xl active:rotate-180 transition-all duration-500 border border-slate-100/50 shrink-0
                  ${isLoadingAds ? 'bg-blue-50' : ''}`}
              >
                <RefreshCw className={`w-5 h-5 ${isLoadingAds ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* --- AD LIST --- */}
        <div className="px-4 py-6 space-y-4">
          {isLoadingAds ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-[2rem]" />)
          ) : filteredAds.length > 0 ? (
            filteredAds.map((ad) => (
              <div key={ad.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/30 transition-all group active:scale-[0.98]">
                
                {/* Header: Merchant Info & Stats */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {ad.user?.avatarUrl ? (
                        <img src={ad.user.avatarUrl} alt="Avatar" className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-50" />
                      ) : (
                        <div className="w-11 h-11 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-500 font-black text-sm ring-2 ring-slate-50">
                          {(ad.user?.nickname || ad.user?.firstName || 'U').charAt(0)}
                        </div>
                      )}
                      {ad.user?.isVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
                          <BadgeCheck className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <button 
                        onClick={() => { haptic.light(); setViewingMerchant(ad.user); }}
                        className="font-black text-slate-900 text-[15px] hover:text-blue-600 transition-colors flex items-center gap-1 leading-tight"
                      >
                        {ad.user?.nickname || ad.user?.firstName || t(language, 'userLabel')}
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          {ad.user?.tradesCount || 0} {t(language, 'trades')}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          {(ad.user?.rating || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-[10px] font-black text-slate-500 rounded-xl border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {ad.paymentTime || 15} {t(language, 'time')}
                  </div>
                </div>

                {/* Body: Price and Trade Details */}
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{t(language, 'price')}</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 tracking-tighter">
                          {getAdPrice(ad).toFixed(2)}
                        </span>
                        <span className="text-sm font-black text-slate-400">{ad.fiat}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] font-bold text-slate-400">{t(language, 'limit')}</div>
                        <div className="text-[11px] font-black text-slate-700">
                          {ad.minLimit.toLocaleString()} - {ad.maxLimit.toLocaleString()} {ad.fiat}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-lg uppercase tracking-wider border border-emerald-100/50">
                          <MapPin className="w-2.5 h-2.5" /> {ad.city || t(language, 'cash')}
                        </span>
                        {ad.paymentMethods?.map((pm: any, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[9px] font-black rounded-lg uppercase tracking-wider border border-blue-100/50">
                            {pm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { haptic.medium(); setSelectedAd(ad); }}
                    className={`h-14 px-8 rounded-[1.5rem] font-black text-sm text-white transition-all active:scale-95 shadow-lg
                      ${tradeType === 'buy' 
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' 
                        : 'bg-red-500 hover:bg-red-600 shadow-red-200'
                      }`}
                  >
                    {tradeType === 'buy' ? t(language, 'buyBtn') : t(language, 'sellBtn')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">{t(language, 'noAds')}</h3>
              <p className="text-sm text-slate-500">{t(language, 'noAdsDesc').replace('{asset}', asset).replace('{fiat}', fiat)}</p>
            </div>
          )}
        </div>

        {/* --- TRADE MODAL --- */}
        {selectedAd && (
          <div className="fixed inset-0 z-[60] flex items-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={closeModal} />

            <div className="relative w-full bg-white rounded-t-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[92vh] flex flex-col overflow-hidden">
              
              {/* Modal Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedAd.type === 'buy' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    <ArrowDownUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">
                      {selectedAd.type === 'buy' ? `${t(language, 'buy')} ${selectedAd.asset}` : `${t(language, 'sell')} ${selectedAd.asset}`}
                    </h3>
                    <p className="text-[13px] text-slate-500 font-bold mt-0.5">
                      {t(language, 'price')}: <span className="text-slate-900">{getAdPrice(selectedAd).toFixed(2)} {selectedAd.fiat}</span>
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors active:scale-90">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6 overflow-y-auto space-y-6 pb-12 custom-scrollbar">
                
                {/* Inputs Row */}
                <div className="space-y-4 relative">
                  <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-blue-500/5 transition-all duration-300">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-3 font-black uppercase tracking-widest">
                      <span>{selectedAd.type === 'buy' ? t(language, 'exYouPay') : t(language, 'exYouGive')}</span>
                      <span>{t(language, 'limit')}: {selectedAd.minLimit} - {selectedAd.maxLimit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        className="w-full text-4xl font-black text-slate-900 bg-transparent outline-none placeholder-slate-200 tracking-tighter"
                      />
                      <span className="text-xl font-black text-slate-900 ml-3 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                        {selectedAd.type === 'buy' ? selectedAd.fiat : selectedAd.asset}
                      </span>
                    </div>
                  </div>

                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-2xl border-4 border-white shadow-xl z-10">
                    <div className="bg-slate-900 p-2 rounded-xl">
                      <ArrowDownUp className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-5 rounded-[2rem] border border-blue-100/50">
                    <div className="text-[11px] text-blue-400 mb-3 font-black uppercase tracking-widest">{t(language, 'receiveAmount')}</div>
                    <div className="flex items-center justify-between">
                      <div className={`text-4xl font-black tracking-tighter ${selectedAd.type === 'buy' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {calculateReceiveAmount}
                      </div>
                      <span className="text-xl font-black text-slate-900 ml-3 bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                        {selectedAd.type === 'buy' ? selectedAd.asset : selectedAd.fiat}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-amber-50/70 p-5 rounded-[2rem] border border-amber-100/50">
                  <div className="flex items-center gap-2 mb-3 text-amber-800">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-[11px] font-black uppercase tracking-[0.15em]">{t(language, 'p2pTradeConditions')}</span>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl text-sm font-bold text-amber-900/80 leading-relaxed whitespace-pre-wrap border border-amber-200/20">
                    {selectedAd.description || 'Условия не указаны мерчантом.'}
                  </div>
                </div>

                {/* Validation & Button */}
                {(() => {
                  const userTrades = (user?.ordersAsBuyer || []).length || 0;
                  
                  if (selectedAd.reqKyc && !user?.isVerified) {
                    return <div className="w-full py-5 text-center rounded-[1.5rem] font-black text-sm bg-red-50 text-red-500 border border-red-100">{t(language, 'kycRequired')}</div>;
                  }
                  if (selectedAd.reqMinTrades > userTrades) {
                    return <div className="w-full py-5 text-center rounded-[1.5rem] font-black text-sm bg-red-50 text-red-500 border border-red-100 px-4">
                      {t(language, 'minTradesRequired').replace('{min}', selectedAd.reqMinTrades.toString()).replace('{current}', userTrades.toString())}
                    </div>;
                  }
                  
                  return (
                    <button
                      onClick={handleStartOrder}
                      disabled={isProcessing || !tradeAmount}
                      className={`w-full py-5 rounded-[1.5rem] font-black text-lg text-white transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl
                        ${!tradeAmount 
                          ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed' 
                          : selectedAd.type === 'buy' 
                            ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' 
                            : 'bg-red-500 hover:bg-red-600 shadow-red-200'}
                      `}
                    >
                      {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : t(language, 'openOrderBtn')}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
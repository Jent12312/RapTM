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
type Asset = 'USDT' | 'TMT';
type Fiat = 'TMT' | 'USD';

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
        const pairs = ['USDT/TMT', 'USDT/USD', 'TMT/USDT', 'TMT/USD'];
        const prices: Record<string, number> = {};
        
        await Promise.all(pairs.map(async (pair) => {
          const [a, f] = pair.split('/');
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
    const basePrice = marketPrices[pair] || 0;
    if (ad.priceType === 'floating') {
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
      const res = await fetch(`/api/wallet/balance?userId=${sellerId}`);
      const data = await res.json();
      
      const sellerBalance = Number(data[assetField] || 0);
      if (sellerBalance < amountAsset) {
        addToast(t(language, selectedAd.asset === 'TMT' ? 'insufficientTmtSeller' : 'insufficientUsdtSeller'), 'error');
        setIsProcessing(false);
        return;
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
        <div className="bg-white px-4 pt-4 pb-3 shadow-sm shadow-slate-200/50 sticky top-0 z-30 border-b border-slate-100 space-y-3 rounded-b-3xl">
          
          {/* Top Actions: Buy/Sell Toggle & Icons */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl flex-1 relative">
              <div 
                className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out
                ${tradeType === 'buy' ? 'left-1.5' : 'left-[calc(50%+1.5px)]'}`} 
              />
              <button
                onClick={() => { haptic.selection(); setTradeType('buy'); }}
                className={`flex-1 py-2 text-sm font-bold rounded-xl relative z-10 transition-colors ${tradeType === 'buy' ? 'text-emerald-600' : 'text-slate-500'}`}
              >
                {t(language, 'buy')}
              </button>
              <button
                onClick={() => { haptic.selection(); setTradeType('sell'); }}
                className={`flex-1 py-2 text-sm font-bold rounded-xl relative z-10 transition-colors ${tradeType === 'sell' ? 'text-red-500' : 'text-slate-500'}`}
              >
                {t(language, 'sell')}
              </button>
            </div>

            <div className="flex gap-2 shrink-0">
              <button onClick={() => { haptic.light(); setIsViewingChats(true); }} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl active:scale-95 transition-all">
                <User className="w-5 h-5" />
              </button>
              <button onClick={() => { haptic.light(); setIsViewingChats(true); }} className="p-3 bg-blue-50 text-blue-600 rounded-2xl active:scale-95 transition-all relative">
                <MessageSquare className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-50"></span>
              </button>
            </div>
          </div>

          {/* Crypto / Fiat Selectors */}
          <div className="flex items-center gap-3">
            <div className="flex gap-2 flex-1">
              <button onClick={() => { haptic.selection(); setAsset('USDT'); }} className={`flex-1 py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border transition-all ${asset === 'USDT' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-transparent text-slate-500'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${asset === 'USDT' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>₮</div> USDT
              </button>
              <button onClick={() => { haptic.selection(); setAsset('TMT'); }} className={`flex-1 py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border transition-all ${asset === 'TMT' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-transparent text-slate-500'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${asset === 'TMT' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>M</div> TMT
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button onClick={() => { haptic.selection(); setFiat('TMT'); }} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${fiat === 'TMT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>TMT</button>
                <button onClick={() => { haptic.selection(); setFiat('USD'); }} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${fiat === 'USD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>USD</button>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 transition-all focus-within:border-blue-400 focus-within:bg-white flex-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="number" 
                  placeholder={t(language, 'amount')}
                  value={filterAmount}
                  onChange={(e) => setFilterAmount(e.target.value)}
                  className="bg-transparent outline-none text-xs font-bold w-full text-slate-800 placeholder-slate-400"
                />
                {filterAmount && <X className="w-3.5 h-3.5 text-slate-400" onClick={() => setFilterAmount('')}/>}
              </div>
            </div>
            <button onClick={() => { haptic.medium(); onPullRefresh(); }} className="p-2 bg-slate-50 text-slate-500 rounded-xl active:rotate-180 transition-all duration-300 shrink-0">
              <RefreshCw className={`w-4 h-4 ${isLoadingAds ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* --- AD LIST --- */}
        <div className="px-4 py-6 space-y-4">
          {isLoadingAds ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-[2rem]" />)
          ) : filteredAds.length > 0 ? (
            filteredAds.map((ad) => (
              <div key={ad.id} className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
                
                {/* Header: Merchant Info & Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {ad.user?.avatarUrl ? (
                        <img src={ad.user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-50" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-sm ring-2 ring-slate-50">
                          {(ad.user?.nickname || ad.user?.firstName || 'U').charAt(0)}
                        </div>
                      )}
                      {ad.user?.isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <BadgeCheck className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <button 
                        onClick={() => { haptic.light(); setViewingMerchant(ad.user); }}
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors flex items-center gap-1"
                      >
                        {ad.user?.nickname || ad.user?.firstName || t(language, 'userLabel')}
                        <TrendingUp className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          {ad.user?.tradesCount || 0} {t(language, 'trades')}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                        <span className="text-[10px] font-black text-emerald-600">
                          {(ad.user?.rating || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-xl border border-slate-100/50">
                    <Clock className="w-3 h-3" /> {ad.paymentTime || 15}m
                  </div>
                </div>

                {/* Body: Price and Trade Details */}
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t(language, 'price')}</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                          {getAdPrice(ad).toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{ad.fiat}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] font-medium text-slate-400">{t(language, 'limit')}</div>
                        <div className="text-[10px] font-bold text-slate-700">
                          {ad.minLimit.toLocaleString()} - {ad.maxLimit.toLocaleString()} {ad.fiat}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-lg uppercase tracking-wider">
                          <MapPin className="w-2.5 h-2.5" /> {ad.city || t(language, 'cash')}
                        </span>
                        {ad.paymentMethods?.map((pm: any, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-[9px] font-black rounded-lg uppercase tracking-wider">
                            {pm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { haptic.medium(); setSelectedAd(ad); }}
                    className={`h-12 px-8 rounded-2xl font-black text-sm text-white transition-all active:scale-95 shadow-lg shadow-opacity-20
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
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal} />

            <div className="relative w-full bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedAd.type === 'buy' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    <ArrowDownUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {selectedAd.type === 'buy' ? `${t(language, 'buy')} ${selectedAd.asset}` : `${t(language, 'sell')} ${selectedAd.asset}`}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{t(language, 'price')}: {getAdPrice(selectedAd).toFixed(2)} {selectedAd.fiat}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-6 pb-12">
                
                {/* Inputs */}
                <div className="space-y-3 relative">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                    <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium">
                      <span>{selectedAd.type === 'buy' ? t(language, 'exYouPay') : t(language, 'exYouGive')}</span>
                      <span>{t(language, 'limit')}: {selectedAd.minLimit} - {selectedAd.maxLimit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        className="w-full text-3xl font-black text-slate-900 bg-transparent outline-none placeholder-slate-300"
                      />
                      <span className="text-lg font-bold text-slate-900 ml-2">
                        {selectedAd.type === 'buy' ? selectedAd.fiat : selectedAd.asset}
                      </span>
                    </div>
                  </div>

                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full border border-slate-100">
                    <ArrowDownUp className="w-5 h-5 text-slate-400" />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-xs text-slate-500 mb-2 font-medium">{t(language, 'receiveAmount')}</div>
                    <div className="flex items-center justify-between">
                      <div className={`text-3xl font-black ${selectedAd.type === 'buy' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {calculateReceiveAmount}
                      </div>
                      <span className="text-lg font-bold text-slate-900 ml-2">
                        {selectedAd.type === 'buy' ? selectedAd.asset : selectedAd.fiat}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100/50">
                  <div className="flex items-center gap-2 mb-2 text-amber-800">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{t(language, 'p2pTradeConditions')}</span>
                  </div>
                  <p className="text-xs font-medium text-amber-900/80 leading-relaxed whitespace-pre-wrap">
                    {selectedAd.description || 'Условия не указаны мерчантом.'}
                  </p>
                </div>

                {/* Validation & Button */}
                {(() => {
                  const userTrades = (user?.ordersAsBuyer || []).length || 0;
                  
                  if (selectedAd.reqKyc && !user?.isVerified) {
                    return <div className="w-full py-4 text-center rounded-xl font-bold text-sm bg-red-50 text-red-500">{t(language, 'kycRequired')}</div>;
                  }
                  if (selectedAd.reqMinTrades > userTrades) {
                    return <div className="w-full py-4 text-center rounded-xl font-bold text-sm bg-red-50 text-red-500">
                      {t(language, 'minTradesRequired').replace('{min}', selectedAd.reqMinTrades.toString()).replace('{current}', userTrades.toString())}
                    </div>;
                  }
                  
                  return (
                    <button
                      onClick={handleStartOrder}
                      disabled={isProcessing || !tradeAmount}
                      className={`w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-95 flex items-center justify-center gap-2
                        ${!tradeAmount ? 'bg-slate-300' : selectedAd.type === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}
                      `}
                    >
                      {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : t(language, 'openOrderBtn')}
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
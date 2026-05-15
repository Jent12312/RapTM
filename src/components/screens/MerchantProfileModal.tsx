'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Share, BarChart2, Smile, Frown, Meh, BadgeCheck, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import WebApp from '@twa-dev/sdk';

interface Props {
  merchant: any;
  onClose: () => void;
}

export default function MerchantProfileModal({ merchant, onClose }: Props) {
  const { language } = useAppStore();
  const [stats, setStats] = useState({ good: 0, neutral: 0, bad: 0, trades: 0, volume: 0, averageRating: 0, positivePercent: 0 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [activeAds, setActiveAds] = useState<any[]>([]);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    // Грузим реальную статистику
    fetch(`/api/user/${merchant.id}/stats`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && !data.error) {
          setStats(data);
        }
      })
      .catch(e => console.error('Stats fetch error:', e));
    // Грузим отзывы
    fetch(`/api/user/${merchant.id}/reviews`)
      .then(res => res.json())
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));

    // Грузим объявления мерчанта
    fetch(`/api/p2p?userId=${merchant.id}`)
      .then(res => res.json())
      .then(data => {
        const ads = Array.isArray(data.ads) ? data.ads : [];
        setActiveAds(ads.filter((ad: any) => ad.isActive));
      })
      .catch(() => setActiveAds([]));

    // Грузим рыночные цены для расчета цен объявлений
    const fetchMarketPrices = async () => {
      try {
        const pairs = ['USDT/TMT', 'USDT/USD', 'USDT/USDT', 'TMT/USDT', 'TMT/USD', 'USD/USD', 'TMT/TMT'];
        const prices: Record<string, number> = {};
        for (const pair of pairs) {
          const [asset, fiat] = pair.split('/');
          if (asset === fiat) {
            prices[pair] = 1.00;
            continue;
          }
          const res = await fetch(`/api/market-price?asset=${asset}&fiat=${fiat}`);
          const data = await res.json();
          if (data.basePrice) prices[pair] = data.basePrice;
        }
        setMarketPrices(prices);
      } catch (e) { console.error(e); }
    };
    fetchMarketPrices();
  }, [merchant.id]);

  const getAdPrice = (ad: any) => {
    if (ad.priceType?.toUpperCase() === 'FIXED') {
      return Number(ad.price) || 0;
    }
    const pair = `${ad.asset}/${ad.fiat}`;
    let basePrice = marketPrices[pair];
    if (ad.asset === ad.fiat) basePrice = 1.00;
    if (basePrice === undefined) basePrice = 0;
    
    const percent = Number(ad.price) || 0;
    return basePrice * (1 + percent / 100);
  };

  const handleShare = () => {
    try {
      WebApp.switchInlineQuery(`profile_${merchant.id}`, ['users', 'groups', 'channels']);
    } catch (e) {
      WebApp.showAlert("Шеринг доступен только из мобильного Telegram");
    }
  };

  const totalReviews = stats.good + stats.neutral + stats.bad;
  const ratingPercent = totalReviews > 0 ? Math.round((stats.good / totalReviews) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      
      <div className="bg-white px-5 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-slate-800">{merchant.nickname || merchant.firstName || merchant.username || t(language, 'userLabel')}</h2>
              {merchant.level === 'Partner' && (
                <span className="text-[8px] font-black uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ring-1 ring-purple-200">
                  <BadgeCheck className="w-2.5 h-2.5" /> PARTNER
                </span>
              )}
              {merchant.level === 'Pro' && (
                <span className="text-[8px] font-black uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ring-1 ring-blue-200">
                  <ShieldCheck className="w-2.5 h-2.5" /> PRO
                </span>
              )}
              {merchant.isVerified && merchant.level === 'Standard' && <BadgeCheck className="w-5 h-5 text-blue-500" fill="currentColor" stroke="white" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="text-[10px] font-bold text-slate-400">ID: {merchant.telegramId || merchant.id.slice(0, 8)}</div>
              <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
              <div className="text-[10px] font-bold text-slate-400">{t(language, 'mpOnPlatform')} {new Date(merchant.createdAt || Date.now()).getFullYear()}</div>
            </div>
          </div>
        </div>
        <button onClick={handleShare} className="p-3 bg-blue-50 text-blue-600 rounded-2xl active:scale-95 transition-all"><Share className="w-5 h-5" /></button>
      </div>

      <div className="p-4 mt-2 pb-32">
        {/* Карточка Статистики */}
        <div className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden mb-8">
          <div className="grid grid-cols-3 border-b border-slate-50">
            <div className="p-4 text-center border-r border-slate-50">
              <div className="text-lg font-black text-slate-800">{stats.trades}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'mpTrades')}</div>
            </div>
            <div className="p-4 text-center border-r border-slate-50">
              <div className="text-lg font-black text-slate-800">{stats.trades > 0 ? '100%' : '0%'}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'mpCompletion')}</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-lg font-black text-slate-800">{stats.volume.toFixed(0)} <span className="text-xs">USDT</span></div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'mpVolume')}</div>
            </div>
          </div>

          <div className="p-5 flex justify-between items-center bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-black text-emerald-500">{stats.positivePercent}%</div>
                <div className="text-xs font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg ring-1 ring-blue-100">
                  {stats.averageRating.toFixed(1)}/5.0
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{t(language, 'mpPositiveReviews')}</div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1"><Smile className="w-5 h-5 text-emerald-500" /> <span className="text-sm font-bold">{stats.good}</span></div>
              <div className="flex items-center gap-1"><Meh className="w-5 h-5 text-amber-400" /> <span className="text-sm font-bold">{stats.neutral}</span></div>
              <div className="flex items-center gap-1"><Frown className="w-5 h-5 text-red-400" /> <span className="text-sm font-bold">{stats.bad}</span></div>
            </div>
          </div>
        </div>

        {/* Список отзывов */}
        {reviews.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Последние отзывы</h3>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-100 space-y-5">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border-b border-slate-50 last:border-0 pb-5 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {review.author.avatarUrl ? (
                        <img src={review.author.avatarUrl} className="w-6 h-6 rounded-lg object-cover" />
                      ) : (
                        <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {(review.author.nickname || review.author.firstName || '?').charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-bold text-slate-700">{review.author.nickname || review.author.firstName}</span>
                    </div>
                    <div className={`p-1 rounded-md ${
                      review.rating === 'EXCELLENT' ? 'text-emerald-500 bg-emerald-50' : 
                      review.rating === 'NEUTRAL' ? 'text-amber-500 bg-amber-50' : 'text-red-500 bg-red-50'
                    }`}>
                      {review.rating === 'EXCELLENT' ? <Smile className="w-3.5 h-3.5" /> : 
                       review.rating === 'NEUTRAL' ? <Meh className="w-3.5 h-3.5" /> : <Frown className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-slate-500 leading-relaxed italic">"{review.comment}"</p>
                  )}
                  <p className="text-[9px] text-slate-300 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
              {reviews.length > 3 && (
                <button className="w-full text-center text-[10px] font-black text-blue-500 uppercase tracking-widest pt-2">
                  Смотреть все ({reviews.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Список активных объявлений */}
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">{t(language, 'mpSellerAds')}</h3>
        <div className="space-y-4">
          {activeAds.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-[2rem] ring-1 ring-slate-100 text-slate-400 text-sm font-medium">
              {t(language, 'p2pNoAds')}
            </div>
          ) : (
            activeAds.map(ad => (
              <div key={ad.id} className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 flex justify-between items-center transition-all hover:shadow-md">
                <div>
                  <div className="text-lg font-bold text-slate-800">{getAdPrice(ad).toFixed(2)} <span className="text-xs text-slate-400 font-medium">{ad.fiat}</span></div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">{t(language, 'mpLimit')}: {ad.minLimit} - {ad.maxLimit}</div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-bold text-xs shadow-sm ${ad.type === 'BUY' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-red-50 text-red-700 ring-1 ring-red-100'}`}>
                  {ad.type === 'BUY' ? t(language, 'buy') : t(language, 'sell')} {ad.asset}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
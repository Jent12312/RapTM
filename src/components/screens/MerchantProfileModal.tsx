'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Share, BarChart2, Smile, Frown, Meh, BadgeCheck } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

interface Props {
  merchant: any;
  onClose: () => void;
}

export default function MerchantProfileModal({ merchant, onClose }: Props) {
  const [stats, setStats] = useState({ good: 0, neutral: 0, bad: 0, trades: 0, volume: 0 });
  const [activeAds, setActiveAds] = useState<any[]>([]);

  useEffect(() => {
    // Грузим реальную статистику
    fetch(`/api/user/${merchant.id}/stats`).then(res => res.json()).then(setStats);
    // Грузим объявления мерчанта
    fetch(`/api/p2p?userId=${merchant.id}`).then(res => res.json()).then(data => {
      setActiveAds(data.filter((ad: any) => ad.isActive));
    });
  }, [merchant.id]);

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
              <h2 className="text-lg font-bold text-slate-800">{merchant.nickname || merchant.firstName}</h2>
              {merchant.isVerified && <BadgeCheck className="w-5 h-5 text-blue-500" fill="currentColor" stroke="white" />}
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5">На платформе с 2024</div>
          </div>
        </div>
        <button onClick={handleShare} className="p-2 bg-blue-50 text-blue-600 rounded-full"><Share className="w-5 h-5" /></button>
      </div>

      <div className="p-4 mt-2 pb-32">
        {/* Карточка Статистики */}
        <div className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden mb-8">
          <div className="grid grid-cols-3 border-b border-slate-50">
            <div className="p-4 text-center border-r border-slate-50">
              <div className="text-lg font-black text-slate-800">{stats.trades}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Сделок</div>
            </div>
            <div className="p-4 text-center border-r border-slate-50">
              <div className="text-lg font-black text-slate-800">{stats.trades > 0 ? '100%' : '0%'}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Выполнено</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-lg font-black text-slate-800">{stats.volume.toFixed(0)} <span className="text-xs">USDT</span></div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Объём</div>
            </div>
          </div>

          <div className="p-5 flex justify-between items-center bg-slate-50/50">
            <div>
              <div className="text-lg font-black text-emerald-500">{ratingPercent}%</div>
              <div className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">положительных отзывов</div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1"><Smile className="w-5 h-5 text-emerald-500" /> <span className="text-sm font-bold">{stats.good}</span></div>
              <div className="flex items-center gap-1"><Meh className="w-5 h-5 text-slate-400" /> <span className="text-sm font-bold">{stats.neutral}</span></div>
              <div className="flex items-center gap-1"><Frown className="w-5 h-5 text-red-400" /> <span className="text-sm font-bold">{stats.bad}</span></div>
            </div>
          </div>
        </div>

        {/* Список активных объявлений */}
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Объявления продавца</h3>
        <div className="space-y-4">
          {activeAds.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-[2rem] ring-1 ring-slate-100 text-slate-400 text-sm font-medium">
              Нет активных объявлений
            </div>
          ) : (
            activeAds.map(ad => (
              <div key={ad.id} className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 flex justify-between items-center">
                <div>
                  <div className="text-lg font-bold text-slate-800">{ad.price.toFixed(2)} <span className="text-xs">{ad.fiat}</span></div>
                  <div className="text-xs text-slate-500 font-medium">Лимит: {ad.minLimit} - {ad.maxLimit}</div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${ad.type === 'buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {ad.type === 'buy' ? 'Покупает' : 'Продает'} {ad.asset}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
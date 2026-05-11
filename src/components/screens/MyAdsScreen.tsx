'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { ChevronLeft, Trash2, Power, Share } from 'lucide-react';
import { haptic } from '@/lib/haptic';

interface Props {
  onClose: () => void;
}

export default function MyAdsScreen({ onClose }: Props) {
  const { user, language } = useAppStore();
  const [myAds, setMyAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем только объявления текущего юзера
  const loadMyAds = async () => {
    if (!user || !user.id) return; // Защита от отсутствия юзера

    setIsLoading(true);
    try {
      const res = await fetch(`/api/p2p?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        // Умное извлечение массива (как мы делали в других местах)
        const adsArray = Array.isArray(data) ? data : (data?.ads || data?.data || []);
        setMyAds(adsArray);
      } else {
        setMyAds([]); // Если ответ не ok
      }
    } catch (error) {
      console.error('Ошибка загрузки моих объявлений:', error);
      setMyAds([]); // При ошибке сети сбрасываем в пустой массив
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadMyAds();
  }, [user?.id]); // Безопасная зависимость

  // Гарантируем, что myAds всегда массив перед использованием
  const safeMyAds = Array.isArray(myAds) ? myAds : [];

  // Функция переключения тумблера
  const toggleAdStatus = async (adId: string, currentStatus: boolean) => {
    const { addToast } = useAppStore.getState();
    
    // Используем safeMyAds
    setMyAds(safeMyAds.map(ad => ad.id === adId ? { ...ad, isActive: !currentStatus } : ad));

    try {
      await fetch(`/api/p2p/${adId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      addToast(t(language, 'success'), "info");
    } catch (error) {
      addToast(t(language, 'error'), "error");
      loadMyAds(); // Перезагружаем при ошибке
    }
  };

  // Функция удаления
  const deleteAd = async (adId: string) => {
    const { addToast } = useAppStore.getState();
    if (!confirm(t(language, 'deleteAccount'))) return;

    try {
      await fetch(`/api/p2p/${adId}`, { method: 'DELETE' });
      // Используем safeMyAds
      setMyAds(safeMyAds.filter(ad => ad.id !== adId));
      addToast(t(language, 'success'), "success");
    } catch (error) {
      addToast(t(language, 'error'), "error");
    }
  };

  const handleCopyLink = (ad: any) => {
    const { addToast } = useAppStore.getState();
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
      } catch (err) {}
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      
      {/* Шапка */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500 active:scale-95">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{t(language, 'myAds')}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'merchantCenter')}</p>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {isLoading ? (
          <div className="text-center py-10 text-slate-400 font-bold">{t(language, 'loading')}</div>
        ) : safeMyAds.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-medium text-sm bg-white rounded-[2rem] ring-1 ring-slate-100">
            <div className="text-4xl mb-3 opacity-50">📭</div>
            {t(language, 'noAds')}<br/>
            {t(language, 'createAd')}!
          </div>
        ) : (
          safeMyAds.map((ad) => (
            <div key={ad.id} className={`bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 transition-all ${!ad.isActive ? 'opacity-70 grayscale-[30%]' : ''}`}>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${ad.type === 'buy' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    <span className="text-xs font-bold uppercase tracking-wider">{ad.type === 'buy' ? t(language, 'buy') : t(language, 'sell')}</span>
                  </div>
                  <span className="font-bold text-slate-800">{ad.asset}</span>
                </div>

                {/* iOS Toggle (Тумблер) */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {ad.isActive ? t(language, 'statusCompleted') : t(language, 'statusCancelled')}
                  </span>
                  <button 
                    onClick={() => toggleAdStatus(ad.id, ad.isActive)}
                    className={`w-12 h-7 rounded-full relative transition-all duration-300 ${ad.isActive ? 'bg-emerald-500 shadow-inner shadow-emerald-700/50' : 'bg-slate-200 shadow-inner shadow-slate-300/50'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${ad.isActive ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                <div>
                  <div className="text-xl font-bold text-slate-800">
                    {Number(ad.price)?.toFixed(2) || '0.00'} <span className="text-xs font-medium text-slate-400">{ad.fiat}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">
                    {t(language, 'p2pLimit')}: {ad.minLimit} - {ad.maxLimit} {ad.fiat}
                  </div>
                </div>

                {/* Кнопка удаления */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCopyLink(ad)}
                    className="p-2.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors active:scale-95"
                  >
                    <Share className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => deleteAd(ad.id)}
                    className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}

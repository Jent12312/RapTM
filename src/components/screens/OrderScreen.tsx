'use client';

import { useState } from 'react';
import { ChevronLeft, MessageCircle, ShieldCheck, Clock, MapPin, CheckCircle2, Smile, Meh, Frown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import ChatScreen from './ChatScreen';

interface Props {
  order: any;
  onClose: () => void;
}

export default function OrderScreen({ order, onClose }: Props) {
  const { user, language } = useAppStore();
  const [status, setStatus] = useState(order.status);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Стейты для отзыва
  const [hasReviewed, setHasReviewed] = useState(order.review ? true : false);
  const [selectedRating, setSelectedRating] = useState<string | null>(order.review?.rating || null);

  const partnerName = user.id === order.buyerId ? order.seller.firstName : order.buyer.firstName;
  const partnerId = user.id === order.buyerId ? order.sellerId : order.buyerId;

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) setStatus(newStatus);
    } catch (e) {
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleLeaveReview = async (rating: 'GOOD' | 'NEUTRAL' | 'BAD') => {
    setSelectedRating(rating);
    setHasReviewed(true);

    try {
      await fetch(`/api/orders/${order.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: user.id,
          targetId: partnerId,
          rating
        })
      });
    } catch (e) {
      alert(t(language, 'error'));
    }
  };

  return (
    <>
      {isChatOpen && (
        <ChatScreen 
          orderId={order.id} 
          partnerName={partnerName} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}

      <div className="fixed inset-0 z-[150] bg-slate-50 overflow-y-auto animate-in fade-in duration-300">
        
        {/* Шапка */}
        <div className="bg-white px-5 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-slate-100 shadow-sm">
          <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">{t(language, 'orderId')} #{order.id.slice(0,8)}</h2>
            <div className={`flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest ${status === 'COMPLETED' ? 'text-blue-500' : 'text-emerald-600'}`}>
              {status === 'COMPLETED' ? t(language, 'success') : <><ShieldCheck className="w-3 h-3" /> {t(language, 'safeDeal')}</>}
            </div>
          </div>
          <button onClick={() => setIsChatOpen(true)} className="p-2 bg-slate-50 rounded-full text-blue-500 relative">
            <MessageCircle className="w-6 h-6" />
            {status !== 'COMPLETED' && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>}
          </button>
        </div>

        <div className="p-5 space-y-6 pb-32">
          
          {/* Главный блок Статуса */}
          <div className={`p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 text-center transition-all ${status === 'COMPLETED' ? 'bg-gradient-to-b from-emerald-50 to-white' : 'bg-white'}`}>
            
            {status === 'PENDING' && (
              <>
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
                  <Clock className="w-4 h-4" /> {t(language, 'statusPending')}: 14:59
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{t(language, 'payAmount')}</h3>
                <p className="text-sm text-slate-500 font-medium">{t(language, 'step1')}</p>
              </>
            )}

            {status === 'PAID' && (
              <>
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold mb-4 animate-pulse">
                  {t(language, 'statusPaid')}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{t(language, 'confirmRec')}</h3>
                <p className="text-sm text-slate-500 font-medium">{t(language, 'step3')}</p>
              </>
            )}

            {status === 'COMPLETED' && (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{t(language, 'statusCompleted')}</h3>
                <p className="text-sm text-emerald-600 font-bold mb-6">+{order.amountAsset} {order.ad.asset} {t(language, 'salmak')}</p>

                {/* БЛОК ОТЗЫВОВ */}
                <div className="border-t border-slate-100 pt-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t(language, 'reviewTitle')}</p>

                  <div className="flex justify-center gap-4">
                    <button
                      disabled={hasReviewed}
                      onClick={() => handleLeaveReview('GOOD')}
                      className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                        selectedRating === 'GOOD' ? 'bg-blue-50 ring-2 ring-blue-500 scale-110' :
                        hasReviewed ? 'opacity-30' : 'bg-slate-50 hover:bg-blue-50 active:scale-95'
                      }`}
                    >
                      <Smile className={`w-8 h-8 ${selectedRating === 'GOOD' ? 'text-blue-500' : 'text-slate-400'}`} />
                      <span className={`text-[10px] font-bold ${selectedRating === 'GOOD' ? 'text-blue-600' : 'text-slate-400'}`}>{t(language, 'excellent')}</span>
                    </button>

                    <button
                      disabled={hasReviewed}
                      onClick={() => handleLeaveReview('NEUTRAL')}
                      className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                        selectedRating === 'NEUTRAL' ? 'bg-slate-100 ring-2 ring-slate-400 scale-110' :
                        hasReviewed ? 'opacity-30' : 'bg-slate-50 hover:bg-slate-100 active:scale-95'
                      }`}
                    >
                      <Meh className={`w-8 h-8 ${selectedRating === 'NEUTRAL' ? 'text-slate-500' : 'text-slate-400'}`} />
                      <span className={`text-[10px] font-bold ${selectedRating === 'NEUTRAL' ? 'text-slate-600' : 'text-slate-400'}`}>{t(language, 'neutral')}</span>
                    </button>

                    <button
                      disabled={hasReviewed}
                      onClick={() => handleLeaveReview('BAD')}
                      className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                        selectedRating === 'BAD' ? 'bg-red-50 ring-2 ring-red-500 scale-110' :
                        hasReviewed ? 'opacity-30' : 'bg-slate-50 hover:bg-red-50 active:scale-95'
                      }`}
                    >
                      <Frown className={`w-8 h-8 ${selectedRating === 'BAD' ? 'text-red-500' : 'text-slate-400'}`} />
                      <span className={`text-[10px] font-bold ${selectedRating === 'BAD' ? 'text-red-600' : 'text-slate-400'}`}>{t(language, 'bad')}</span>
                    </button>
                  </div>

                  {hasReviewed && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">{t(language, 'reviewSuccess')}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Детали платежа (скрываем если завершено) */}
          {status !== 'COMPLETED' && (
            <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t(language, 'payAmount')}</span>
                <span className="text-lg font-black text-slate-800">{order.amountFiat} {order.ad.fiat}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t(language, 'receiveAmount')}</span>
                <span className="text-lg font-black text-emerald-600">{order.amountAsset} {order.ad.asset}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t(language, 'meetingCity')}</span>
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-emerald-500" /> {order.ad.city}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки действий снизу */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
          {status === 'PENDING' && user.id === order.buyerId && (
            <div className="flex gap-3">
              <button className="flex-1 py-4 text-slate-400 font-bold text-sm uppercase">{t(language, 'cancel')}</button>
              <button onClick={() => updateOrderStatus('PAID')} className="flex-[2] bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all uppercase tracking-wide">
                {t(language, 'iPay')}
              </button>
            </div>
          )}

          {status === 'PAID' && user.id === order.sellerId && (
            <button onClick={() => updateOrderStatus('COMPLETED')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all uppercase tracking-wide">
              {t(language, 'confirmRec')}
            </button>
          )}

          {status === 'COMPLETED' && (
            <button onClick={onClose} className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl active:scale-95 transition-all uppercase tracking-wide">
              {t(language, 'returnToWallet')}
            </button>
          )}

          {status === 'PENDING' && user.id === order.sellerId && (
            <div className="text-center text-slate-500 font-bold text-sm">{t(language, 'statusPending')}...</div>
          )}
          {status === 'PAID' && user.id === order.buyerId && (
            <div className="text-center text-blue-500 font-bold text-sm animate-pulse">{t(language, 'confirmRec')}...</div>
          )}
        </div>

      </div>
    </>
  );
}
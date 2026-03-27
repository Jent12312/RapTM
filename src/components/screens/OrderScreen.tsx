'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, MessageCircle, ShieldCheck, Clock, MapPin, CheckCircle2, Smile, Meh, Frown, AlertTriangle, Gavel } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import ChatScreen from './ChatScreen';

interface Props {
  order: any;
  onClose: () => void;
}

export default function OrderScreen({ order: initialOrder, onClose }: Props) {
  const { user, language } = useAppStore();
  const [order, setOrder] = useState(initialOrder);
  const [status, setStatus] = useState(initialOrder.status);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // ИЩЕМ ТОЛЬКО МОЙ ОТЗЫВ В МАССИВЕ REVIEWS
  const myReview = initialOrder.reviews?.find((r: any) => r.authorId === user.id);
  const [hasReviewed, setHasReviewed] = useState(!!myReview);
  const [selectedRating, setSelectedRating] = useState<string | null>(myReview?.rating || null);

  // РОЛИ ТЕПЕРЬ ЖЕЛЕЗОБЕТОННЫЕ:
  const isBuyer = user.id === order.buyerId; // Тот кто ПОЛУЧАЕТ крипту
  const isSeller = user.id === order.sellerId; // Тот кто ОТДАЕТ крипту
  
  const partnerName = isBuyer ? order.seller.firstName : order.buyer.firstName;
  const partnerId = isBuyer ? order.sellerId : order.buyerId;

  useEffect(() => {
    if (status === 'COMPLETED' && hasReviewed) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`);
        const freshOrder = await res.json();
        
        // Проверяем изменения статуса или флага спора
        if (freshOrder.status !== status || freshOrder.isDisputed !== order.isDisputed) {
          setStatus(freshOrder.status);
          setOrder(freshOrder);
        }
        
        // Проверяем наличие МОЕГО нового отзыва
        if (freshOrder.reviews) {
           const newMyReview = freshOrder.reviews.find((r: any) => r.authorId === user.id);
           if (newMyReview && !hasReviewed) {
             setHasReviewed(true);
             setSelectedRating(newMyReview.rating);
           }
        }
      } catch (e) {
        console.error('Failed to fetch order updates:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [order.id, status, hasReviewed, user.id, order.isDisputed]);

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      
      // ЗАЩИТА: Обновляем стейт ТОЛЬКО если бэкенд прислал объект ордера
      if (data.success && data.order) {
        setStatus(newStatus);
        setOrder(data.order);
        
        // Немедленно обновляем данные через 500мс для всех пользователей
        setTimeout(async () => {
          try {
            const freshRes = await fetch(`/api/orders/${order.id}`);
            const freshOrder = await freshRes.json();
            if (freshOrder.status !== status) {
              setStatus(freshOrder.status);
              setOrder(freshOrder);
            }
          } catch (e) {
            console.error('Failed to refresh order data:', e);
          }
        }, 500);
      } else {
        alert('Ошибка: Сервер не вернул данные ордера');
      }
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

  const handleDispute = async () => {
    if (!confirm('Вы уверены, что хотите вызвать арбитра? Сделка будет заморожена до решения спора.')) return;

    try {
      const res = await fetch(`/api/orders/${order.id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        alert('Апелляция отправлена! Админ будет уведомлен.');
        // Обновляем статус локально
        setOrder({ ...order, isDisputed: true });
        setStatus('DISPUTED');
        
        // Немедленно обновляем данные через 500мс для всех пользователей
        setTimeout(async () => {
          try {
            const freshRes = await fetch(`/api/orders/${order.id}`);
            const freshOrder = await freshRes.json();
            if (freshOrder.isDisputed !== order.isDisputed) {
              setOrder(freshOrder);
            }
          } catch (e) {
            console.error('Failed to refresh order data:', e);
          }
        }, 500);
      } else {
        alert('Ошибка при отправке апелляции');
      }
    } catch (e) {
      alert('Ошибка при отправке апелляции');
    }
  };

  // Проверяем, можно ли показать кнопку апелляции (через 10 минут после PAID)
  const canShowDisputeButton = () => {
    if (status !== 'PAID') return false;
    
    const paidTime = new Date(order.updatedAt);
    const oneMinuteLater = new Date(paidTime.getTime() + 1 * 60 * 1000); // Изменено с 10 минут на 1 минуту
    const now = new Date();
    
    return now >= oneMinuteLater;
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

          {/* Проверка на замороженную сделку - показываем только если статус не COMPLETED и не CANCELLED */}
          {order.isDisputed && !['COMPLETED', 'CANCELLED'].includes(status) && (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="font-bold text-red-600">Сделка заморожена админом</p>
              <p className="text-xs text-red-400 mt-1">Ожидайте решения арбитража</p>
            </div>
          )}

          {/* Главный блок Статуса */}
          <div className={`p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 text-center transition-all ${status === 'COMPLETED' ? 'bg-gradient-to-b from-emerald-50 to-white' : 'bg-white'}`}>

            {status === 'PENDING' && (
              <>
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
                  <Clock className="w-4 h-4" /> {isBuyer ? 'Оплатите продавцу' : 'Ожидайте оплату'}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  {isBuyer ? `Переведите ${order.amountFiat} ${order.ad.fiat}` : `Вам переведут ${order.amountFiat} ${order.ad.fiat}`}
                </h3>
                <p className="text-sm text-slate-500 font-medium">Свяжитесь в чате для передачи наличных</p>
              </>
            )}

            {status === 'PAID' && (
              <>
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold mb-4 animate-pulse">
                  Оплата подтверждена
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Ожидание перевода крипты</h3>
                <p className="text-sm text-slate-500 font-medium">
                  {isBuyer ? 'Продавец проверяет получение средств...' : 'Подтвердите получение денег, чтобы отправить крипту.'}
                </p>
              </>
            )}

            {status === 'COMPLETED' && (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{t(language, 'statusCompleted')}</h3>
                
                {/* ИСПРАВЛЕНИЕ ЛОГИКИ + и - */}
                <p className={`text-sm font-bold mb-6 ${isBuyer ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isBuyer ? '+' : '-'}{order.amountAsset} {order.ad.asset} {isBuyer ? 'зачислено на кошелек' : 'списано с кошелька'}
                </p>
                
                <div className="border-t border-slate-100 pt-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    {t(language, 'reviewTitle')} {partnerName}
                  </p>

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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {isBuyer ? 'Вы платите' : 'Вам заплатят'}
                </span>
                <span className="text-lg font-black text-slate-800">{order.amountFiat} {order.ad.fiat}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {isBuyer ? 'Вы получаете' : 'Вы отдаете'}
                </span>
                <span className="text-lg font-black text-emerald-600">{order.amountAsset} {order.ad.asset}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Город встречи</span>
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-emerald-500" /> {order.ad.city}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки действий снизу */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
          
          {/* Блокировка кнопок при споре */}
          {order.isDisputed && (
            <div className="text-center text-red-500 font-bold text-sm mb-4">
              ⚠️ Сделка заморожена. Действия заблокированы.
            </div>
          )}

          {status === 'PENDING' && isBuyer && !order.isDisputed && (
            <div className="flex gap-3">
              <button className="flex-1 py-4 text-slate-400 font-bold text-sm uppercase bg-slate-50 rounded-2xl active:scale-95">{t(language, 'cancel')}</button>
              <button onClick={() => updateOrderStatus('PAID')} className="flex-[2] bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all uppercase tracking-wide">
                {t(language, 'iPay')}
              </button>
            </div>
          )}

          {status === 'PAID' && !isBuyer && !order.isDisputed && (
            <button onClick={() => updateOrderStatus('COMPLETED')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all uppercase tracking-wide">
              {t(language, 'confirmRec')}
            </button>
          )}

          {status === 'COMPLETED' && (
            <button onClick={onClose} className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl active:scale-95 transition-all uppercase tracking-wide">
              {t(language, 'returnToWallet')}
            </button>
          )}

          {/* Кнопка апелляции появляется через 10 минут после PAID */}
          {status === 'PAID' && canShowDisputeButton() && !order.isDisputed && (
            <button
              onClick={handleDispute}
              className="w-full bg-amber-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-200 active:scale-95 transition-all uppercase tracking-wide mb-3"
            >
              <Gavel className="w-5 h-5 inline mr-2" />
              Вызвать арбитра
            </button>
          )}

          {status === 'PENDING' && !isBuyer && (
            <div className="text-center text-slate-500 font-bold text-sm">{t(language, 'statusPending')}...</div>
          )}
          {status === 'PAID' && isBuyer && !order.isDisputed && (
            <div className="text-center text-blue-500 font-bold text-sm animate-pulse">{t(language, 'confirmRec')}...</div>
          )}
        </div>

      </div>
    </>
  );
}

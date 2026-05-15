'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, MessageCircle, ShieldCheck, Clock, MapPin, CheckCircle2, Smile, Meh, Frown, AlertTriangle, Gavel, XCircle, Camera, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import ChatScreen from './ChatScreen';

interface Props {
  order: any;
  onClose: () => void;
}

export default function OrderScreen({ order: initialOrder, onClose }: Props) {
  const { user, language, addToast } = useAppStore();
  const [order, setOrder] = useState(initialOrder);
  const [status, setStatus] = useState(initialOrder.status);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // ИЩЕМ ТОЛЬКО МОЙ ОТЗЫВ В МАССИВЕ REVIEWS
  const myReview = initialOrder.reviews?.find((r: any) => r.authorId === user.id);
  const [hasReviewed, setHasReviewed] = useState(!!myReview);
  const [selectedRating, setSelectedRating] = useState<string | null>(myReview?.rating || null);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [paymentPhoto, setPaymentPhoto] = useState<File | null>(null);
  const [paymentPhotoPreview, setPaymentPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // ИСПРАВЛЕНО: РОЛИ ЖЕЛЕЗОБЕТОННЫЕ с защитой от undefined
  const actualBuyerId = order?.buyerId || order?.buyer?.id;
  const actualSellerId = order?.sellerId || order?.seller?.id;
  const isBuyer = user?.id === actualBuyerId;
  const isSeller = user?.id === actualSellerId;

  // ИСПРАВЛЕНО: Проверка, является ли метод оплаты ТОЛЬКО наличными
  const isCashOnly = order.ad?.paymentMethods?.length === 1 && order.ad.paymentMethods[0] === 'Cash';
  
  const partnerName = isBuyer 
    ? (order.seller?.nickname || order.seller?.firstName || 'User') 
    : (order.buyer?.nickname || order.buyer?.firstName || 'User');
  const partnerId = isBuyer ? order.sellerId : order.buyerId;

  useEffect(() => {
    // ИСПРАВЛЕНО: Защита от краша, если order не прогрузился
    if (!order || !order.id) return;

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const createdAt = new Date(order.createdAt).getTime();
      const limitMs = (order.ad.paymentTime || 15) * 60 * 1000;
      const now = new Date().getTime();
      const diff = Math.max(0, (createdAt + limitMs) - now);
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    const updateInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`);
        const freshOrder = await res.json();
        
        // ИСПРАВЛЕНО: Проверка на валидность пришедшего объекта
        if (res.ok && freshOrder && freshOrder.id) {
          if (freshOrder.status !== status || freshOrder.isDisputed !== order.isDisputed) {
            setStatus(freshOrder.status);
          }
          setOrder(freshOrder);
          
          if (freshOrder.reviews) {
             const newMyReview = freshOrder.reviews.find((r: any) => r.authorId === user.id);
             if (newMyReview && !hasReviewed) {
               setHasReviewed(true);
               setSelectedRating(newMyReview.rating);
             }
          }
        }
      } catch (e) {
        console.error('Failed to fetch order updates:', e);
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(updateInterval);
    };
  }, [order?.id, status, hasReviewed, user.id]);

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateOrderStatus = async (newStatus: string) => {
    // ИСПРАВЛЕНО: Не требуем фото, если это исключительно оплата наличными
    if (newStatus === 'PAID' && isBuyer && !paymentPhoto && !isCashOnly) {
      alert(t(language, 'orderAttachPhoto'));
      return;
    }

    setIsUploadingPhoto(true);
    try {
      if (newStatus === 'PAID' && paymentPhoto) {
        const formData = new FormData();
        formData.append('image', paymentPhoto);
        formData.append('senderId', user.id);
        formData.append('text', t(language, 'orderPaidMsg'));
        formData.append('isSystem', 'false');

        await fetch(`/api/orders/${order.id}/messages/upload`, {
          method: 'POST',
          body: formData
        });
      }

      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      
      if (res.ok) {
        setOrder(data.order);
        addToast(t(language, 'success'), 'success');
        setStatus(newStatus);
      } else {
        alert(data.error || t(language, 'orderUpdateError'));
      }
    } catch (e) {
      alert(t(language, 'orderUpdateError'));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLeaveReview = async (rating: 'EXCELLENT' | 'NEUTRAL' | 'BAD') => {
    if (isSubmittingReview) return;
    setIsSubmittingReview(true);
    
    try {
      const res = await fetch(`/api/orders/${order.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        addToast(t(language, 'success'), 'success');
        setComment('');
        setSelectedRating(rating);
        setHasReviewed(true);
        setOrder(data.order);
      } else {
        alert(data.error || t(language, 'orderReviewError'));
      }
    } catch (e) {
      alert(t(language, 'error'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDispute = async () => {
    if (!confirm(t(language, 'orderDisputeConfirm'))) return;

    try {
      const res = await fetch(`/api/orders/${order.id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        alert(t(language, 'orderDisputeSent'));
        setStatus('DISPUTED');
      } else {
        alert(data.error || t(language, 'orderDisputeError'));
      }
    } catch (e) {
      alert(t(language, 'orderDisputeError'));
    }
  };

  const canShowDisputeButton = () => {
    if (status !== 'PAID') return false;
    const paidTime = new Date(order.updatedAt);
    const oneMinuteLater = new Date(paidTime.getTime() + 1 * 60 * 1000);
    return new Date() >= oneMinuteLater;
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
          <button
            onClick={() => setIsChatOpen(true)}
            disabled={['COMPLETED', 'CANCELLED'].includes(status)}
            className={`p-2 rounded-full relative ${
              ['COMPLETED', 'CANCELLED'].includes(status)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-50 text-blue-500'
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            {status !== 'COMPLETED' && !['COMPLETED', 'CANCELLED'].includes(status) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>}
          </button>
        </div>

        <div className="p-5 space-y-6 pb-32">
          {order.isDisputed && !['COMPLETED', 'CANCELLED'].includes(status) && (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="font-bold text-red-600">{t(language, 'adminDisputeOpen')}</p>
              <p className="text-xs text-red-400 mt-1">{t(language, 'adminPending')}</p>
            </div>
          )}

          <div className={`p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 text-center transition-all ${status === 'COMPLETED' ? 'bg-gradient-to-b from-emerald-50 to-white' : status === 'CANCELLED' ? 'bg-gradient-to-b from-red-50 to-white' : 'bg-white'}`}>

            {status === 'PENDING' && (
              <>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 ${timeLeft < 300000 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-amber-50 text-amber-600'}`}>
                  <Clock className="w-4 h-4" /> {timeLeft > 0 ? formatTime(timeLeft) : t(language, 'statusCancelled')}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  {/* ИСПРАВЛЕНО: Четкое разделение кто сколько кому платит */}
                  {isBuyer 
                    ? `${t(language, 'adminSendAmount')} ${order.amountFiat} ${order.ad.fiat}` 
                    : `${t(language, 'adminReceiveAmount')} ${order.amountFiat} ${order.ad.fiat}`}
                </h3>
                <p className="text-sm text-slate-500 font-medium">{t(language, 'step1')}</p>
              </>
            )}

            {status === 'PAID' && (
              <>
                <div className="text-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-3xl group-hover:border-emerald-300 transition-colors">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-50 transition-colors">
                    <Camera className="w-7 h-7 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">{t(language, 'orderUploadCheck')}</p>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{t(language, 'adminPending')}</h3>
                <p className="text-sm text-slate-500 font-medium">
                  {isBuyer ? t(language, 'confirmRec') : t(language, 'iPay')}
                </p>
              </>
            )}

            {status === 'COMPLETED' && (
              <>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-6">{t(language, 'statusCompleted')}</h3>

                {/* НОВЫЙ БЛОК: Детальный чек сделки, который показывает и 59, и 50 */}
                <div className="flex flex-col gap-3 mb-8 text-left">
                  
                  {/* Блок Фиата (внешняя оплата) */}
                  <div className={`p-4 rounded-2xl border ${isBuyer ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Внешняя оплата (Наличные / Перевод)
                    </p>
                    <p className={`text-lg font-black ${isBuyer ? 'text-red-600' : 'text-emerald-600'}`}>
                      {isBuyer ? '-' : '+'}{order.amountFiat} {order.ad.fiat}
                    </p>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      {isBuyer ? 'Отправлено партнеру' : 'Получено от партнера'}
                    </p>
                  </div>

                  {/* Блок Крипты (баланс кошелька RapTM) */}
                  <div className={`p-4 rounded-2xl border ${isBuyer ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Баланс RapTM Wallet
                    </p>
                    <p className={`text-lg font-black ${isBuyer ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isBuyer ? '+' : '-'}{order.amountAsset} {order.ad.asset}
                    </p>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      {isBuyer ? t(language, 'adminCredited') : t(language, 'adminDebited')}
                    </p>
                  </div>

                </div>

                <div className="border-t border-slate-100 pt-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    {t(language, 'reviewTitle')} {partnerName}
                  </p>
                  <div className="flex justify-center gap-4">
                    <button onClick={() => handleLeaveReview('EXCELLENT')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${selectedRating === 'EXCELLENT' ? 'bg-blue-50 ring-2 ring-blue-500 scale-110' : hasReviewed ? 'opacity-30' : 'bg-slate-50'}`}>
                      <Smile className="w-8 h-8 text-blue-500" />
                      <span className="text-[10px] font-bold text-blue-600">{t(language, 'excellent')}</span>
                    </button>
                    <button onClick={() => handleLeaveReview('NEUTRAL')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${selectedRating === 'NEUTRAL' ? 'bg-slate-100 ring-2 ring-slate-400 scale-110' : hasReviewed ? 'opacity-30' : 'bg-slate-50'}`}>
                      <Meh className="w-8 h-8 text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-600">{t(language, 'neutral')}</span>
                    </button>
                    <button onClick={() => handleLeaveReview('BAD')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${selectedRating === 'BAD' ? 'bg-red-50 ring-2 ring-red-500 scale-110' : hasReviewed ? 'opacity-30' : 'bg-slate-50'}`}>
                      <Frown className="w-8 h-8 text-red-500" />
                      <span className="text-[10px] font-bold text-red-600">{t(language, 'bad')}</span>
                    </button>
                  </div>
                  {!hasReviewed && (
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="..." className="w-full mt-6 bg-slate-50 ring-1 ring-slate-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none" />
                  )}
                </div>
              </>
            )}

            {status === 'CANCELLED' && (
              <>
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <XCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{t(language, 'statusCancelled')}</h3>
                <p className={`text-sm font-bold mb-6 ${isBuyer ? 'text-red-500' : 'text-emerald-600'}`}>
                  {isBuyer ? '-' : '+'}{order.amountAsset} {order.ad.asset} {isBuyer ? t(language, 'adminNoOps') : t(language, 'adminReturn')}
                </p>
              </>
            )}
          </div>

          {status !== 'COMPLETED' && status !== 'CANCELLED' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                  {/* ИСПРАВЛЕНО: Динамический текст Отдает / Получает для фиата */}
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {isBuyer ? t(language, 'adminSendAmount') : t(language, 'adminReceiveAmount')}
                  </span>
                  <span className="text-lg font-black text-slate-800">{order.amountFiat} {order.ad.fiat}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t(language, 'meetingCity')}</span>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-emerald-500" /> {order.ad.city}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {/* ИСПРАВЛЕНО: Логика поменяна. Покупатель получает крипту (Credited), продавец отдает (Debited) */}
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {isBuyer ? t(language, 'orderCredited') : t(language, 'orderDebited')}
                  </p>
                  <p className="text-sm font-black text-slate-800">RapTM Wallet</p>
                </div>
              </div>

              {isBuyer && status === 'PENDING' && (
                <div className="bg-blue-50 p-6 rounded-[2rem] ring-1 ring-blue-100 space-y-4">
                  {order.ad.paymentMethods?.map((method: string) => (
                    <div key={method} className="bg-white p-4 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t(language, 'p2pMethod')}</p>
                      <p className="text-sm font-black text-slate-800">
                        {method === 'Cash' ? t(language, 'orderCash') : method === 'Card' ? t(language, 'orderCard') : t(language, 'orderTmcell')}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                        {method === 'Cash' ? order.ad.city : t(language, 'orderDetailsInChat')}
                      </p>
                    </div>
                  ))}
                  
                  {/* ИСПРАВЛЕНО: Прячем блок загрузки фото, если метод ТОЛЬКО наличные */}
                  {timeLeft > 0 && !isCashOnly && (
                    <div className="pt-4 border-t border-blue-200 mt-4">
                      <p className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> {t(language, 'orderAttachCheck')}
                      </p>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input 
                            type="file" 
                            id="payment-upload" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handlePhotoSelect}
                          />
                          <label 
                            htmlFor="payment-upload" 
                            className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                              paymentPhotoPreview ? 'border-emerald-500 bg-emerald-50' : 'border-blue-300 bg-white hover:border-blue-500'
                            }`}
                          >
                            {paymentPhotoPreview ? (
                              <div className="flex items-center gap-3 w-full">
                                <img src={paymentPhotoPreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                                <div className="flex-1 overflow-hidden">
                                  <p className="text-[10px] font-bold text-emerald-700 truncate">{paymentPhoto?.name}</p>
                                  <p className="text-[8px] text-emerald-500 uppercase">{t(language, 'orderClickToChange')}</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <AlertTriangle className="w-6 h-6 text-blue-400 mb-1" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">{t(language, 'orderUploadCheck')}</span>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
          {order.status === 'CANCELLED' && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-center text-xs font-black uppercase ring-1 ring-rose-100 mb-4">
              {t(language, 'orderExpiredMsg')}
            </div>
          )}

          {status === 'PENDING' && isBuyer && !order.isDisputed && (
            <div className="flex gap-3">
              <button 
                disabled={timeLeft === 0 || isUploadingPhoto}
                onClick={() => {
                  if (confirm(t(language, 'confirmCancel'))) {
                    updateOrderStatus('CANCELLED');
                  }
                }}
                className={`flex-1 py-4 font-bold text-sm uppercase rounded-2xl active:scale-95 transition-all ${
                  timeLeft === 0 ? 'bg-slate-100 text-slate-300' : 'bg-slate-50 text-slate-400'
                }`}
              >
                {t(language, 'cancel')}
              </button>
              <button 
                disabled={timeLeft === 0 || isUploadingPhoto}
                onClick={() => updateOrderStatus('PAID')} 
                className={`flex-[2] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-wide flex items-center justify-center gap-2
                  ${timeLeft === 0 ? 'bg-slate-300 shadow-none' : 'bg-emerald-600 shadow-emerald-200'}
                `}
              >
                {isUploadingPhoto ? <RefreshCw className="w-5 h-5 animate-spin" /> : t(language, 'iPay')}
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

          {status === 'CANCELLED' && (
            <button onClick={onClose} className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl active:scale-95 transition-all uppercase tracking-wide">
              {t(language, 'returnToWallet')}
            </button>
          )}

          {/* Кнопка апелляции появляется через 1 минуту после PAID и только для активных сделок */}
          {status === 'PAID' && canShowDisputeButton() && !order.isDisputed && !['COMPLETED', 'CANCELLED'].includes(status) && (
            <button
              onClick={handleDispute}
              className="w-full bg-amber-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-200 active:scale-95 transition-all uppercase tracking-wide mb-3"
            >
              <Gavel className="w-5 h-5 inline mr-2" />
              {t(language, 'adminDisputes')}
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

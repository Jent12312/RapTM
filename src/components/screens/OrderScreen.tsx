'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { 
  ChevronLeft, 
  MessageCircle, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Info,
  AlertCircle
} from 'lucide-react';
import ChatScreen from './ChatScreen';

interface Props {
  order: any;
  onClose: () => void;
}

export default function OrderScreen({ order, onClose }: Props) {
  const { user } = useAppStore();
  const [status, setStatus] = useState(order.status); // PENDING, PAID, COMPLETED
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Определяем роль текущего пользователя в этой сделке
  const isBuyer = user.id === order.buyerId;
  const partnerName = isBuyer ? order.seller.firstName : order.buyer.firstName;

  // Функция обновления статуса сделки в базе данных
  const updateOrderStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(newStatus);
      }
    } catch (error) {
      alert("Ошибка при обновлении статуса");
    }
  };

  return (
    <>
      {/* Окно Чата (выезжает поверх сделки) */}
      {isChatOpen && (
        <ChatScreen 
          orderId={order.id} 
          partnerName={partnerName} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}

      <div className="fixed inset-0 z-[150] bg-slate-50 overflow-y-auto animate-in fade-in duration-300">
        
        {/* --- ШАПКА --- */}
        <div className="bg-white px-5 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-slate-100 shadow-sm">
          <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500 active:scale-95 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Сделка #{order.id.slice(0, 8)}</h2>
            <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" /> Безопасная сделка
            </div>
          </div>

          <button 
            onClick={() => setIsChatOpen(true)}
            className="p-2.5 bg-blue-50 text-blue-600 rounded-full relative active:scale-95 transition-all shadow-sm ring-1 ring-blue-100"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
          </button>
        </div>

        <div className="p-5 space-y-6 pb-40">
          
          {/* --- КАРТОЧКА СТАТУСА --- */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 text-center relative overflow-hidden">
            {/* Фон-декор для статуса */}
            <div className={`absolute top-0 left-0 w-full h-1 ${
              status === 'PENDING' ? 'bg-amber-400' : status === 'PAID' ? 'bg-blue-500' : 'bg-emerald-500'
            }`}></div>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-5 ${
              status === 'PENDING' ? 'bg-amber-50 text-amber-600' : status === 'PAID' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Clock className="w-4 h-4" /> 
              {status === 'PENDING' ? 'Ожидание оплаты' : status === 'PAID' ? 'Оплата подтверждена' : 'Сделка завершена'}
            </div>

            <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">
              {status === 'PENDING' 
                ? (isBuyer ? `Переведите ${order.amountFiat} ${order.ad.fiat}` : `Ожидайте ${order.amountFiat} ${order.ad.fiat}`)
                : status === 'PAID' 
                ? (isBuyer ? 'Ожидайте подтверждения' : 'Подтвердите получение')
                : 'Криптовалюта зачислена'}
            </h3>
            
            <p className="text-sm text-slate-500 font-medium px-4 leading-relaxed">
              {status === 'PENDING' 
                ? 'Свяжитесь с партнером в чате, чтобы договориться о встрече и передаче наличных.'
                : status === 'PAID'
                ? 'Покупатель подтвердил отправку денег. Проверьте баланс перед завершением.'
                : 'Спасибо за сделку! Оставьте отзыв партнеру.'}
            </p>
          </div>

          {/* --- ДЕТАЛИ ПЛАТЕЖА --- */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Сумма Фиата</span>
              <span className="text-xl font-black text-slate-800 tracking-tight">{order.amountFiat.toLocaleString()} {order.ad.fiat}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Кол-во Актива</span>
              <span className="text-xl font-black text-emerald-600 tracking-tight">{order.amountAsset} {order.ad.asset}</span>
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Город / Метод</span>
              <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl">
                <MapPin className="w-4 h-4 text-emerald-500" /> {order.ad.city} (Наличные)
              </span>
            </div>
          </div>

          {/* --- ПРЕДУПРЕЖДЕНИЕ --- */}
          <div className={`p-5 rounded-[2rem] flex gap-4 ${isBuyer ? 'bg-blue-50 ring-1 ring-blue-100' : 'bg-red-50 ring-1 ring-red-100'}`}>
            <AlertCircle className={`w-6 h-6 shrink-0 ${isBuyer ? 'text-blue-500' : 'text-red-500'}`} />
            <div>
              <h4 className={`text-sm font-bold mb-1 ${isBuyer ? 'text-blue-800' : 'text-red-800'}`}>
                {isBuyer ? 'Совет покупателю' : 'Важное правило'}
              </h4>
              <p className={`text-[11px] font-medium leading-relaxed opacity-80 ${isBuyer ? 'text-blue-700' : 'text-red-700'}`}>
                {isBuyer 
                  ? 'После передачи денег обязательно нажмите кнопку "Я оплатил", иначе сделка отменится по таймеру.' 
                  : 'Никогда не нажимайте "Подтвердить получение", пока не пересчитаете наличные деньги в руках!'}
              </p>
            </div>
          </div>

        </div>

        {/* --- ФИКСИРОВАННАЯ ПАНЕЛЬ КНОПОК --- */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-2xl z-20">
          <div className="max-w-md mx-auto">
            {status === 'PENDING' && isBuyer && (
              <div className="flex gap-4">
                <button className="flex-1 py-4 text-slate-400 font-bold text-xs uppercase tracking-widest active:bg-slate-50 rounded-2xl transition-all">Отменить</button>
                <button 
                  onClick={() => updateOrderStatus('PAID')}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-all uppercase tracking-widest text-sm"
                >
                  Я оплатил
                </button>
              </div>
            )}

            {status === 'PAID' && !isBuyer && (
              <button 
                onClick={() => updateOrderStatus('COMPLETED')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-100 active:scale-95 transition-all uppercase tracking-[0.1em] text-sm"
              >
                Подтвердить получение денег
              </button>
            )}

            {status === 'PAID' && isBuyer && (
              <div className="text-center py-2 text-slate-500 font-bold flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
                   <Clock className="w-6 h-6" />
                </div>
                Ожидаем подтверждения от продавца
              </div>
            )}

            {status === 'COMPLETED' && (
              <div className="text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Сделка завершена успешно!</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1">Криптовалюта зачислена на кошелек покупателя.</p>
                </div>
                <button 
                  className="mt-2 w-full py-4 border-2 border-emerald-500 text-emerald-600 rounded-2xl font-bold uppercase text-[10px] tracking-widest active:bg-emerald-50 transition-all"
                >
                  Оставить отзыв
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
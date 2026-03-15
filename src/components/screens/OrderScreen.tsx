'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ChevronLeft, MessageCircle, ShieldCheck, Clock, MapPin, CheckCircle2, Info, ArrowRightLeft } from 'lucide-react';

interface Props {
  order: any;
  onClose: () => void;
}

export default function OrderScreen({ order, onClose }: Props) {
  const { user } = useAppStore();
  const [status, setStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);

  // Функция обновления статуса сделки через API
  const updateOrderStatus = async (newStatus: string) => {
    setIsUpdating(true);
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
      alert("Ошибка сети");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-50 overflow-y-auto animate-in fade-in duration-300">
      {/* Шапка */}
      <div className="bg-white px-5 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500 active:scale-95">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Сделка #{order.id.slice(0, 8)}</h2>
          <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> Безопасная
          </div>
        </div>
        <button className="p-2 bg-slate-50 rounded-full text-blue-500 relative">
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="p-5 space-y-6 pb-32">
        {/* Статус сделки */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
            <Clock className="w-4 h-4" /> Статус: {status}
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">
            {status === 'PENDING' ? `Ожидаем оплату от покупателя` : status === 'PAID' ? 'Оплата получена? Проверьте!' : 'Сделка завершена'}
          </h3>
        </div>

        {/* Детали */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Сумма к оплате</span>
            <span className="text-lg font-black text-slate-800">{order.amountFiat} {order.ad.fiat}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Крипта</span>
            <span className="text-lg font-black text-emerald-600">{order.amountAsset} {order.ad.asset}</span>
          </div>
        </div>

        {/* Инструкции */}
        <div className="bg-blue-50 p-6 rounded-[2rem] ring-1 ring-blue-100">
          <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> Инструкция
          </h4>
          <p className="text-xs text-blue-700 font-medium">
            {user.id === order.buyerId 
              ? "Передайте наличные продавцу лично. После этого нажмите 'Я оплатил'." 
              : "Дождитесь получения наличных от покупателя. Только после этого подтверждайте сделку."}
          </p>
        </div>
      </div>

      {/* Футер с кнопками */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-lg">
        {/* Кнопка Покупателя */}
        {status === 'PENDING' && user.id === order.buyerId && (
          <button 
            onClick={() => updateOrderStatus('PAID')}
            disabled={isUpdating}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all"
          >
            {isUpdating ? 'Отправка...' : 'Я оплатил'}
          </button>
        )}

        {/* Кнопка Продавца */}
        {status === 'PAID' && user.id === order.sellerId && (
          <button 
            onClick={() => updateOrderStatus('COMPLETED')}
            disabled={isUpdating}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all"
          >
            {isUpdating ? 'Подтверждение...' : 'Подтвердить получение денег'}
          </button>
        )}

        {/* Статус завершения */}
        {status === 'COMPLETED' && (
          <div className="text-center text-emerald-600 font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> Сделка завершена
          </div>
        )}
      </div>
    </div>
  );
}
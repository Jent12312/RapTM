'use client';

import { useState } from 'react';
import { ChevronLeft, MessageCircle, ShieldCheck, Clock, MapPin, CheckCircle2 } from 'lucide-react';

interface Props {
  order: any;
  onClose: () => void;
}

export default function OrderScreen({ order, onClose }: Props) {
  const [status, setStatus] = useState(order.status); // PENDING, PAID, COMPLETED

  return (
    <div className="fixed inset-0 z-[150] bg-slate-50 overflow-y-auto animate-in fade-in duration-300">
      {/* Шапка */}
      <div className="bg-white px-5 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Сделка #{order.id.slice(0,8)}</h2>
          <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" /> Безопасная сделка
          </div>
        </div>
        <button className="p-2 bg-slate-50 rounded-full text-blue-500 relative">
          <MessageCircle className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
      </div>

      <div className="p-5 space-y-6 pb-32">
        {/* Статус и Таймер */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
            <Clock className="w-4 h-4" /> {status === 'PENDING' ? 'Ожидание оплаты: 14:59' : 'Подтверждение'}
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">
            {status === 'PENDING' ? `Переведите ${order.amountFiat} ${order.ad.fiat}` : 'Оплата подтверждена'}
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Свяжитесь с продавцом для передачи наличных
          </p>
        </div>

        {/* Детали платежа */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Сумма к оплате</span>
            <span className="text-lg font-black text-slate-800">{order.amountFiat} {order.ad.fiat}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-slate-50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Вы получаете</span>
            <span className="text-lg font-black text-emerald-600">{order.amountAsset} {order.ad.asset}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Город встречи</span>
            <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-emerald-500" /> {order.ad.city}
            </span>
          </div>
        </div>

        {/* Инструкция */}
        <div className="bg-blue-50 p-6 rounded-[2rem] ring-1 ring-blue-100">
          <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> Что нужно сделать?
          </h4>
          <ul className="text-xs text-blue-700 font-medium space-y-2 opacity-90">
            <li>1. Напишите продавцу в чат, чтобы договориться о встрече.</li>
            <li>2. После передачи наличных нажмите кнопку "Я оплатил".</li>
            <li>3. Продавец подтвердит получение и монеты придут вам.</li>
          </ul>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-lg">
        {status === 'PENDING' ? (
          <div className="flex gap-3">
            <button className="flex-1 py-4 text-slate-400 font-bold text-sm uppercase">Отменить</button>
            <button 
              onClick={() => setStatus('PAID')}
              className="flex-[2] bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all uppercase tracking-wide"
            >
              Я оплатил
            </button>
          </div>
        ) : (
          <div className="text-center text-emerald-600 font-bold flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            Ожидаем подтверждения от продавца...
          </div>
        )}
      </div>
    </div>
  );
}

// Вспомогательный компонент Info
function Info(props: any) {
  return <CheckCircle2 {...props} />
}
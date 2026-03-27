'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminScreen({ onClose }: { onClose: () => void }) {
  const [disputes, setDisputes] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/disputes')
      .then(res => res.json())
      .then(data => setDisputes(data));
  }, []);

  const resolveDispute = async (orderId: string, resolution: 'COMPLETED' | 'CANCELLED') => {
    if (!confirm(`Вы уверены, что хотите установить статус ${resolution}?`)) return;

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: resolution, isDisputed: false }) // снимаем флаг спора
      });
      setDisputes(disputes.filter(d => d.id !== orderId));
      alert("Спор разрешен!");
    } catch (e) {
      alert("Ошибка");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-red-600 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Арбитраж P2P
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Панель Администратора</p>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {disputes.length === 0 ? (
          <div className="text-center text-slate-400 py-10 font-bold">Нет активных споров 🎉</div>
        ) : (
          disputes.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-red-100 border-t-4 border-red-500">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-400">ID: #{order.id.slice(0, 8)}</span>
                <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-600 rounded-lg">Спор открыт</span>
              </div>
              
              <div className="space-y-2 mb-6 bg-slate-50 p-3 rounded-xl text-sm">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Сумма:</span>
                  <span className="font-bold text-slate-800">{order.amountAsset} {order.ad.asset}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Покупатель:</span>
                  <span className="font-bold text-blue-600">{order.buyer.firstName}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Продавец:</span>
                  <span className="font-bold text-emerald-600">{order.seller.firstName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => resolveDispute(order.id, 'CANCELLED')}
                  className="flex flex-col items-center gap-1 p-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs active:scale-95 transition-all"
                >
                  <XCircle className="w-5 h-5" /> Отменить сделку
                </button>
                <button 
                  onClick={() => resolveDispute(order.id, 'COMPLETED')}
                  className="flex flex-col items-center gap-1 p-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" /> Завершить сделку
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { ChevronLeft, ArrowRightLeft } from 'lucide-react';
import OrderScreen from './OrderScreen';

export default function MyOrdersScreen({ onClose }: { onClose: () => void }) {
  const { user, language } = useAppStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/orders?userId=${user.id}`)
      .then(res => res.json())
      .then(data => setOrders(data));
  }, [user.id]);

  if (selectedOrder) {
    return <OrderScreen order={selectedOrder} onClose={() => setSelectedOrder(null)} />;
  }

  return (
    <div className="fixed inset-0 z-[120] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="bg-white px-5 py-4 flex items-center gap-3 border-b border-slate-100 sticky top-0">
        <button onClick={onClose} className="p-2 bg-slate-50 rounded-full"><ChevronLeft /></button>
        <h2 className="font-bold">{t(language, 'myOrders')}</h2>
      </div>

      <div className="p-5 space-y-4">
        {orders.map(order => (
          <button 
            key={order.id} 
            onClick={() => setSelectedOrder(order)}
            className="w-full bg-white p-5 rounded-3xl ring-1 ring-slate-200 shadow-sm flex justify-between items-center text-left hover:shadow-md transition-all active:scale-95"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                  order.buyerId === user.id ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {order.buyerId === user.id ? 'Покупка' : 'Продажа'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {order.status}
                </span>
              </div>
              <div className="text-xl font-black text-slate-800 tracking-tight">
                {order.amountAsset} <span className="text-sm font-bold text-slate-500">{order.ad.asset}</span>
              </div>
              <div className="text-xs font-bold text-slate-500 mt-1">
                За {order.amountFiat} {order.ad.fiat}
              </div>
            </div>
            <ArrowRightLeft className="w-6 h-6 text-slate-300" />
          </button>
        ))}
      </div>
    </div>
  );
}
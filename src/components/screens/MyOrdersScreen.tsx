'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ChevronLeft, ArrowRightLeft } from 'lucide-react';
import OrderScreen from './OrderScreen';

export default function MyOrdersScreen({ onClose }: { onClose: () => void }) {
  const { user } = useAppStore();
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
        <h2 className="font-bold">Мои сделки</h2>
      </div>
      
      <div className="p-5 space-y-4">
        {orders.map(order => (
          <button 
            key={order.id} 
            onClick={() => setSelectedOrder(order)}
            className="w-full bg-white p-5 rounded-3xl ring-1 ring-slate-100 flex justify-between items-center text-left"
          >
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {order.buyerId === user.id ? 'Покупка' : 'Продажа'} • {order.status}
              </div>
              <div className="font-bold text-slate-800">{order.amountAsset} {order.ad.asset}</div>
              <div className="text-xs text-slate-500">{order.amountFiat} {order.ad.fiat}</div>
            </div>
            <ArrowRightLeft className="w-5 h-5 text-slate-300" />
          </button>
        ))}
      </div>
    </div>
  );
}
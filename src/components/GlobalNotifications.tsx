// src/components/GlobalNotifications.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function GlobalNotifications() {
  const { toasts, removeToast, user, addToast } = useAppStore();
  const [knownOrderIds, setKnownOrderIds] = useState<Set<string>>(new Set());

  // Фоновый слушатель новых сделок
  useEffect(() => {
    if (!user?.id) return;

    const checkForNewOrders = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${user.id}`);
        if (!res.ok) return;
        const orders = await res.json();
        
        const currentOrderIds = new Set<string>();
        let hasNewOrder = false;
        let newOrderAmount = 0;

        orders.forEach((order: any) => {
          currentOrderIds.add(order.id);
          // Если ордер в статусе PENDING, мы его еще не знали, и мы в нем участвуем
          if (order.status === 'PENDING' && !knownOrderIds.has(order.id) && knownOrderIds.size > 0) {
            hasNewOrder = true;
            newOrderAmount = order.amountAsset;
          }
        });

        if (hasNewOrder) {
          addToast(`У вас новая сделка на ${newOrderAmount} USDT!`, 'success');
        }

        setKnownOrderIds(currentOrderIds);
      } catch (error) {
        console.error("Failed to fetch orders for notifications");
      }
    };

    // Первый запуск для инициализации известных ID
    if (knownOrderIds.size === 0) {
      checkForNewOrders();
    }

    // Проверяем каждые 10 секунд
    const interval = setInterval(checkForNewOrders, 10000);
    return () => clearInterval(interval);
  }, [user?.id, knownOrderIds]);

  return (
    <div className="fixed top-4 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`flex items-center gap-3 w-full max-w-sm px-4 py-3 rounded-2xl shadow-lg pointer-events-auto transition-all animate-in slide-in-from-top-5 fade-in duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 
            toast.type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {toast.type === 'info' && <Info className="w-5 h-5" />}
          
          <span className="flex-1 text-sm font-bold">{toast.message}</span>
          
          <button onClick={() => removeToast(toast.id)} className="p-1 bg-white/20 rounded-full active:scale-95">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
// src/components/GlobalNotifications.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function GlobalNotifications() {
  const { toasts, removeToast, user, addToast } = useAppStore();
  const [knownOrderIds, setKnownOrderIds] = useState<Set<string>>(new Set());

  // Фоновый слушатель новых сделок
  const [knownOrders, setKnownOrders] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.id) return;

    const checkForNewOrders = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${user.id}`);
        if (!res.ok) return;
        const orders = await res.json();
        
        const newKnown = { ...knownOrders };
        const isFirstLoad = Object.keys(knownOrders).length === 0;

        orders.forEach((order: any) => {
          const prevStatus = knownOrders[order.id];

          // Если это совершенно новая сделка (и мы уже прогрузили первичный список)
          if (!prevStatus && !isFirstLoad) {
            // Уведомляем о "Новой сделке" ТОЛЬКО Мейкера (создателя объявления)
            if (order.ad.userId === user.id) {
              addToast(`У вас новая сделка на ${order.amountAsset} ${order.ad.asset}!`, 'success');
            }
          } 
          // Если сделка уже была, но у неё изменился статус
          else if (prevStatus && prevStatus !== order.status) {
            if (order.status === 'PAID' && order.sellerId === user.id) {
              addToast('Покупатель подтвердил оплату! Проверьте баланс карты.', 'info');
            }
            if (order.status === 'COMPLETED') {
              addToast(`Сделка #${order.id.slice(0,4)} успешно завершена`, 'success');
            }
          }

          // Обновляем статус в нашем словаре
          newKnown[order.id] = order.status;
        });

        setKnownOrders(newKnown);
      } catch (error) {
        console.error("Notifications fetch error", error);
      }
    };

    if (Object.keys(knownOrders).length === 0) checkForNewOrders();
    const interval = setInterval(checkForNewOrders, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { ChevronLeft, ArrowRightLeft, Filter, X } from 'lucide-react';
import OrderScreen from './OrderScreen';

export default function MyOrdersScreen({ onClose }: { onClose: () => void }) {
  const { user, language } = useAppStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    // 1. Защита от неавторизованного пользователя (чтобы не было краша при user.id)
    if (!user || !user.id) return;

    fetch(`/api/orders?userId=${user.id}`)
      .then(res => {
        if (!res.ok) throw new Error(t(language, 'networkError'));
        return res.json();
      })
      .then(data => {
        // 2. Умное извлечение массива, как мы это делали в useAppStore
        const ordersArray = Array.isArray(data) ? data : (data?.orders || data?.data || []);
        setOrders(ordersArray);
      })
      .catch(err => {
        console.error('Ошибка загрузки ордеров:', err);
        // При ошибке ставим пустой массив, чтобы приложение не упало
        setOrders([]);
      });
  }, [user?.id]); // Безопасная зависимость

  // 3. Дополнительная защита: убеждаемся, что orders — 100% массив перед вызовом .filter()
  const safeOrders = Array.isArray(orders) ? orders : [];

  const filteredOrders = safeOrders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    // Обязательно проверяем наличие user перед сравнением id
    if (filterType !== 'all' && user && order.buyerId !== user.id && filterType === 'buy') return false;
    if (filterType !== 'all' && user && order.sellerId !== user.id && filterType === 'sell') return false;
    return true;
  });

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterType('all');
  };

  if (selectedOrder) {
    return <OrderScreen order={selectedOrder} onClose={() => setSelectedOrder(null)} />;
  }

  return (
    <div className="fixed inset-0 z-[120] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="bg-white px-5 py-4 flex items-center gap-3 border-b border-slate-100 sticky top-0">
        <button onClick={onClose} className="p-2 bg-slate-50 rounded-full"><ChevronLeft /></button>
        <h2 className="font-bold">{t(language, 'myOrders')}</h2>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`p-2 rounded-full transition-all ${showFilter || filterStatus !== 'all' || filterType !== 'all' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
          {(filterStatus !== 'all' || filterType !== 'all') && (
            <button onClick={clearFilters} className="p-2 bg-red-50 text-red-500 rounded-full">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Панель фильтров */}
      {showFilter && (
        <div className="bg-white border-b border-slate-100 p-4 space-y-3 animate-in slide-in-from-top duration-300">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{t(language, 'statusLabel')}</label>
            <div className="flex gap-2 flex-wrap">
              {['all', 'PENDING', 'PAID', 'COMPLETED', 'CANCELLED'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === status
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'all' ? t(language, 'all') : status}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{t(language, 'typeLabel')}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t(language, 'all')}
              </button>
              <button
                onClick={() => setFilterType('buy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'buy' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t(language, 'buy')}
              </button>
              <button
                onClick={() => setFilterType('sell')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === 'sell' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t(language, 'sell')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center text-slate-400 font-medium text-sm mt-10">
            {t(language, 'noOrders')}
          </div>
        ) : (
          filteredOrders.map(order => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full bg-white p-5 rounded-3xl ring-1 ring-slate-200 shadow-sm flex justify-between items-center text-left hover:shadow-md transition-all active:scale-95"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                    user && order.buyerId === user.id ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user && order.buyerId === user.id ? t(language, 'buy') : t(language, 'sell')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {order.status}
                  </span>
                </div>
                <div className="text-xl font-black text-slate-800 tracking-tight">
                  {order.amountAsset} <span className="text-sm font-bold text-slate-500">{order.ad?.asset || ''}</span>
                </div>
                <div className="text-xs font-bold text-slate-500 mt-1">
                  {t(language, 'p2pReceiveAmount')} {order.amountFiat} {order.ad?.fiat || ''}
                </div>
              </div>
              <ArrowRightLeft className="w-6 h-6 text-slate-300" />
            </button>
          ))
        )}
      </div>
    </div>
  );
  }

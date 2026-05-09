'use client';

import { useAppStore } from '@/store/useAppStore';
import { Header, BottomNav } from '@/components/LayoutElements';
import WalletScreen from '@/components/screens/WalletScreen';
import P2PScreen from '@/components/screens/P2PScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import MerchantProfileModal from '@/components/screens/MerchantProfileModal';
import OrderScreen from '@/components/screens/OrderScreen';
import { useEffect, useState } from 'react';
import ExchangeScreen from '@/components/screens/ExchangeScreen';

export default function Home() {
  const { activeTab, initUser, user } = useAppStore();

  // Стейт для продавца, если мы пришли по ссылке-поделиться
  const [deepLinkMerchant, setDeepLinkMerchant] = useState<any>(null);
  // Стейт для заказа, если пришли по ссылке на сделку
  const [deepLinkOrder, setDeepLinkOrder] = useState<any>(null);
  // Стейт для прямого перехода на экран (wallet, p2p, profile, my_orders и т.д.)
  const [deepLinkScreen, setDeepLinkScreen] = useState<string | null>(null);

  useEffect(() => {
    import('@twa-dev/sdk').then((module) => {
      const WebApp = module.default;
      WebApp.ready();

      if (WebApp.initData) {
        initUser(WebApp.initData);
      }

      // ЛОВИМ DEEP LINK (ссылку "Поделиться" или уведомление)
      const startParam = WebApp.initDataUnsafe?.start_param;
      
      if (startParam) {
        // 1. Профиль пользователя (share)
        if (startParam.startsWith('user_')) {
          const targetUserId = startParam.replace('user_', '');
          fetch(`/api/user/${targetUserId}`)
            .then(res => res.json())
            .then(data => {
              if (data.user) setDeepLinkMerchant(data.user);
            });
        }
        // 2. Заказ (уведомление о сделке)
        else if (startParam.startsWith('order_')) {
          const orderId = startParam.replace('order_', '');
          fetch(`/api/orders/${orderId}`)
            .then(res => res.json())
            .then(data => {
              if (data) setDeepLinkOrder(data);
            });
        }
        // 3. Прямой переход на экран
        else if (['wallet', 'p2p', 'profile', 'my_orders', 'my_ads', 'create_ad', 'kyc'].includes(startParam)) {
          setDeepLinkScreen(startParam);
        }
      }
    });
  }, [initUser]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-200"></div>
          <p className="text-emerald-600 font-bold italic tracking-widest animate-bounce">RAPIRA TM</p>
        </div>
      </div>
    );
  }

  // ЕСЛИ ПРИШЛИ ПО ССЫЛКЕ НА СДЕЛКУ - СРАЗУ ПОКАЗЫВАЕМ OrderScreen
  if (deepLinkOrder) {
    return (
      <OrderScreen 
        order={deepLinkOrder} 
        onClose={() => setDeepLinkOrder(null)} 
      />
    );
  }

  return (
    <main className="min-h-screen relative bg-slate-50">
      <Header />

      {/* ЕСЛИ ПРИШЛИ ПО ССЫЛКЕ - СРАЗУ ПОКАЗЫВАЕМ ПРОФИЛЬ ПРОДАВЦА поверх всего */}
      {deepLinkMerchant && (
        <MerchantProfileModal
          merchant={deepLinkMerchant}
          onClose={() => setDeepLinkMerchant(null)}
        />
      )}

      <div className="w-full max-w-md mx-auto">
        {activeTab === 'wallet' && <WalletScreen />}
        {activeTab === 'p2p' && <P2PScreen />}
        {activeTab === 'exchange' && <ExchangeScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </div>
      <BottomNav />
    </main>
  );
}
'use client';

import { useAppStore } from '@/store/useAppStore';
import { Header, BottomNav } from '@/components/LayoutElements';
import WalletScreen from '@/components/screens/WalletScreen';
import P2PScreen from '@/components/screens/P2PScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import MerchantProfileModal from '@/components/screens/MerchantProfileModal'; // <-- Добавили импорт
import { useEffect, useState } from 'react';

export default function Home() {
  const { activeTab, initUser, user } = useAppStore();
  
  // Стейт для продавца, если мы пришли по ссылке-поделиться
  const [deepLinkMerchant, setDeepLinkMerchant] = useState<any>(null);

  useEffect(() => {
    import('@twa-dev/sdk').then((module) => {
      const WebApp = module.default;
      WebApp.ready();
      
      if (WebApp.initDataUnsafe?.user) {
        initUser(WebApp.initDataUnsafe.user);
      }

      // ЛОВИМ DEEP LINK (ссылку "Поделиться")
      const startParam = WebApp.initDataUnsafe?.start_param; // Приходит из ?startapp=...
      if (startParam && startParam.startsWith('user_')) {
        const targetUserId = startParam.replace('user_', '');
        
        // Делаем запрос в базу, чтобы получить данные этого продавца
        fetch(`/api/user/${targetUserId}`)
          .then(res => res.json())
          .then(data => {
            if (data.user) setDeepLinkMerchant(data.user);
          });
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
        {activeTab === 'exchange' && (
          <div className="flex flex-col items-center justify-center pt-32 px-6 text-center">
            <h2 className="text-xl font-bold text-slate-800">Обмен в разработке</h2>
          </div>
        )}
        {activeTab === 'profile' && <ProfileScreen />}
      </div>
      <BottomNav />
    </main>
  );
}
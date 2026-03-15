'use client';

import { useAppStore } from '@/store/useAppStore';
import { Header, BottomNav } from '@/components/LayoutElements';
import WalletScreen from '@/components/screens/WalletScreen';
import P2PScreen from '@/components/screens/P2PScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import { useEffect } from 'react';

export default function Home() {
  const { activeTab, initUser, user } = useAppStore();

  useEffect(() => {
    import('@twa-dev/sdk').then((module) => {
      const WebApp = module.default;
      WebApp.ready();
      
      // Если данные от Телеграм есть, регистрируем/авторизуем юзера в БД
      if (WebApp.initDataUnsafe?.user) {
        initUser(WebApp.initDataUnsafe.user);
      }
    });
  }, [initUser]);

  // Пока юзер не загружен, можно показать красивый лоадер
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
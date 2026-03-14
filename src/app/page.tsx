'use client';

import { useAppStore } from '@/store/useAppStore';
import { Header, BottomNav } from '@/components/LayoutElements';
import WalletScreen from '@/components/screens/WalletScreen';
import P2PScreen from '@/components/screens/P2PScreen'; // <-- Добавили импорт
import { useEffect } from 'react';

export default function Home() {
  const { activeTab } = useAppStore();

  useEffect(() => {
    import('@twa-dev/sdk').then((module) => {
      const WebApp = module.default;
      WebApp.ready();
    });
  }, []);

  return (
    <main className="min-h-screen relative bg-slate-50">
      <Header />
      
      {/* Рендерим нужный экран в зависимости от activeTab */}
      <div className="w-full max-w-md mx-auto">
        {activeTab === 'wallet' && <WalletScreen />}
        
        {activeTab === 'p2p' && <P2PScreen />} {/* <-- Подключили экран P2P */}
        
        {activeTab === 'exchange' && (
          <div className="p-4 text-center mt-10 text-slate-400 font-bold">Экран обмена (В разработке)</div>
        )}
        
        {activeTab === 'profile' && (
          <div className="p-4 text-center mt-10 text-slate-400 font-bold">Профиль (В разработке)</div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
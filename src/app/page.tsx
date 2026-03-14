'use client';

import { useAppStore } from '@/store/useAppStore';
import { Header, BottomNav } from '@/components/LayoutElements';
import WalletScreen from '@/components/screens/WalletScreen';
import { useEffect } from 'react';

export default function Home() {
  const { activeTab } = useAppStore();

  useEffect(() => {
    // Импорт SDK для инициализации
    import('@twa-dev/sdk').then((module) => {
      const WebApp = module.default;
      WebApp.ready();
    });
  }, []);

  return (
    <main className="min-h-screen pb-24 relative bg-[#f8fafc]">
      <Header />
      
      {/* Рендерим нужный экран в зависимости от activeTab */}
      <div className="w-full max-w-md mx-auto">
        {activeTab === 'wallet' && <WalletScreen />}
        
        {activeTab === 'exchange' && (
          <div className="p-4 text-center mt-10 text-gray-500 font-bold">Экран обмена (В разработке)</div>
        )}
        
        {activeTab === 'p2p' && (
          <div className="p-4 text-center mt-10 text-emerald-600 font-bold text-xl italic">P2P Market (В разработке)</div>
        )}
        
        {activeTab === 'profile' && (
          <div className="p-4 text-center mt-10 text-gray-500 font-bold">Профиль (В разработке)</div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
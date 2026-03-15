'use client';

import { useAppStore } from '@/store/useAppStore';
import { Header, BottomNav } from '@/components/LayoutElements';
import WalletScreen from '@/components/screens/WalletScreen';
import P2PScreen from '@/components/screens/P2PScreen';
import ProfileScreen from '@/components/screens/ProfileScreen'; // <-- Импорт профиля
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
      
      <div className="w-full max-w-md mx-auto">
        {activeTab === 'wallet' && <WalletScreen />}
        
        {activeTab === 'p2p' && <P2PScreen />}
        
        {activeTab === 'exchange' && (
          <div className="flex flex-col items-center justify-center pt-32 px-6 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner">🛠</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Обмен в разработке</h2>
            <p className="text-sm text-slate-500 font-medium">Этот раздел временно недоступен по юридическим причинам. Пожалуйста, используйте P2P Маркет.</p>
          </div>
        )}
        
        {activeTab === 'profile' && <ProfileScreen />} {/* <-- Подключили */}
      </div>

      <BottomNav />
    </main>
  );
}
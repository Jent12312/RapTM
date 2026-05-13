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
import { Gift, Sparkles, PartyPopper, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const { activeTab, initUser, user, referralInfo } = useAppStore();

  // Стейт для продавца, если мы пришли по ссылке-поделиться
  const [deepLinkMerchant, setDeepLinkMerchant] = useState<any>(null);
  // Стейт для заказа, если пришли по ссылке на сделку
  const [deepLinkOrder, setDeepLinkOrder] = useState<any>(null);
  // Стейт для объявления, если пришли по ссылке на P2P объявление
  const [deepLinkAd, setDeepLinkAd] = useState<any>(null);
  // Стейт для прямого перехода на экран (wallet, p2p, profile, my_orders и т.д.)
  const [deepLinkScreen, setDeepLinkScreen] = useState<string | null>(null);
  // Стейт для модалки реферала
  const [showRefModal, setShowRefModal] = useState(false);

  useEffect(() => {
    if (referralInfo?.isNew) {
      setShowRefModal(true);
    }
  }, [referralInfo]);

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
        // 3. Объявление (share)
        else if (startParam.startsWith('ad_')) {
          const adId = startParam.replace('ad_', '');
          fetch(`/api/p2p/${adId}`)
            .then(res => res.json())
            .then(data => {
              if (data.ad) {
                setDeepLinkAd(data.ad);
                useAppStore.getState().setActiveTab('p2p');
              }
            });
        }
        // 4. Прямой переход на экран
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
          <p className="text-emerald-600 font-bold italic tracking-widest animate-bounce">RAPTM</p>
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
        {activeTab === 'p2p' && (
          <P2PScreen 
            initialAd={deepLinkAd} 
            onAdClose={() => setDeepLinkAd(null)} 
          />
        )}
        {activeTab === 'exchange' && <ExchangeScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </div>

      {/* Referral Welcome Modal */}
      {showRefModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowRefModal(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 rounded-full blur-2xl"></div>

            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-xl shadow-emerald-200 rotate-6 group">
                <Gift className="w-10 h-10 text-white animate-bounce" />
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">Добро пожаловать!</h2>
              <p className="text-sm font-bold text-slate-500 mb-6 px-4">
                Вы присоединились по приглашению <span className="text-emerald-600">@{referralInfo?.referrerName || 'друга'}</span>
              </p>

              <div className="bg-slate-50 rounded-[2rem] p-6 mb-8 ring-1 ring-slate-100">
                <div className="flex items-center gap-4 mb-4 text-left">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-500 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ваш бонус</div>
                    <div className="text-lg font-black text-slate-800">+15.00 <span className="text-sm text-slate-400">USDT</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-500 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Статус</div>
                    <div className="text-sm font-black text-slate-800">Аккаунт активирован</div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowRefModal(false)}
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Начать работу <PartyPopper className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
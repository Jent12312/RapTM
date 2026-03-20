'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import {
  ShieldAlert,
  PlusCircle,
  ListOrdered,
  ChevronRight,
  Store,
  Share,
  Smile,
  Meh,
  Frown,
  Edit2,
  Camera,
  HelpCircle,
  Trash2,
  Bell,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';

// Импортируем дочерние экраны
import CreateAdScreen from './CreateAdScreen';
import MyAdsScreen from './MyAdsScreen';
import MyOrdersScreen from './MyOrdersScreen';

export default function ProfileScreen() {
  const { user, language, initUser } = useAppStore();

  // Состояния для открытия вложенных экранов
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [isViewingMyAds, setIsViewingMyAds] = useState(false);
  const [isViewingMyOrders, setIsViewingMyOrders] = useState(false);
  
  // Статистика
  const [stats, setStats] = useState({ good: 0, neutral: 0, bad: 0, trades: 0, volume: 0 });
  
  // Редактирование
  const [isEditing, setIsEditing] = useState(false);
  const [newNick, setNewNick] = useState(user?.nickname || user?.firstName || '');

  const fetchStats = async () => {
    const res = await fetch(`/api/user/${user.id}/stats`);
    if (res.ok) setStats(await res.json());
  };

  useEffect(() => {
    fetchStats();
    // Обновляем статистику каждые 10 секунд (реальное время)
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateProfile = async () => {
    const res = await fetch(`/api/user/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: newNick })
    });
    if (res.ok) {
      setIsEditing(false);
      WebApp.HapticFeedback.notificationOccurred('success');
      initUser(WebApp.initDataUnsafe.user);
    }
  };

  // ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ЭКРАНОВ
  if (isCreatingAd) return <CreateAdScreen onClose={() => setIsCreatingAd(false)} />;
  if (isViewingMyAds) return <MyAdsScreen onClose={() => setIsViewingMyAds(false)} />;
  if (isViewingMyOrders) return <MyOrdersScreen onClose={() => setIsViewingMyOrders(false)} />;

  const displayName = user?.nickname || user?.firstName || 'User';

  return (
    <div className="px-5 py-4 space-y-6 animate-in fade-in duration-500 pb-32 overflow-x-hidden">
      
      {/* 1. Карточка Профиля */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative flex items-center gap-4 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {displayName.charAt(0)}
            </div>
            <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-xl shadow-md ring-1 ring-slate-100 text-slate-400">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <input 
                  value={newNick} 
                  onChange={(e) => setNewNick(e.target.value)}
                  className="bg-slate-50 ring-1 ring-slate-200 rounded-lg px-3 py-1 text-sm font-bold w-full outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button onClick={handleUpdateProfile} className="bg-emerald-500 text-white p-2 rounded-lg"><CheckCircle2 className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{displayName}</h2>
                <button onClick={() => setIsEditing(true)} className="text-slate-300 hover:text-emerald-500"><Edit2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {user?.telegramId}</p>
          </div>
        </div>

        {/* Сетка статистики */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-5">
          <div className="text-center">
            <div className="text-lg font-black text-slate-800">{stats.trades}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t(language, 'trades')}</div>
          </div>
          <div className="text-center border-x border-slate-50">
            <div className="text-lg font-black text-slate-800">{stats.trades > 0 ? '100%' : '0%'}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t(language, 'completion')}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-slate-800">{stats.volume.toFixed(0)}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">USDT Объем</div>
          </div>
        </div>

        {/* Смайлики */}
        <div className="mt-5 flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl ring-1 ring-inset ring-white/50">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5"><Smile className="w-4 h-4 text-emerald-500" /><span className="text-xs font-bold text-slate-700">{stats.good}</span></div>
            <div className="flex items-center gap-1.5"><Meh className="w-4 h-4 text-slate-400" /><span className="text-xs font-bold text-slate-700">{stats.neutral}</span></div>
            <div className="flex items-center gap-1.5"><Frown className="w-4 h-4 text-red-400" /><span className="text-xs font-bold text-slate-700">{stats.bad}</span></div>
          </div>
          <button onClick={() => WebApp.switchInlineQuery(`profile_${user.id}`)} className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
            {t(language, 'shareProfile')} <Share className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. P2P Центр */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">{t(language, 'merchantCenter')}</h3>
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm ring-1 ring-slate-100">
          <MenuBtn icon={Store} label={t(language, 'myAds')} color="text-blue-500" bg="bg-blue-50" onClick={() => setIsViewingMyAds(true)} />
          <MenuBtn icon={PlusCircle} label={t(language, 'createAd')} color="text-emerald-500" bg="bg-emerald-50" onClick={() => setIsCreatingAd(true)} />
          <MenuBtn icon={ListOrdered} label={t(language, 'myOrders')} color="text-amber-500" bg="bg-amber-50" onClick={() => setIsViewingMyOrders(true)} last />
        </div>
      </div>

      {/* 3. Настройки и Безопасность */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">{t(language, 'security')}</h3>
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm ring-1 ring-slate-100">
          <MenuBtn icon={Bell} label={t(language, 'notifications')} color="text-purple-500" bg="bg-purple-50" toggle />
          <MenuBtn icon={ShieldCheck} label={t(language, 'kycLabel')} color="text-emerald-600" bg="bg-emerald-50" badge={t(language, 'verified')} />
          <MenuBtn icon={HelpCircle} label={t(language, 'help')} color="text-slate-500" bg="bg-slate-100" />
          <MenuBtn icon={Trash2} label={t(language, 'deleteAccount')} color="text-red-500" bg="bg-red-50" last />
        </div>
      </div>

    </div>
  );
}

// Компонент красивой кнопки меню
function MenuBtn({ icon: Icon, label, color, bg, onClick, last, toggle, badge }: any) {
  return (
    <button onClick={onClick} className={`w-full p-5 flex justify-between items-center transition-all active:bg-slate-50 ${!last ? 'border-b border-slate-50' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-2xl ${bg} ${color}`}><Icon className="w-5 h-5" /></div>
        <span className="font-bold text-slate-700 text-sm tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">{badge}</span>}
        {toggle ? (
          <div className="w-10 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
        ) : <ChevronRight className="w-4 h-4 text-slate-300" />}
      </div>
    </button>
  );
}

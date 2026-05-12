'use client';

import { useState, useEffect, useRef } from 'react';
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
  Bell,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  X,
  Gift,
  AlertTriangle
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';

// Импортируем дочерние экраны
import CreateAdScreen from './CreateAdScreen';
import MyAdsScreen from './MyAdsScreen';
import MyOrdersScreen from './MyOrdersScreen';
import AdminScreen from './AdminScreen';
import KycScreen from './KycScreen';
import CodeScreen from './CodeScreen';
import HelpScreen from './HelpScreen';
import AddressBookScreen from './AddressBookScreen';
import SecurityScreen from './SecurityScreen';
import ApiManagementScreen from './ApiManagementScreen';
import { LogOut, Trash2, Zap, Users as UsersIcon } from 'lucide-react';
import ReferralScreen from './ReferralScreen';

// Типы для статистики
interface UserStats {
  good: number;
  neutral: number;
  bad: number;
  trades: number;
  volume: number;
}

// Типы для пропсов кнопки меню (замена any)
interface MenuBtnProps {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  color?: string;
  bg?: string;
  badge?: string;
  toggle?: boolean;
  isOn?: boolean;
  last?: boolean;
  onClick: () => void;
}

import { haptic } from '@/lib/haptic';
import PullToRefresh from '@/components/ui/PullToRefresh';

export default function ProfileScreen() {
  const { 
    user, language, setLanguage, setActiveTab, 
    initUser, logout, addToast 
  } = useAppStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    haptic.impact('heavy');
    setIsRefreshing(true);
    await initUser(WebApp.initData);
    setIsRefreshing(false);
    addToast(t(language, 'profileUpdated'), 'info');
  };

  const handleCopyId = () => {
    haptic.light();
    navigator.clipboard.writeText(user.id.toString());
    addToast(t(language, 'salmak'), 'info');
  };

  const handleAction = (tab: string) => {
    haptic.medium();
    setActiveTab(tab as any);
  };

  const StatItem = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white p-4 rounded-[2rem] border border-slate-50 shadow-sm flex flex-col items-center text-center gap-1 group active:scale-95 transition-all">
       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} mb-1 group-hover:rotate-12 transition-transform`}>
          <Icon className="w-5 h-5" />
       </div>
       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
       <span className="text-sm font-black text-slate-800">{value}</span>
    </div>
  );

  const MenuBtn = ({ icon: Icon, label, sublabel, color, bg, badge, toggle, isOn, last, onClick }: MenuBtnProps) => (
    <button
      onClick={() => { haptic.light(); onClick(); }}
      className={`w-full flex items-center justify-between p-5 bg-white active:scale-[0.98] transition-all group ${!last ? 'border-b border-slate-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${bg || 'bg-slate-50'}`}>
          <Icon className={`w-5 h-5 ${color || 'text-slate-500'}`} />
        </div>
        <div>
          <div className="text-sm font-black text-slate-800">{label}</div>
          {sublabel && <div className="text-[10px] text-slate-400 font-medium">{sublabel}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {badge && (
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            {badge}
          </span>
        )}
        {toggle ? (
          <div
            className={`w-11 h-6 rounded-full relative transition-colors ${
              isOn ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                isOn ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </div>
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
    </button>
  );

  // Состояния для открытия вложенных экранов
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [isViewingMyAds, setIsViewingMyAds] = useState(false);
  const [isViewingMyOrders, setIsViewingMyOrders] = useState(false);
  const [isViewingAdmin, setIsViewingAdmin] = useState(false);
  const [isViewingKyc, setIsViewingKyc] = useState(false);
  const [isViewingCodes, setIsViewingCodes] = useState(false);
  const [isViewingHelp, setIsViewingHelp] = useState(false);
  const [isViewingAddressBook, setIsViewingAddressBook] = useState(false);
  const [isViewingSecurity, setIsViewingSecurity] = useState(false);
  const [isViewingApi, setIsViewingApi] = useState(false);
  const [isViewingReferral, setIsViewingReferral] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Статистика
  const [stats, setStats] = useState<UserStats & { averageRating: number, positivePercent: number }>({ 
    good: 0, neutral: 0, bad: 0, trades: 0, volume: 0, averageRating: 0, positivePercent: 0 
  });
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Редактирование профиля
  const [isEditing, setIsEditing] = useState(false);
  const [newNick, setNewNick] = useState(user?.nickname || user?.firstName || '');

  // Загрузка аватара
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/user/${user.id}/stats`);
      if (res.ok) setStats(await res.json());
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchReviews = async () => {
    if (!user?.id) return;
    setIsLoadingReviews(true);
    try {
      const res = await fetch(`/api/user/${user.id}/reviews`);
      if (res.ok) setReviews(await res.json());
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReviews();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    const res = await fetch(`/api/user/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: newNick })
    });
    if (res.ok) {
      setIsEditing(false);
      WebApp.HapticFeedback.notificationOccurred('success');
      initUser(WebApp.initData);
    }
  };

  // Загрузка аватара
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      addToast(t(language, 'selectImage'), 'error');
      return;
    }

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      setAvatarPreview(reader.result as string);

      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const res = await fetch(`/api/user/${user.id}/avatar`, {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          useAppStore.setState({
            user: { ...user, avatarUrl: data.avatarUrl }
          });
          WebApp.HapticFeedback.notificationOccurred('success');
        } else {
          addToast(t(language, 'avatarUploadError'), 'error');
        }
      } catch (error) {
        addToast(t(language, 'avatarUploadError'), 'error');
      } finally {
        setIsUploadingAvatar(false);
        setAvatarPreview(null);
      }
    };
    reader.readAsDataURL(file);
  };



  // Удаление аккаунта
  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    setIsLoadingReviews(true);
    try {
      const res = await fetch(`/api/user/${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        addToast(t(language, 'accountDeleted'), 'info');
        WebApp.close();
      }
    } catch (e) {
      addToast(t(language, 'requestError'), 'error');
    } finally {
      setIsLoadingReviews(false);
      setIsDeletingAccount(false);
    }
  };

  // ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ЭКРАНОВ
  if (isCreatingAd) return <CreateAdScreen onClose={() => setIsCreatingAd(false)} />;
  if (isViewingMyAds) return <MyAdsScreen onClose={() => setIsViewingMyAds(false)} />;
  if (isViewingMyOrders) return <MyOrdersScreen onClose={() => setIsViewingMyOrders(false)} />;
  if (isViewingAdmin) return <AdminScreen onClose={() => setIsViewingAdmin(false)} />;
  if (isViewingKyc) return <KycScreen onClose={() => setIsViewingKyc(false)} />;
  if (isViewingCodes) return <CodeScreen onClose={() => setIsViewingCodes(false)} />;
  if (isViewingHelp) return <HelpScreen onClose={() => setIsViewingHelp(false)} />;
  if (isViewingAddressBook) return <AddressBookScreen onClose={() => setIsViewingAddressBook(false)} />;
  if (isViewingSecurity) return <SecurityScreen onClose={() => setIsViewingSecurity(false)} />;
  if (isViewingApi) return <ApiManagementScreen onClose={() => setIsViewingApi(false)} />;
  if (isViewingReferral) return <ReferralScreen onClose={() => setIsViewingReferral(false)} />;

  const displayName = user?.nickname || user?.firstName || 'User';

  // Вычисление процента завершённых сделок (корректное)
  const completionRate = stats.trades > 0
    ? `${Math.round(((stats.good + stats.neutral) / stats.trades) * 100)}%`
    : '0%';

  return (
    <div className="px-5 py-4 space-y-6 animate-in fade-in duration-500 pb-32 overflow-x-hidden">
      {/* 1. Карточка Профиля */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative flex items-center gap-4 mb-6">
          <div className="relative group">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarSelect}
              accept="image/*"
              className="hidden"
            />
            <button onClick={() => fileInputRef.current?.click()} className="relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-3xl object-cover shadow-lg ring-2 ring-white"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-2 ring-white">
                  {displayName.charAt(0)}
                </div>
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-xl shadow-md ring-1 ring-slate-100 text-slate-400 hover:text-emerald-500 transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  value={newNick}
                  onChange={(e) => setNewNick(e.target.value)}
                  className="bg-slate-50 ring-1 ring-slate-200 rounded-lg px-3 py-1 text-sm font-bold w-full outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                  autoFocus
                />
                <button onClick={handleUpdateProfile} className="bg-emerald-500 text-white p-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{displayName}</h2>
                <button onClick={() => setIsEditing(true)} className="text-slate-300 hover:text-emerald-500">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              ID: {user?.telegramId}
            </p>
          </div>
        </div>

        {/* Сетка статистики */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-5">
          <div className="text-center">
            <div className="text-lg font-black text-slate-800">{stats.trades}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              {t(language, 'trades')}
            </div>
          </div>
          <div className="text-center border-x border-slate-50">
            <div className="text-lg font-black text-slate-800">{completionRate}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              {t(language, 'completion')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-slate-800">{stats.volume.toFixed(0)}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              {t(language, 'profileUSDTVolume')}
            </div>
          </div>
        </div>

        {/* Смайлики */}
        <div className="mt-5 space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl ring-1 ring-inset ring-white/50">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-700">{stats.good}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Meh className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-700">{stats.neutral}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Frown className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-slate-700">{stats.bad}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md ring-1 ring-emerald-100">
                {stats.positivePercent}%
              </div>
              <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md ring-1 ring-blue-100">
                {stats.averageRating.toFixed(1)}/5.0
              </div>
            </div>
          </div>
          
          <button
            onClick={() => WebApp.switchInlineQuery(`profile_${user.id}`)}
            className="w-full text-[10px] font-bold text-emerald-600 uppercase flex items-center justify-center gap-1 py-1"
          >
            {t(language, 'shareProfile')} <Share className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Список отзывов */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">{t(language, 'lastReviews')}</h3>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {review.author.avatarUrl ? (
                      <img src={review.author.avatarUrl} className="w-6 h-6 rounded-lg object-cover" />
                    ) : (
                      <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {(review.author.nickname || review.author.firstName || '?').charAt(0)}
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-700">{review.author.nickname || review.author.firstName}</span>
                  </div>
                  <div className={`p-1 rounded-md ${
                    review.rating === 'EXCELLENT' ? 'text-emerald-500 bg-emerald-50' : 
                    review.rating === 'NEUTRAL' ? 'text-amber-500 bg-amber-50' : 'text-red-500 bg-red-50'
                  }`}>
                    {review.rating === 'EXCELLENT' ? <Smile className="w-3.5 h-3.5" /> : 
                     review.rating === 'NEUTRAL' ? <Meh className="w-3.5 h-3.5" /> : <Frown className="w-3.5 h-3.5" />}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-xs text-slate-500 leading-relaxed italic">"{review.comment}"</p>
                )}
                <p className="text-[9px] text-slate-300 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
            {reviews.length > 3 && (
              <button className="w-full text-center text-[10px] font-black text-blue-500 uppercase tracking-widest pt-2">
                {t(language, 'seeAllReviews')} ({reviews.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1.5. Уровень пользователя */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
        
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t(language, 'currentLevel')}</p>
            <div className="flex items-center gap-2">
              <h3 className={`text-2xl font-black tracking-tight ${
                user?.level === 'Partner' ? 'text-amber-400' : 
                user?.level === 'Pro' ? 'text-indigo-400' : 'text-white'
              }`}>
                {user?.level || 'Standard'}
              </h3>
              {user?.level === 'Partner' && <ShieldCheck className="w-5 h-5 text-amber-400" />}
              {user?.level === 'Pro' && <Zap className="w-5 h-5 text-indigo-400" />}
            </div>
          </div>
          
          {user?.level === 'Standard' && (
            <button
              onClick={async () => {
                const res = await fetch('/api/user/apply-pro', { method: 'POST' });
                const data = await res.json();
                if (res.ok) {
                  addToast(t(language, 'proRequestSent'), 'success');
                  WebApp.HapticFeedback.notificationOccurred('success');
                } else {
                  addToast(data.error || t(language, 'proRequestError'), 'error');
                }
              }}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-[11px] font-black text-white uppercase tracking-widest transition-all ring-1 ring-white/20 active:scale-95"
            >
              {t(language, 'becomePro')}
            </button>
          )}
        </div>

        {user?.level === 'Standard' && (
          <div className="mt-5 pt-5 border-t border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{t(language, 'proProgress')}</p>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md">Level 1</span>
            </div>
            
            <div className="space-y-3">
              {/* Trades Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">{t(language, 'trades')}: {stats.trades}/30</span>
                  <span className="text-white">{Math.min(100, Math.round((stats.trades / 30) * 100))}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${Math.min(100, (stats.trades / 30) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Volume Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-400">{t(language, 'adminVolume')}: {stats.volume.toFixed(0)}/3000 USDT</span>
                  <span className="text-white">{Math.min(100, Math.round((stats.volume / 3000) * 100))}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000"
                    style={{ width: `${Math.min(100, (Number(stats.volume) / 3000) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
               <div className={`text-[9px] font-bold flex items-center gap-1 ${stats.averageRating >= 4.8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                 <CheckCircle2 className="w-2.5 h-2.5" /> {t(language, 'ratingText')}
               </div>
               <div className={`text-[9px] font-bold flex items-center gap-1 text-slate-500`}>
                 <CheckCircle2 className="w-2.5 h-2.5" /> {t(language, 'daysText')}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. P2P Центр */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">
          {t(language, 'merchantCenter')}
        </h3>
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm ring-1 ring-slate-100">
          <MenuBtn icon={Store} label={t(language, 'myAds')} color="text-blue-500" bg="bg-blue-50" onClick={() => setIsViewingMyAds(true)} />
          <MenuBtn icon={PlusCircle} label={t(language, 'createAd')} color="text-emerald-500" bg="bg-emerald-50" onClick={() => setIsCreatingAd(true)} />
          <MenuBtn icon={ListOrdered} label={t(language, 'myOrders')} color="text-amber-500" bg="bg-amber-50" onClick={() => setIsViewingMyOrders(true)} />
          <MenuBtn icon={UsersIcon} label={t(language, 'referralTitle')} color="text-emerald-500" bg="bg-emerald-50" onClick={() => setIsViewingReferral(true)} />
          <MenuBtn icon={Gift} label={t(language, 'codesTitle')} color="text-purple-500" bg="bg-purple-50" onClick={() => setIsViewingCodes(true)} last />
        </div>
      </div>

      {/* 3. Настройки и Безопасность */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">
          {t(language, 'security')}
        </h3>
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm ring-1 ring-slate-100">
          {/* Админ-панель */}
          {user?.isAdmin && (
            <MenuBtn
              icon={ShieldAlert}
              label={t(language, 'adminPanel')}
              color="text-red-500"
              bg="bg-red-50"
              onClick={() => setIsViewingAdmin(true)}
            />
          )}

          {/* Уведомления */}
          <MenuBtn
            icon={Bell}
            label={t(language, 'notifications')}
            color="text-purple-500"
            bg="bg-purple-50"
            toggle
            isOn={user?.tgNotifications !== false}
            onClick={async () => {
              const newStatus = user?.tgNotifications !== false;
              try {
                const res = await fetch(`/api/user/${user.id}/notifications`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tgNotifications: !newStatus })
                });
                if (res.ok) {
                  initUser(WebApp.initData);
                  addToast(newStatus ? t(language, 'notificationsDisabled') : t(language, 'notificationsEnabled'), 'info');
                }
              } catch (e) {
                addToast(t(language, 'updateError'), 'error');
              }
            }}
          />

          {/* KYC */}
          <MenuBtn
            icon={ShieldCheck}
            label={t(language, 'kycLabel')}
            color={
              user?.isVerified || user?.kycStatus === 'VERIFIED'
                ? 'text-emerald-600'
                : user?.kycStatus === 'PENDING'
                ? 'text-blue-500'
                : user?.kycStatus === 'REJECTED'
                ? 'text-red-500'
                : 'text-amber-500'
            }
            bg={
              user?.isVerified || user?.kycStatus === 'VERIFIED'
                ? 'bg-emerald-50'
                : user?.kycStatus === 'PENDING'
                ? 'bg-blue-50'
                : user?.kycStatus === 'REJECTED'
                ? 'bg-red-50'
                : 'bg-amber-50'
            }
            badge={
              user?.isVerified || user?.kycStatus === 'VERIFIED'
                ? t(language, 'verified')
                : user?.kycStatus === 'PENDING'
                ? t(language, 'kycOnCheck')
                : user?.kycStatus === 'REJECTED'
                ? t(language, 'kycRejected')
                : t(language, 'kycPass')
            }
            onClick={() => setIsViewingKyc(true)}
          />

          {/* Адресная книга */}
          <MenuBtn
            icon={ListOrdered}
            label={t(language, 'addressBookTitle')}
            color="text-emerald-600"
            bg="bg-emerald-50"
            onClick={() => setIsViewingAddressBook(true)}
          />

          {/* Безопасность */}
          <MenuBtn
            icon={ShieldCheck}
            label={t(language, 'securityPin')}
            color="text-indigo-600"
            bg="bg-indigo-50"
            onClick={() => setIsViewingSecurity(true)}
          />

          {/* API */}
          <MenuBtn
            icon={PlusCircle}
            label={t(language, 'apiManagement')}
            color="text-blue-600"
            bg="bg-blue-50"
            onClick={() => setIsViewingApi(true)}
          />

          {/* Помощь */}
          <MenuBtn
            icon={HelpCircle}
            label={t(language, 'help')}
            color="text-slate-500"
            bg="bg-slate-100"
            onClick={() => setIsViewingHelp(true)}
            last
          />
        </div>
      </div>

      {/* Удаление аккаунта */}
       <div className="pt-4 pb-10">
         <button 
           onClick={() => setIsDeletingAccount(true)}
           className="w-full py-5 flex items-center justify-center gap-3 text-red-500 font-black text-sm uppercase tracking-[0.2em] bg-red-50 rounded-[2rem] border border-red-100 active:scale-95 transition-all"
         >
           <Trash2 className="w-4 h-4" /> {t(language, 'deleteAccount')}
         </button>
       </div>

      {/* Модалка удаления */}
      {isDeletingAccount && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 animate-in zoom-in duration-300 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-red-100">
               <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{t(language, 'deleteAccountConfirmTitle')}</h3>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">
                {t(language, 'deleteAccountConfirmDesc')}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteAccount}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-red-100 active:scale-95 transition-all"
              >
                {t(language, 'deleteAccountBtn')}
              </button>
              <button 
                 onClick={() => setIsDeletingAccount(false)}
                 className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs tracking-widest active:scale-95 transition-all"
               >
                 {t(language, 'cancelBtn')}
               </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
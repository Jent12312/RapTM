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
  Gift
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
  color: string;
  bg: string;
  onClick: () => void;
  last?: boolean;
  toggle?: boolean;
  badge?: string;
  isOn?: boolean;
}

// Компонент кнопки меню с улучшенными эффектами и типизацией
const MenuBtn = ({ icon: Icon, label, color, bg, onClick, last, toggle, badge, isOn }: MenuBtnProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-5 flex justify-between items-center transition-all active:bg-slate-50 
        hover:bg-slate-50/50 group
        ${!last ? 'border-b border-slate-100' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-2xl ${bg} ${color} transition-transform group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-bold text-slate-700 text-sm tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
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
};

export default function ProfileScreen() {
  const { user, language, initUser, addToast } = useAppStore();

  // Состояния для открытия вложенных экранов
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [isViewingMyAds, setIsViewingMyAds] = useState(false);
  const [isViewingMyOrders, setIsViewingMyOrders] = useState(false);
  const [isViewingAdmin, setIsViewingAdmin] = useState(false);
  const [isViewingKyc, setIsViewingKyc] = useState(false);
  const [isViewingCodes, setIsViewingCodes] = useState(false);
  const [isViewingHelp, setIsViewingHelp] = useState(false);

  // Статистика
  const [stats, setStats] = useState<UserStats>({ good: 0, neutral: 0, bad: 0, trades: 0, volume: 0 });

  // Редактирование профиля
  const [isEditing, setIsEditing] = useState(false);
  const [newNick, setNewNick] = useState(user?.nickname || user?.firstName || '');

  // Загрузка аватара
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Редактирование контактов
  const [isEditingContacts, setIsEditingContacts] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  const fetchStats = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/user/${user.id}/stats`);
      if (res.ok) setStats(await res.json());
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
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
      initUser(WebApp.initDataUnsafe.user);
    }
  };

  // Загрузка аватара
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      addToast('Пожалуйста, выберите изображение', 'error');
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
          addToast('Ошибка загрузки аватара', 'error');
        }
      } catch (error) {
        addToast('Ошибка загрузки аватара', 'error');
      } finally {
        setIsUploadingAvatar(false);
        setAvatarPreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Сохранение контактов
  const handleSaveContacts = async () => {
    if (!user?.id) return;
    const res = await fetch(`/api/user/${user.id}/contact`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, email })
    });
    if (res.ok) {
      setIsEditingContacts(false);
      WebApp.HapticFeedback.notificationOccurred('success');
      initUser(WebApp.initDataUnsafe.user);
    } else {
      addToast('Ошибка сохранения контактов', 'error');
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

  const displayName = user?.nickname || user?.firstName || 'User';

  // Вычисление процента завершённых сделок (корректное)
  const completionRate = stats.trades > 0
    ? `${Math.round((stats.good / stats.trades) * 100)}%`
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
        <div className="mt-5 flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl ring-1 ring-inset ring-white/50">
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
          <button
            onClick={() => WebApp.switchInlineQuery(`profile_${user.id}`)}
            className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1"
          >
            {t(language, 'shareProfile')} <Share className="w-3 h-3" />
          </button>
        </div>
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
              label="Админ-Панель (Арбитраж)"
              color="text-red-500"
              bg="bg-red-50"
              onClick={() => setIsViewingAdmin(true)}
            />
          )}

          {/* Привязка телефона */}
          <MenuBtn
            icon={Phone}
            label={phone ? `+${phone}` : 'Привязать телефон'}
            color={phone ? 'text-emerald-600' : 'text-amber-500'}
            bg={phone ? 'bg-emerald-50' : 'bg-amber-50'}
            badge={phone ? 'Привязан' : undefined}
            onClick={() => setIsEditingContacts(true)}
          />

          {/* Привязка почты */}
          <MenuBtn
            icon={Mail}
            label={email || 'Привязать почту'}
            color={email ? 'text-emerald-600' : 'text-blue-500'}
            bg={email ? 'bg-emerald-50' : 'bg-blue-50'}
            badge={email ? 'Привязана' : undefined}
            onClick={() => setIsEditingContacts(true)}
          />

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
                  initUser(WebApp.initDataUnsafe.user);
                  addToast(newStatus ? 'Уведомления отключены' : 'Уведомления включены', 'info');
                }
              } catch (e) {
                addToast('Ошибка при обновлении', 'error');
              }
            }}
          />

          {/* KYC */}
          <MenuBtn
            icon={ShieldCheck}
            label={t(language, 'kycLabel')}
            color={
              user?.isVerified || user?.kycStatus === 'verified'
                ? 'text-emerald-600'
                : user?.kycStatus === 'pending'
                ? 'text-blue-500'
                : user?.kycStatus === 'rejected'
                ? 'text-red-500'
                : 'text-amber-500'
            }
            bg={
              user?.isVerified || user?.kycStatus === 'verified'
                ? 'bg-emerald-50'
                : user?.kycStatus === 'pending'
                ? 'bg-blue-50'
                : user?.kycStatus === 'rejected'
                ? 'bg-red-50'
                : 'bg-amber-50'
            }
            badge={
              user?.isVerified || user?.kycStatus === 'verified'
                ? t(language, 'verified')
                : user?.kycStatus === 'pending'
                ? 'На проверке'
                : user?.kycStatus === 'rejected'
                ? 'Отклонено'
                : 'Пройти'
            }
            onClick={() => setIsViewingKyc(true)}
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

      {/* Модальное окно редактирования контактов */}
      {isEditingContacts && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-end justify-center animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">{t(language, 'phone')}</h3>
              <button onClick={() => setIsEditingContacts(false)} className="p-2 bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  {t(language, 'phone')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+99360000000"
                  className="w-full bg-slate-50 ring-1 ring-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  {t(language, 'email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full bg-slate-50 ring-1 ring-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsEditingContacts(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl active:scale-95 transition-transform"
                >
                  {t(language, 'cancel')}
                </button>
                <button
                  onClick={handleSaveContacts}
                  className="flex-[2] py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
                >
                  {t(language, 'save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
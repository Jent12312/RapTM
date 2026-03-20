'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
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
  Settings,
  BellRing
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';

// Импортируем дочерние экраны
import CreateAdScreen from './CreateAdScreen';
import MyAdsScreen from './MyAdsScreen';
import MyOrdersScreen from './MyOrdersScreen';

export default function ProfileScreen() {
  const { user } = useAppStore();
  
  // Состояния для открытия вложенных экранов
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [isViewingMyAds, setIsViewingMyAds] = useState(false);
  const [isViewingMyOrders, setIsViewingMyOrders] = useState(false);

  // Функция для кнопки "Поделиться" (Inline Query + Deep Link)
  const handleShareProfile = () => {
    const botUsername = 'rapira_tm_bot'; 
    
    try {
      // 1. Пытаемся вызвать нативное меню выбора чата в Telegram (Inline Mode)
      // В BotFather должен быть включен "Inline Mode"
      WebApp.switchInlineQuery(`profile_${user?.telegramId}`, ['users', 'groups', 'channels']);
    } catch (e) {
      // 2. Если не сработало (например, старая версия ТГ), отправляем прямую ссылку
      const shareUrl = `https://t.me/${botUsername}/app?startapp=user_${user?.telegramId}`;
      const text = encodeURIComponent(`Посмотри мой профиль на P2P платформе Rapira!`);
      WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`);
    }
  };

  // ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ЭКРАНОВ
  if (isCreatingAd) {
    return <CreateAdScreen onClose={() => setIsCreatingAd(false)} />;
  }

  if (isViewingMyAds) {
    return <MyAdsScreen onClose={() => setIsViewingMyAds(false)} />;
  }

  if (isViewingMyOrders) {
    return <MyOrdersScreen onClose={() => setIsViewingMyOrders(false)} />;
  }

  return (
    <div className="px-5 py-4 space-y-6 animate-in fade-in duration-300 pb-32">
      
      {/* --- 1. КАРТОЧКА ПРОФИЛЯ СО СТАТИСТИКОЙ --- */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 relative overflow-hidden">
        {/* Кнопка Поделиться */}
        <button 
          onClick={handleShareProfile}
          className="absolute top-6 right-6 p-2.5 bg-blue-50 text-blue-600 rounded-full active:scale-90 transition-all shadow-sm"
        >
          <Share className="w-5 h-5" />
        </button>

        {/* Аватар и Имя */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-100">
            {user?.firstName?.charAt(0) || 'A'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{user?.firstName || 'Пользователь'}</h2>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {user?.telegramId || '000000'}</span>
              <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Standard</span>
            </div>
          </div>
        </div>

        {/* Блок статистики (Скрин 2 из PDF) */}
        <div className="border-t border-slate-50 pt-5">
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="text-center">
              <div className="text-lg font-black text-slate-800">0</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Сделок</div>
            </div>
            <div className="text-center border-x border-slate-100">
              <div className="text-lg font-black text-slate-800">0%</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Выполнено</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-slate-800">0 <span className="text-[10px] text-slate-400 font-bold">USDT</span></div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Объём</div>
            </div>
          </div>

          {/* Смайлики (Отзывы) */}
          <div className="bg-slate-50/80 p-4 rounded-3xl flex justify-between items-center ring-1 ring-slate-100/50">
            <div>
              <div className="text-base font-black text-emerald-600 leading-none">100%</div>
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Рейтинг доверия</div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1">
                <Smile className="w-5 h-5 text-blue-500" />
                <span className="text-[10px] font-bold text-slate-600">0</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Meh className="w-5 h-5 text-slate-300" />
                <span className="text-[10px] font-bold text-slate-400">0</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Frown className="w-5 h-5 text-red-300" />
                <span className="text-[10px] font-bold text-slate-400">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. СТАТУС ВЕРИФИКАЦИИ --- */}
      <button className="w-full bg-red-50 p-5 rounded-[2rem] ring-1 ring-red-100 flex justify-between items-center transition-all active:scale-95 group">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2.5 rounded-2xl shadow-sm text-red-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-none mb-1">Верификация личности</p>
            <p className="text-sm font-bold text-red-600">Не верифицирован</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-red-300 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* --- 3. P2P ЦЕНТР УПРАВЛЕНИЯ --- */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">Управление P2P</h3>
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm ring-1 ring-slate-100 divide-y divide-slate-50">
          
          <button 
            onClick={() => setIsViewingMyAds(true)}
            className="w-full p-5 flex justify-between items-center active:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform"><Store className="w-5 h-5" /></div>
              <span className="font-bold text-slate-700">Мои объявления</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-200" />
          </button>

          <button 
            onClick={() => setIsCreatingAd(true)}
            className="w-full p-5 flex justify-between items-center active:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform"><PlusCircle className="w-5 h-5" /></div>
              <span className="font-bold text-slate-700">Создать объявление</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-200" />
          </button>

          <button 
            onClick={() => setIsViewingMyOrders(true)}
            className="w-full p-5 flex justify-between items-center active:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-2.5 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform"><ListOrdered className="w-5 h-5" /></div>
              <span className="font-bold text-slate-700">Мои сделки (Чаты)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500 w-2 h-2 rounded-full animate-pulse"></span>
              <ChevronRight className="w-5 h-5 text-slate-200" />
            </div>
          </button>

        </div>
      </div>

      {/* --- 4. НАСТРОЙКИ И БЕЗОПАСНОСТЬ --- */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-4">Настройки</h3>
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm ring-1 ring-slate-100 divide-y divide-slate-50">
          
          <button className="w-full p-5 flex justify-between items-center active:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="bg-slate-50 p-2.5 rounded-2xl text-slate-500 group-hover:rotate-12 transition-transform"><BellRing className="w-5 h-5" /></div>
              <span className="font-bold text-slate-700">Уведомления</span>
            </div>
            <div className="w-10 h-6 bg-emerald-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </button>

          <button className="w-full p-5 flex justify-between items-center active:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="bg-slate-50 p-2.5 rounded-2xl text-slate-500 group-hover:rotate-12 transition-transform"><Settings className="w-5 h-5" /></div>
              <span className="font-bold text-slate-700">Язык приложения</span>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg">RU</span>
          </button>

        </div>
      </div>

    </div>
  );
}
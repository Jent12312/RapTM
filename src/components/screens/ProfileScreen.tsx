'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ShieldAlert, PlusCircle, ListOrdered, ChevronRight, Store } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import CreateAdScreen from './CreateAdScreen'; // <-- Импортируем наш новый экран

export default function ProfileScreen() {
  const { language } = useAppStore();
  const [user, setUser] = useState<any>(null);
  
  // Стейт для управления открытием формы создания объявления
  const [isCreatingAd, setIsCreatingAd] = useState(false);

  useEffect(() => {
    if (WebApp.initDataUnsafe?.user) {
      setUser(WebApp.initDataUnsafe.user);
    }
  }, []);

  // Если нажали "Создать", рендерим ТОЛЬКО этот экран поверх всего
  if (isCreatingAd) {
    return <CreateAdScreen onClose={() => setIsCreatingAd(false)} />;
  }

  return (
    <div className="px-5 py-4 space-y-6 animate-in fade-in duration-300 pb-32">
      
      {/* 1. Шапка Профиля */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-200">
          {user?.first_name?.charAt(0) || 'A'}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{user?.first_name || 'Azat User'}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                ID: {user?.id || '10293847'}
              </p>
            </div>
            <div className="bg-slate-100 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 uppercase">
              Standard
            </div>
          </div>
        </div>
      </div>

      {/* 2. Статус Верификации (KYC) */}
      <button className="w-full bg-red-50 p-4 rounded-3xl ring-1 ring-red-100 flex justify-between items-center transition-all active:scale-95">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-sm">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Верификация</p>
            <p className="text-sm font-bold text-red-600">Не верифицирован</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-red-300" />
      </button>

      {/* 3. Центр Мерчанта (P2P Управление) */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 mb-3">P2P Центр</h3>
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm ring-1 ring-slate-100">
          
          <button className="w-full p-4 flex justify-between items-center border-b border-slate-50 transition-all active:bg-slate-50 group">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Store className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-bold text-slate-700">Мои объявления</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md">2 активных</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </button>

          {/* КНОПКА ОТКРЫТИЯ ФОРМЫ */}
          <button 
            onClick={() => setIsCreatingAd(true)} 
            className="w-full p-4 flex justify-between items-center border-b border-slate-50 transition-all active:bg-slate-50 group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="font-bold text-slate-700">Создать объявление</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          <button className="w-full p-4 flex justify-between items-center transition-all active:bg-slate-50 group">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 p-2 rounded-xl group-hover:bg-amber-100 transition-colors">
                <ListOrdered className="w-5 h-5 text-amber-500" />
              </div>
              <span className="font-bold text-slate-700">История сделок</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

        </div>
      </div>

      {/* 4. Безопасность */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 mb-3">Безопасность</h3>
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm ring-1 ring-slate-100">
          <button className="w-full p-4 flex justify-between items-center border-b border-slate-50">
            <span className="font-bold text-slate-700">Телефон</span>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md uppercase tracking-wider">
              Привязать +
            </span>
          </button>
          <button className="w-full p-4 flex justify-between items-center">
            <span className="font-bold text-slate-700">Telegram Уведомления</span>
            <div className="w-10 h-6 bg-emerald-500 rounded-full relative shadow-inner">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}
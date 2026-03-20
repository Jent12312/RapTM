'use client';

import { ChevronLeft, Share, BarChart2, Smile, Frown, Meh, BadgeCheck } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

interface Props {
  merchant: any;
  onClose: () => void;
}

export default function MerchantProfileModal({ merchant, onClose }: Props) {
  
  // Логика кнопки "Поделиться" (Скрин 3 и 4)
  const handleShare = () => {
    // В Telegram Mini Apps это открывает меню пересылки!
    // Твой бот должен будет уметь обрабатывать inline_query, чтобы рисовать красивую карточку.
    try {
      WebApp.switchInlineQuery(`profile_${merchant.id}`, ['users', 'groups', 'channels']);
    } catch (e) {
      // Фолбэк, если открыто не с телефона
      const url = `https://t.me/Rapira_TM_bot?start=user_${merchant.id}`;
      WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=Профиль продавца`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      
      {/* Шапка профиля с кнопкой Поделиться */}
      <div className="bg-white px-5 py-4 flex justify-between items-center sticky top-0 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-slate-800">{merchant.firstName || 'Мерчант'}</h2>
              {merchant.isVerified && <BadgeCheck className="w-5 h-5 text-red-500" fill="currentColor" stroke="white" />}
            </div>
            <div className="flex gap-2 text-[10px] font-bold text-slate-400 mt-1">
              <span>Email ❕</span>
              <span>Телефон ❕</span>
            </div>
          </div>
        </div>
        
        {/* Кнопки Справа (Скрин 4) */}
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          <button onClick={handleShare} className="p-2 bg-blue-50 text-blue-600 rounded-full active:scale-95 transition-all">
            <Share className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Статистика (Скрин 2) */}
      <div className="p-4 mt-2">
        <div className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden">
          
          {/* Верхний ряд */}
          <div className="grid grid-cols-3 border-b border-slate-50">
            <div className="p-4 text-center border-r border-slate-50">
              <div className="text-lg font-black text-slate-800">142</div>
              <div className="text-[10px] font-bold text-slate-400">Сделок</div>
            </div>
            <div className="p-4 text-center border-r border-slate-50">
              <div className="text-lg font-black text-slate-800">98.5%</div>
              <div className="text-[10px] font-bold text-slate-400">Выполнено</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-lg font-black text-slate-800">12k <span className="text-xs">USDT</span></div>
              <div className="text-[10px] font-bold text-slate-400">Объём</div>
            </div>
          </div>

          {/* Нижний ряд */}
          <div className="grid grid-cols-3 border-b border-slate-50">
            <div className="p-4 text-center border-r border-slate-50">
              <div className="text-lg font-black text-slate-800">2 мин</div>
              <div className="text-[10px] font-bold text-slate-400">Принятие ≈</div>
            </div>
            <div className="p-4 text-center border-r border-slate-50">
              <div className="text-lg font-black text-slate-800">5 мин</div>
              <div className="text-[10px] font-bold text-slate-400">Отправка ≈</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-lg font-black text-slate-800">3 мин</div>
              <div className="text-[10px] font-bold text-slate-400">Подтверждение ≈</div>
            </div>
          </div>

          {/* Отзывы (Смайлики) */}
          <div className="p-5 flex justify-between items-center bg-slate-50/50">
            <div>
              <div className="text-lg font-black text-red-500">99%</div>
              <div className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">положительных отзывов</div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1"><Smile className="w-5 h-5 text-blue-500" /> <span className="text-sm font-bold">140</span></div>
              <div className="flex items-center gap-1"><Meh className="w-5 h-5 text-slate-400" /> <span className="text-sm font-bold">2</span></div>
              <div className="flex items-center gap-1"><Frown className="w-5 h-5 text-red-400" /> <span className="text-sm font-bold">0</span></div>
            </div>
          </div>

        </div>

        {/* Заглушка активных объявлений продавца */}
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-8 mb-4 ml-2">Объявления пользователя</h3>
        <div className="text-center py-10 bg-white rounded-[2rem] ring-1 ring-slate-100 text-slate-400 text-sm font-medium">
          Здесь будут активные объявления
        </div>
      </div>
    </div>
  );
}
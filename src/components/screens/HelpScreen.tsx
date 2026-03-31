// src/components/screens/HelpScreen.tsx
'use client';

import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { ChevronLeft } from 'lucide-react';

export default function HelpScreen({ onClose }: { onClose: () => void }) {
  const { language } = useAppStore();

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{t(language, 'help')}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'helpSubtitle')}</p>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Добро пожаловать в раздел помощи!</h3>
          <p className="text-slate-600 text-sm mb-3">
            Здесь вы найдете ответы на часто задаваемые вопросы и полезные инструкции по работе с нашим приложением.
          </p>
          <p className="text-slate-600 text-sm mb-3">
            Если у вас возникли вопросы, вы всегда можете связаться с нашей службой поддержки через Telegram: <a href="https://t.me/your_support_bot" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">@your_support_bot</a>
          </p>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
            <li>Как зарегистрироваться?</li>
            <li>Как купить/продать криптовалюту?</li>
            <li>Как создать объявление?</li>
            <li>Что такое KYC и зачем он нужен?</li>
            <li>Как обратиться в поддержку?</li>
          </ul>
          <p className="text-slate-600 text-sm mt-3">
            Мы постоянно работаем над улучшением нашего сервиса и добавлением новых функций. Следите за обновлениями!
          </p>
        </div>
        {/* Дополнительные блоки с помощью можно добавить здесь */}
      </div>
    </div>
  );
}

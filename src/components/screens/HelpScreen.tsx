// src/components/screens/HelpScreen.tsx
'use client';

import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { ChevronLeft, MessageCircle, HelpCircle, BookOpen, Shield, Users, ArrowRight } from 'lucide-react';

export default function HelpScreen({ onClose }: { onClose: () => void }) {
  const { language } = useAppStore();

  const faqItems = [
    { icon: Users, question: 'Как зарегистрироваться?' },
    { icon: ArrowRight, question: 'Как купить/продать криптовалюту?' },
    { icon: BookOpen, question: 'Как создать объявление?' },
    { icon: Shield, question: 'Что такое KYC и зачем он нужен?' },
    { icon: MessageCircle, question: 'Как обратиться в поддержку?' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-50 to-white overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Шапка с улучшенной типографикой и эффектами */}
      <div className="bg-white/80 backdrop-blur-md px-5 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-200/60 shadow-sm">
        <button
          onClick={onClose}
          className="p-2 -ml-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-all duration-200 active:scale-95"
          aria-label={"назад"}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {t(language, 'help')}
          </h2>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {t(language, 'helpSubtitle')}
          </p>
        </div>
      </div>

      {/* Основной контент с карточками и аккуратными отступами */}
      <div className="max-w-2xl mx-auto p-5 space-y-5 pb-32">
        {/* Приветственная карточка */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-md ring-1 ring-slate-200/80 transition-all hover:shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 rounded-2xl">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800 leading-tight">
              Добро пожаловать в раздел помощи!
            </h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Здесь вы найдете ответы на часто задаваемые вопросы и полезные инструкции по работе с нашим приложением.
          </p>

          {/* Telegram-контакт в виде красивой кнопки-ссылки */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
            <p className="text-slate-700 text-sm mb-2 font-medium">
              Связаться с поддержкой
            </p>
            <a
              href="https://t.me/your_support_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl shadow-sm ring-1 ring-slate-200 text-blue-600 font-medium text-sm hover:bg-blue-50 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              <span>@your_support_bot</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Карточка FAQ с улучшенным отображением */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-md ring-1 ring-slate-200/80">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-5">
            Часто задаваемые вопросы
          </h3>
          <ul className="space-y-3">
            {faqItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <li key={idx}>
                  <div className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      {item.question}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Блок о постоянном улучшении */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-50 p-5 rounded-[2rem] border border-slate-200/50">
          <p className="text-slate-600 text-sm italic flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            Мы постоянно работаем над улучшением нашего сервиса и добавлением новых функций. Следите за обновлениями!
          </p>
        </div>
      </div>
    </div>
  );
}
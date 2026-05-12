// src/components/screens/HelpScreen.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import {
  ChevronLeft,
  Search,
  ChevronDown,
  MessageCircle,
  Shield,
  Wallet,
  RefreshCcw,
  Users,
  FileCheck,
  Gift,
  Key,
  TrendingUp,
  MapPin,
  FileText,
  ExternalLink,
  HelpCircle,
  X
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQSection {
  id: string;
  title: string;
  icon: any;
  items: FAQItem[];
}

export default function HelpScreen({ onClose }: { onClose: () => void }) {
  const { language, setActiveTab } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const faqData: FAQSection[] = [
    {
      id: 'account',
      title: 'Учетная запись и безопасность',
      icon: Shield,
      items: [
        {
          question: 'Как защитить свой аккаунт?',
          answer: (
            <div>
              Мы настоятельно рекомендуем включить двухфакторную аутентификацию (2FA) в разделе
              <button
                onClick={() => { onClose(); setActiveTab('profile'); }}
                className="inline-flex items-center gap-1 mx-1 text-blue-600 font-bold hover:underline"
              >
                Безопасность
                <ExternalLink className="w-3 h-3" />
              </button>.
              Также используйте сложный пароль и не передавайте свои данные третьим лицам.
            </div>
          )
        },
        {
          question: 'Забыли пароль или PIN-код?',
          answer: 'Для восстановления доступа воспользуйтесь формой сброса пароля на экране входа или обратитесь в нашу службу поддержки через Telegram.'
        },
        {
          question: 'Как пройти верификацию (KYC)?',
          answer: (
            <div>
              Перейдите в раздел
              <button
                onClick={() => { onClose(); setActiveTab('profile'); }}
                className="inline-flex items-center gap-1 mx-1 text-blue-600 font-bold hover:underline"
              >
                Профиль
              </button>
              и выберите "Верификация". Вам потребуется загрузить фото документа, удостоверяющего личность. Проверка обычно занимает от 15 до 60 минут.
            </div>
          )
        }
      ]
    },
    {
      id: 'finance',
      title: t(language, 'walDepositWithdraw'),
      icon: Wallet,
      items: [
        {
          question: t(language, 'faqNetSupport'),
          answer: t(language, 'faqNetSupportDesc')
        },
        {
          question: t(language, 'faqWithdrawTime'),
          answer: t(language, 'faqWithdrawTimeDesc')
        },
        {
          question: t(language, 'faqHowDepositCrypto'),
          answer: t(language, 'faqHowDepositCryptoDesc')
        },
        {
          question: t(language, 'faqHowDepositCash'),
          answer: t(language, 'faqHowDepositCashDesc')
        },
        {
          question: t(language, 'faqHowWithdrawTime'),
          answer: t(language, 'faqHowWithdrawTimeDesc')
        }
      ]
    },
    {
      id: 'p2p',
      title: t(language, 'navP2P'),
      icon: Users,
      items: [
        {
          question: t(language, 'faqP2PDetails'),
          answer: t(language, 'faqP2PDetailsDesc')
        },
        {
          question: t(language, 'faqP2PTimeout'),
          answer: t(language, 'faqP2PTimeoutDesc')
        },
        {
          question: t(language, 'faqArbitration'),
          answer: t(language, 'faqArbitrationDesc')
        }
      ]
    },
    {
      id: 'aml',
      title: t(language, 'faqAMLTitle'),
      icon: FileCheck,
      items: [
        {
          question: t(language, 'faqWhatIsAML'),
          answer: t(language, 'faqWhatIsAMLDesc')
        },
        {
          question: t(language, 'faqRiskScore'),
          answer: t(language, 'faqRiskScoreDesc')
        }
      ]
    },
    {
      id: 'referral',
      title: t(language, 'faqReferralTitle'),
      icon: Gift,
      items: [
        {
          question: t(language, 'faqHowInvite'),
          answer: t(language, 'faqHowInviteDesc')
        },
        {
          question: t(language, 'faqRewards'),
          answer: t(language, 'faqRewardsDesc')
        }
      ]
    },
    {
      id: 'api',
      title: t(language, 'faqAPITitle'),
      icon: Key,
      items: [
        {
          question: t(language, 'faqHowCreateAPI'),
          answer: t(language, 'faqHowCreateAPIDesc')
        }
      ]
    },
    {
      id: 'levels',
      title: t(language, 'faqLevelsTitle'),
      icon: TrendingUp,
      items: [
        {
          question: t(language, 'faqHowLevelUp'),
          answer: t(language, 'faqHowLevelUpDesc')
        }
      ]
    },
    {
      id: 'offices',
      title: t(language, 'faqOfficesTitle'),
      icon: MapPin,
      items: [
        {
          question: t(language, 'faqWhereOffices'),
          answer: t(language, 'faqWhereOfficesDesc')
        }
      ]
    }
  ];

const filteredData = useMemo(() => {
  if (!searchQuery) return faqData;
  const query = searchQuery.toLowerCase();
  return faqData.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.question.toLowerCase().includes(query) ||
      (typeof item.answer === 'string' && item.answer.toLowerCase().includes(query))
    )
  })).filter(section => section.items.length > 0);
}, [searchQuery]);

const toggleItem = (id: string) => {
  setOpenItems(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );
};

return (
  <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
    {/* Header */}
    <div className="bg-white/80 backdrop-blur-xl px-5 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2 -ml-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-none mb-1">
            Центр поддержки
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            FAQ & Документация
          </p>
        </div>
      </div>

      <a
        href="https://t.me/rapira_support"
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
      </a>
    </div>

    <div className="flex-1 overflow-y-auto pb-10">
      {/* Search Bar */}
      <div className="p-5">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Поиск по вопросам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="px-5 space-y-6">
        {filteredData.length > 0 ? (
          filteredData.map((section) => (
            <div key={section.id} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                  <section.icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                  {section.title}
                </h3>
              </div>

              <div className="space-y-2">
                {section.items.map((item, idx) => {
                  const itemId = `${section.id}-${idx}`;
                  const isOpen = openItems.includes(itemId);

                  return (
                    <div
                      key={itemId}
                      className={`bg-white border transition-all duration-300 rounded-2xl overflow-hidden ${isOpen ? 'border-blue-200 ring-4 ring-blue-500/5 shadow-md' : 'border-slate-100 shadow-sm'
                        }`}
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left group"
                      >
                        <span className={`text-sm font-semibold transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-700 group-hover:text-slate-900'
                          }`}>
                          {item.question}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''
                          }`} />
                      </button>

                      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                        <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600 border-t border-slate-50 pt-4">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center">
            <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
              <HelpCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Ничего не найдено</h4>
            <p className="text-sm text-slate-500 mt-1">Попробуйте изменить запрос</p>
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="mt-10 px-5">
        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white overflow-hidden relative shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <FileText className="w-32 h-32" />
          </div>

          <h3 className="text-lg font-bold mb-4 relative z-10">Юридические документы</h3>
          <div className="space-y-3 relative z-10">
            {[
              { name: 'Пользовательское соглашение', icon: FileText },
              { name: 'Политика конфиденциальности', icon: Shield },
              { name: 'AML/KYC Политика', icon: FileCheck },
              { name: 'Правила P2P торговли', icon: Users },
            ].map((doc, i) => (
              <button
                key={i}
                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 group"
              >
                <div className="flex items-center gap-3">
                  <doc.icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                    {doc.name}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Support */}
      <div className="mt-8 px-5">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-6 text-center shadow-lg shadow-blue-500/20">
          <h3 className="text-lg font-bold text-white mb-2">{t(language, 'faqQuestionsLeft')}</h3>
          <p className="text-blue-100 text-sm mb-5 px-4">
            {t(language, 'faqSupportNote')}
          </p>
          <a
            href="https://t.me/rapira_support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-blue-50 transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            {t(language, 'faqContactTelegram')}
          </a>
        </div>
      </div>
    </div>
  </div>
);
}
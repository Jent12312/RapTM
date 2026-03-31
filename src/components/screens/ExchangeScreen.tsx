// src/components/screens/ExchangeScreen.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { ArrowDownUp, CheckCircle2, Phone, Clock, Info } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

// Телефон администратора, куда пользователи будут отправлять манаты
const ADMIN_PHONE_NUMBER = "+993 65 XX-XX-XX (Админ)";
const EXCHANGE_RATE = 19.5; // Пример: 1 USDT = 19.5 TMT. Можно заменить на запрос к /api/market-price

export default function ExchangeScreen() {
  const { user, language, balances, addToast, initUser } = useAppStore();
  const [direction, setDirection] = useState<'USDT_TO_TMT' | 'TMT_TO_USDT'>('USDT_TO_TMT');
  
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Загрузка истории
  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/exchange?userId=${user.id}`);
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  const calculateReceive = () => {
    const num = Number(amount) || 0;
    if (direction === 'USDT_TO_TMT') return (num * EXCHANGE_RATE).toFixed(2);
    return (num / EXCHANGE_RATE).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      addToast('Введите сумму', 'error');
      return;
    }

    if (direction === 'USDT_TO_TMT') {
      if (Number(amount) > balances.usdt) {
        addToast('Недостаточно USDT на балансе', 'error');
        return;
      }
      if (!phone || phone.length < 8) {
        addToast('Введите корректный номер телефона', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    const amountUsdt = direction === 'USDT_TO_TMT' ? Number(amount) : Number(calculateReceive());
    const amountTmt = direction === 'USDT_TO_TMT' ? Number(calculateReceive()) : Number(amount);

    try {
      const res = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          direction,
          amountUsdt,
          amountTmt,
          userPhone: direction === 'USDT_TO_TMT' ? phone : null
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        addToast('Заявка успешно создана!', 'success');
        setAmount('');
        await initUser(WebApp.initDataUnsafe.user); // Обновляем баланс
        loadHistory();
      } else {
        addToast(data.error || 'Ошибка создания заявки', 'error');
      }
    } catch (e) {
      addToast('Ошибка соединения', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-5 py-4 space-y-6 animate-in fade-in duration-500 pb-32">
      
      {/* Шапка и переключатель */}
      <div className="bg-white p-2 rounded-2xl ring-1 ring-slate-100 shadow-sm flex">
        <button
          onClick={() => { setDirection('USDT_TO_TMT'); setAmount(''); }}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            direction === 'USDT_TO_TMT' ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'text-slate-500'
          }`}
        >
          Продать USDT
        </button>
        <button
          onClick={() => { setDirection('TMT_TO_USDT'); setAmount(''); }}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
            direction === 'TMT_TO_USDT' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'text-slate-500'
          }`}
        >
          Купить USDT
        </button>
      </div>

      {/* Основная карточка обмена */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-6">
        
        {/* Инфо-блок курса */}
        <div className="flex justify-between items-center text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl ring-1 ring-slate-100">
          <span>Курс обмена:</span>
          <span className="text-slate-800">1 USDT = {EXCHANGE_RATE} TMT</span>
        </div>

        {/* Поле отдаю */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Вы отдаете
          </label>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-emerald-500">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-black text-slate-800 bg-transparent outline-none placeholder-slate-500" 
            />
            <span className="font-bold text-slate-500 bg-white px-3 py-1 rounded-lg ring-1 ring-slate-200">
              {direction === 'USDT_TO_TMT' ? 'USDT' : 'TMT'}
            </span>
          </div>
          {direction === 'USDT_TO_TMT' && (
            <p className="text-xs text-slate-400 mt-2 font-medium">{t(language, 'exAvailable')}: {balances.usdt.toFixed(2)} USDT</p>
          )}
        </div>

        <div className="flex justify-center -my-2 relative z-10">
          <div className="bg-white p-2 rounded-full border border-slate-100 shadow-sm">
            <div className="bg-slate-50 p-2 rounded-full text-slate-400">
              <ArrowDownUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Поле получаю */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            {t(language, 'p2pReceiveAmount')}
          </label>
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200">
            <span className={`text-2xl font-black ${direction === 'USDT_TO_TMT' ? 'text-blue-600' : 'text-emerald-600'}`}>
              {calculateReceive()}
            </span>
            <span className="font-bold text-slate-500 bg-white px-3 py-1 rounded-lg ring-1 ring-slate-200">
              {direction === 'USDT_TO_TMT' ? 'TMT' : 'USDT'}
            </span>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Условия и реквизиты */}
        {direction === 'USDT_TO_TMT' ? (
          <div className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-amber-700 uppercase">
                {t(language, 'exNetworkFee')}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                {t(language, 'phone')} (ТМ) {t(language, 'p2pReceiveAmount')}
              </label>
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-emerald-500">
                <Phone className="w-5 h-5 text-slate-400" />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+993 6X XX XX XX"
                  className="w-full text-sm font-bold text-slate-800 bg-transparent outline-none placeholder-slate-500" 
                />
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all"
            >
              {isSubmitting ? 'Обработка...' : 'Обменять USDT на Манаты'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">
                {t(language, 'step1')}
              </p>
              <p className="text-sm font-medium text-slate-700 mb-4">
                {t(language, 'exSendTMT').replace('{amount}', amount || '0')} {t(language, 'exSendToAdmin')}
              </p>
              <div className="bg-white p-3 rounded-lg flex justify-between items-center ring-1 ring-blue-200">
                <span className="font-bold text-slate-800 text-lg">{ADMIN_PHONE_NUMBER}</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount}
              className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all"
            >
              {isSubmitting ? t(language, 'processing') : t(language, 'adminConfirm')}
            </button>
          </div>
        )}
      </div>

      {/* История заявок */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">{t(language, 'exHistory')}</h3>
          {history.map(req => (
            <div key={req.id} className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    req.direction === 'USDT_TO_TMT' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {req.direction === 'USDT_TO_TMT' ? t(language, 'sell') : t(language, 'buy')} USDT
                  </span>
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {req.amountUsdt} USDT ↔ {req.amountTmt} TMT
                </div>
              </div>
              <div className="text-right">
                {req.status === 'PENDING' && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" /> {t(language, 'exPending')}
                  </span>
                )}
                {req.status === 'COMPLETED' && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3 h-3" /> {t(language, 'exSuccess')}
                  </span>
                )}
                {req.status === 'CANCELLED' && (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                    {t(language, 'exCancelled')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
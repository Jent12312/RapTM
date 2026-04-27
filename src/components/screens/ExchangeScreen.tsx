// src/components/screens/ExchangeScreen.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { ArrowDownUp, CheckCircle2, Phone, Clock, Info, ShieldCheck, Zap, ArrowRightLeft, Wallet as WalletIcon } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

const ADMIN_PHONE_NUMBER = "+993 65 XX-XX-XX";

export default function ExchangeScreen() {
  const { user, language, balances, addToast, initUser } = useAppStore();
  const [direction, setDirection] = useState<'USDT_TO_TMT' | 'TMT_TO_USDT'>('USDT_TO_TMT');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // Динамические настройки с API
  const [settings, setSettings] = useState({
    EXCHANGE_RATE: 19.5,
    EXCHANGE_FEE: 1
  });

  // Загрузка настроек и истории
  const loadData = async () => {
    try {
      const [historyRes, settingsRes] = await Promise.all([
        fetch(`/api/exchange?userId=${user.id}`),
        fetch('/api/settings')
      ]);
      
      if (historyRes.ok) setHistory(await historyRes.json());
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setSettings({
          EXCHANGE_RATE: parseFloat(s.EXCHANGE_RATE),
          EXCHANGE_FEE: parseFloat(s.EXCHANGE_FEE)
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Расчеты
  const calculated = useMemo(() => {
    const num = parseFloat(amount) || 0;
    const rate = settings.EXCHANGE_RATE;
    const feePercent = settings.EXCHANGE_FEE;
    
    let receive = 0;
    let fee = 0;

    if (direction === 'USDT_TO_TMT') {
      fee = (num * feePercent) / 100;
      receive = num * rate;
    } else {
      // При покупке USDT комиссия вычитается из получаемой суммы
      const usdtAmount = num / rate;
      fee = (usdtAmount * feePercent) / 100;
      receive = usdtAmount;
    }

    return {
      receive: receive.toFixed(2),
      fee: fee.toFixed(2),
      totalWithFee: (num + (direction === 'USDT_TO_TMT' ? fee : 0)).toFixed(2)
    };
  }, [amount, direction, settings]);

  const handleReverse = () => {
    setDirection(prev => prev === 'USDT_TO_TMT' ? 'TMT_TO_USDT' : 'USDT_TO_TMT');
    setAmount('');
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      addToast(t(language, 'error'), 'error');
      return;
    }

    if (direction === 'USDT_TO_TMT') {
      const totalRequired = parseFloat(amount) + (balances.bonus < Number(calculated.fee) ? Number(calculated.fee) - balances.bonus : 0);
      if (totalRequired > balances.usdt) {
        addToast(t(language, 'error'), 'error');
        return;
      }
      if (!phone || phone.length < 8) {
        addToast('Введите корректный номер', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          direction,
          amountUsdt: direction === 'USDT_TO_TMT' ? Number(amount) : Number(calculated.receive),
          amountTmt: direction === 'USDT_TO_TMT' ? Number(calculated.receive) : Number(amount),
          userPhone: direction === 'USDT_TO_TMT' ? phone : null
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        addToast(t(language, 'success'), 'success');
        setAmount('');
        WebApp.HapticFeedback.notificationOccurred('success');
        await initUser(WebApp.initDataUnsafe.user);
        loadData();
      } else {
        addToast(data.error || 'Ошибка', 'error');
      }
    } catch (e) {
      addToast('Ошибка соединения', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-5 py-4 space-y-6 animate-in fade-in duration-500 pb-32 max-w-lg mx-auto">
      
      {/* Кастомные Табы */}
      <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl ring-1 ring-slate-200/50 shadow-sm flex relative">
        <div 
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm ring-1 ring-slate-100 transition-all duration-300 ease-out z-0 ${
            direction === 'TMT_TO_USDT' ? 'translate-x-full' : 'translate-x-0'
          }`}
        />
        <button
          onClick={() => setDirection('USDT_TO_TMT')}
          className={`flex-1 py-3 text-sm font-black transition-all relative z-10 ${
            direction === 'USDT_TO_TMT' ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          {t(language, 'sell')} USDT
        </button>
        <button
          onClick={() => setDirection('TMT_TO_USDT')}
          className={`flex-1 py-3 text-sm font-black transition-all relative z-10 ${
            direction === 'TMT_TO_USDT' ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          {t(language, 'buy')} USDT
        </button>
      </div>

      {/* Основная карточка */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 space-y-6 relative overflow-hidden">
        {/* Декоративный элемент */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
        
        {/* Курс */}
        <div className="flex justify-between items-center bg-slate-50/80 backdrop-blur-sm p-4 rounded-2xl ring-1 ring-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t(language, 'exRate')}</p>
              <p className="text-sm font-black text-slate-800">1 USDT = {settings.EXCHANGE_RATE} TMT</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t(language, 'exCommission')}</p>
            <p className="text-sm font-black text-indigo-600">{settings.EXCHANGE_FEE}%</p>
          </div>
        </div>

        {/* Секция "Отдаю" */}
        <div className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{direction === 'USDT_TO_TMT' ? t(language, 'sell') : t(language, 'buy')}</label>
            <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <WalletIcon className="w-3 h-3" /> {direction === 'USDT_TO_TMT' ? `${balances.usdt.toFixed(2)} USDT` : `${balances.tmt.toFixed(2)} TMT`}
            </p>
          </div>
          <div className="group relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="text-2xl font-black text-slate-300 group-focus-within:text-indigo-400 transition-colors">
                {direction === 'USDT_TO_TMT' ? '₮' : 'm'}
              </span>
            </div>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-20 py-6 text-3xl font-black text-slate-800 bg-slate-50 rounded-3xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-200" 
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-xl shadow-sm ring-1 ring-slate-100 font-black text-xs text-slate-500">
              {direction === 'USDT_TO_TMT' ? 'USDT' : 'TMT'}
            </div>
          </div>
        </div>

        {/* Кнопка реверса */}
        <div className="flex justify-center -my-3 relative z-10">
          <button 
            onClick={handleReverse}
            className="bg-white p-3 rounded-2xl shadow-lg ring-1 ring-slate-100 text-indigo-500 active:rotate-180 transition-transform duration-500 hover:scale-110"
          >
            <ArrowRightLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Секция "Получаю" */}
        <div className="space-y-3">
          <div className="px-1">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t(language, 'receiveAmount')}</label>
          </div>
          <div className="flex items-center justify-between bg-indigo-50/50 p-6 rounded-3xl ring-1 ring-indigo-100/50">
            <div>
              <p className={`text-3xl font-black ${direction === 'USDT_TO_TMT' ? 'text-slate-800' : 'text-indigo-600'}`}>
                {calculated.receive}
              </p>
              <p className="text-[10px] font-bold text-indigo-400 uppercase mt-1">~ {direction === 'USDT_TO_TMT' ? 'TMT' : 'USDT'}</p>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm ring-1 ring-slate-100 font-black text-xs text-slate-500">
              {direction === 'USDT_TO_TMT' ? 'TMT' : 'USDT'}
            </div>
          </div>
        </div>

        {/* Инфо о комиссии */}
        <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-400">{t(language, 'exCommission')}</span>
            <span className="text-indigo-600">{calculated.fee} USDT</span>
          </div>
          {direction === 'USDT_TO_TMT' && (
             <div className="flex justify-between text-[10px] font-medium border-t border-slate-100 pt-2">
              <span className="text-slate-400">Бонусный баланс:</span>
              <span className="text-emerald-600">{balances.bonus.toFixed(2)} USDT</span>
            </div>
          )}
        </div>

        {/* Ввод телефона для вывода */}
        {direction === 'USDT_TO_TMT' && (
          <div className="space-y-3 pt-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
              {t(language, 'phone')} {t(language, 'p2pReceiveAmount')}
            </label>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <Phone className="w-5 h-5 text-slate-400" />
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+993 6X XX XX XX"
                className="w-full text-sm font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300" 
              />
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !amount}
          className={`w-full py-5 rounded-3xl font-black text-lg shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${
            direction === 'USDT_TO_TMT' 
              ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-rose-200' 
              : 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-indigo-200'
          }`}
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {direction === 'USDT_TO_TMT' ? t(language, 'sell') : t(language, 'buy')} USDT
              <Zap className="w-5 h-5 fill-current" />
            </>
          )}
        </button>

        {direction === 'TMT_TO_USDT' && (
           <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">{t(language, 'whatToDo')}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
              Переведите <b>{amount || '0'} TMT</b> на номер <b>{ADMIN_PHONE_NUMBER}</b> и нажмите кнопку подтверждения.
            </p>
          </div>
        )}
      </div>

      {/* История */}
      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{t(language, 'exHistory')}</h3>
            <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full">{history.length}</span>
          </div>
          <div className="space-y-3">
            {history.map(req => (
              <div key={req.id} className="bg-white p-4 rounded-3xl shadow-sm ring-1 ring-slate-100 flex justify-between items-center group active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    req.direction === 'USDT_TO_TMT' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                  }`}>
                    {req.direction === 'USDT_TO_TMT' ? <ArrowRightLeft className="w-5 h-5 rotate-90" /> : <ArrowRightLeft className="w-5 h-5 -rotate-90" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-black text-slate-800">
                        {req.amountUsdt} USDT ↔ {req.amountTmt} TMT
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {req.status === 'PENDING' && (
                    <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                      {t(language, 'exPending')}
                    </span>
                  )}
                  {req.status === 'COMPLETED' && (
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                      {t(language, 'exSuccess')}
                    </span>
                  )}
                  {req.status === 'CANCELLED' && (
                    <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                      {t(language, 'exCancelled')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
// src/components/screens/ExchangeScreen.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import {
  ArrowDownUp, Info, RefreshCw, TrendingUp, TrendingDown, Clock,
  ArrowRight, ShieldCheck, Zap, Star, Phone, ArrowRightLeft, Wallet,
  WalletIcon
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { haptic } from '@/lib/haptic';
import Skeleton from '@/components/ui/Skeleton';
import PullToRefresh from '@/components/ui/PullToRefresh';

export default function ExchangeScreen() {
  const { language, balances, user, initUser, addToast } = useAppStore();

  const [direction, setDirection] = useState<'USDT_TO_TMT' | 'TMT_TO_USDT'>('USDT_TO_TMT');
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settings, setSettings] = useState({
    EXCHANGE_RATE: 19.5,
    EXCHANGE_FEE: 1,
    RECEIVE_PHONE: '+993 65 XX-XX-XX'
  });

  // Загрузка настроек и истории
  const loadData = async () => {
    try {
      const [historyRes, settingsRes] = await Promise.all([
        fetch(`/api/exchange?userId=${user.id}`),
        fetch('/api/settings')
      ]);

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(Array.isArray(data) ? data : []);
      }
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setSettings({
          EXCHANGE_RATE: parseFloat(s.EXCHANGE_RATE) || 19.5,
          EXCHANGE_FEE: parseFloat(s.EXCHANGE_FEE) || 1,
          RECEIVE_PHONE: s.RECEIVE_PHONE || '+993 65 XX-XX-XX'
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
  const calculated = useMemo((): { receive: string; fee: string; totalWithFee: string } => {
    const num = parseFloat(amount) || 0;
    const rate = settings.EXCHANGE_RATE;

    // Используем комиссию из настроек (в ТМТ), переводим в USDT
    const feeInUsdt = (settings.EXCHANGE_FEE || 20) / rate;

    let receive = 0;

    if (direction === 'USDT_TO_TMT') {
      receive = num * rate;
    } else {
      // При покупке USDT
      receive = num / rate;
    }

    return {
      receive: receive.toFixed(2),
      fee: feeInUsdt.toFixed(4), // Показываем больше знаков для USDT эквивалента 20 манат
      totalWithFee: (num + (direction === 'USDT_TO_TMT' ? feeInUsdt : 0)).toFixed(2)
    };
  }, [amount, direction, settings]);

  const handleReverse = () => {
    WebApp.HapticFeedback.impactOccurred('medium');
    setDirection(prev => prev === 'USDT_TO_TMT' ? 'TMT_TO_USDT' : 'USDT_TO_TMT');
    setAmount('');
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      addToast(t(language, 'error'), 'error');
      return;
    }

    // Проверка баланса (включая комиссию)
    const feeNum = parseFloat(calculated.fee);
    const amountNum = parseFloat(amount);

    if (direction === 'USDT_TO_TMT') {
      const totalUsdtNeeded = amountNum + Math.max(0, feeNum - balances.bonus);
      if (totalUsdtNeeded > balances.usdt) {
        addToast(t(language, 'exInsufficientUsdt'), 'error');
        return;
      }
      if (!phone || phone.length < 8) {
        addToast(t(language, 'exEnterPhone'), 'error');
        return;
      }
    } else {
      // Для покупки USDT проверяем, хватит ли на комиссию (бонус + usdt)
      const totalUsdtForFee = balances.usdt + balances.bonus;
      if (totalUsdtForFee < feeNum) {
        addToast(t(language, 'exInsufficientBalanceFee'), 'error');
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
        await initUser(WebApp.initData);
        loadData();
      } else {
        addToast(data.error || t(language, 'error'), 'error');
      }
    } catch (e) {
      addToast(t(language, 'exConnectionError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="px-5 py-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 max-w-lg mx-auto">

      {/* Кастомные Табы с эффектом стекла */}
      <div className="bg-slate-200/30 backdrop-blur-xl p-1.5 rounded-3xl ring-1 ring-white/20 shadow-inner flex relative overflow-hidden">
        <div
          className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-1 ring-slate-100 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-0 ${direction === 'TMT_TO_USDT' ? 'translate-x-full' : 'translate-x-0'
            }`}
        />
        <button
          onClick={() => setDirection('USDT_TO_TMT')}
          className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest transition-all relative z-10 ${direction === 'USDT_TO_TMT' ? 'text-slate-900' : 'text-slate-400'
            }`}
        >
          {t(language, 'sell')} USDT
        </button>
        <button
          onClick={() => setDirection('TMT_TO_USDT')}
          className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest transition-all relative z-10 ${direction === 'TMT_TO_USDT' ? 'text-slate-900' : 'text-slate-400'
            }`}
        >
          {t(language, 'buy')} USDT
        </button>
      </div>

      {/* Основная карточка */}
      <div className="bg-white p-7 rounded-[3rem] shadow-[0_20px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 space-y-7 relative overflow-hidden group">
        {/* Декоративные градиенты */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-100/40 rounded-full -mr-20 -mt-20 blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-100/30 rounded-full -ml-20 -mb-20 blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" />

        {/* Курс и Инфо */}
        <div className="flex justify-between items-center bg-slate-50/50 backdrop-blur-sm p-4 rounded-[2rem] ring-1 ring-slate-100/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Zap className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{t(language, 'exRate')}</p>
              <p className="text-[15px] font-black text-slate-800">1 USDT = {settings.EXCHANGE_RATE} TMT</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{t(language, 'exCommission')}</p>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-sm font-black text-indigo-600">{settings.EXCHANGE_FEE} TMT (fix)</span>
              <Info className="w-3 h-3 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Секция Ввода */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-end px-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {direction === 'USDT_TO_TMT' ? t(language, 'exYouGive') : t(language, 'exYouPay')}
            </label>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full ring-1 ring-slate-100">
              <WalletIcon className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-600">
                {direction === 'USDT_TO_TMT' ? `${balances.usdt.toFixed(2)} USDT` : `${balances.tmt.toFixed(2)} TMT`}
              </span>
            </div>
          </div>
          <div className="group relative">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="text-3xl font-black text-slate-200 group-focus-within:text-indigo-400 transition-colors duration-300">
                {direction === 'USDT_TO_TMT' ? '₮' : 'm'}
              </span>
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-12 pr-24 py-7 text-4xl font-black text-slate-800 bg-slate-50/50 rounded-[2.5rem] ring-1 ring-slate-200/60 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all duration-300 placeholder:text-slate-200 shadow-sm"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-2xl shadow-sm ring-1 ring-slate-100 font-black text-sm text-slate-500">
              {direction === 'USDT_TO_TMT' ? 'USDT' : 'TMT'}
            </div>
          </div>
        </div>

        {/* Кнопка реверса с анимацией */}
        <div className="flex justify-center -my-3.5 relative z-10">
          <button
            onClick={handleReverse}
            className="group bg-white p-4 rounded-[1.5rem] shadow-[0_8px_20px_rgba(0,0,0,0.06)] ring-1 ring-slate-100 text-indigo-500 active:scale-90 hover:scale-110 transition-all duration-300 hover:rotate-180"
          >
            <ArrowDownUp className="w-7 h-7" />
          </button>
        </div>

        {/* Секция Результата */}
        <div className="space-y-3.5">
          <div className="px-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t(language, 'receiveAmount')}</label>
          </div>
          <div className="flex items-center justify-between bg-gradient-to-br from-indigo-50/80 to-blue-50/50 p-7 rounded-[2.5rem] ring-1 ring-indigo-100/50 relative overflow-hidden group/res">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 blur-2xl rounded-full -mr-16 -mt-16" />
            <div className="relative z-10">
              <p className={`text-4xl font-black tracking-tight ${direction === 'USDT_TO_TMT' ? 'text-slate-800' : 'text-indigo-600'}`}>
                {calculated.receive}
              </p>
              <p className="text-[11px] font-black text-indigo-400 uppercase mt-1 tracking-widest">~ {direction === 'USDT_TO_TMT' ? t(language, 'exTMTName') : t(language, 'exUSDTName')}</p>
            </div>
            <div className="relative z-10 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm ring-1 ring-indigo-100 font-black text-sm text-indigo-600">
              {direction === 'USDT_TO_TMT' ? 'TMT' : 'USDT'}
            </div>
          </div>
        </div>

        {/* Комиссия с детализацией */}
        <div className="bg-slate-50/80 p-5 rounded-[2rem] space-y-3 ring-1 ring-slate-100">
          <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-400">
            <span>{t(language, 'exCommission')}</span>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{calculated.fee} USDT</span>
          </div>
          <div className="h-px bg-slate-200/50" />
          <div className="flex justify-between text-xs items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-slate-500 font-bold">{t(language, 'walBonusAccount')}</span>
            </div>
            <span className="font-black text-slate-700">{balances.bonus.toFixed(2)} USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
            {t(language, 'exFeeNote')}
          </p>
        </div>

        {/* Ввод телефона */}
        {direction === 'USDT_TO_TMT' && (
          <div className="space-y-3.5 pt-1">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">
              {t(language, 'exWhereToSend')}
            </label>
            <div className="flex items-center gap-4 bg-slate-50/50 p-5 rounded-2xl ring-1 ring-slate-200/60 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:bg-white transition-all duration-300">
              <Phone className="w-6 h-6 text-slate-300" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t(language, 'exPhonePlaceholder')}
                className="w-full text-lg font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-200"
              />
            </div>
          </div>
        )}

        {/* Кнопка действия */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !amount}
          className={`w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-4 group ${direction === 'USDT_TO_TMT'
              ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-200'
              : 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-indigo-200'
            }`}
        >
          {isSubmitting ? (
            <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {direction === 'USDT_TO_TMT' ? t(language, 'sell') : t(language, 'buy')} USDT
              <Zap className="w-6 h-6 fill-current group-hover:scale-125 transition-transform" />
            </>
          )}
        </button>

        {/* Помощь для покупки */}
        {direction === 'TMT_TO_USDT' && (
          <div className="bg-amber-50/60 p-5 rounded-[2rem] border border-amber-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200/20 blur-xl rounded-full" />
            <div className="flex items-center gap-3 mb-2.5 relative z-10">
              <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                <Info className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-[11px] font-black text-amber-700 uppercase tracking-widest">{t(language, 'whatToDo')}</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900/80 font-bold relative z-10">
              {t(language, 'exInstruction').replace('{amount}', amount || '0').replace('{phone}', settings.RECEIVE_PHONE)}
            </p>
          </div>
        )}
      </div>

      {/* История с премиальным видом */}
      {history.length > 0 && (
        <div className="space-y-5">
          <div className="flex justify-between items-center px-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">{t(language, 'exHistory')}</h3>
            <span className="text-[10px] font-black text-white bg-slate-800 px-2.5 py-1 rounded-full shadow-lg shadow-slate-200">{history.length}</span>
          </div>
          <div className="space-y-4">
            {history.map(req => (
              <div key={req.id} className="bg-white p-5 rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 flex justify-between items-center group active:scale-95 transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-inner transition-colors duration-500 ${req.direction === 'USDT_TO_TMT' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-100' : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100'
                    }`}>
                    {req.direction === 'USDT_TO_TMT' ? <ArrowRightLeft className="w-7 h-7 rotate-90" /> : <ArrowRightLeft className="w-7 h-7 -rotate-90" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-slate-800">
                        {req.amountUsdt} USDT ↔ {req.amountTmt} TMT
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" /> {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                      <div className="w-1 h-1 bg-slate-200 rounded-full" />
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t(language, 'exCommission')}: {req.commission.toFixed(2)} USDT</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {req.status === 'PENDING' && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] font-black text-amber-500 bg-amber-50/50 px-3 py-1.5 rounded-xl uppercase tracking-tighter ring-1 ring-amber-100 animate-pulse">
                        {t(language, 'exPending')}
                      </span>
                    </div>
                  )}
                  {req.status === 'COMPLETED' && (
                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-50/50 px-3 py-1.5 rounded-xl uppercase tracking-tighter ring-1 ring-emerald-100">
                      {t(language, 'exSuccess')}
                    </span>
                  )}
                  {req.status === 'CANCELLED' && (
                    <span className="text-[9px] font-black text-rose-500 bg-rose-50/50 px-3 py-1.5 rounded-xl uppercase tracking-tighter ring-1 ring-rose-100">
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



'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { Eye, EyeOff, Plus, ArrowDownToLine, RefreshCcw, X, Copy, CheckCircle2, Clock } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

// АДРЕСА ВАШИХ ЭСКРОУ КОШЕЛЬКОВ (Замените на свои реальные)
const ESCROW_WALLETS = {
  TRC20: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  BEP20: '0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  APTOS: '0xAPTOSXXXXXXXXXXXXXXXXXXXXXXXXXXX'
};

export default function WalletScreen() {
  const { language, isBalanceVisible, toggleBalance, balances, setActiveTab, user, initUser, addToast } = useAppStore();
  
  const [modalType, setModalType] = useState<'none' | 'deposit' | 'withdraw'>('none');
  const [network, setNetwork] = useState<'TRC20' | 'BEP20' | 'APTOS'>('TRC20');
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState(''); // Для пополнения
  const [address, setAddress] = useState(''); // Для вывода
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    try {
      const res = await fetch(`/api/wallet/transactions?userId=${user.id}`);
      setHistory(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Скопировано', 'info');
  };

  const handleTransaction = async () => {
    if (!amount || Number(amount) <= 0) {
      addToast('Введите сумму', 'error'); return;
    }
    if (modalType === 'withdraw' && (!address || address.length < 10)) {
      addToast('Введите корректный адрес', 'error'); return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: modalType === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL',
          network,
          amount: Number(amount),
          txId: modalType === 'deposit' ? txId : null,
          address: modalType === 'withdraw' ? address : null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Заявка создана! Ожидайте подтверждения.', 'success');
        setModalType('none');
        setAmount(''); setTxId(''); setAddress('');
        await initUser(WebApp.initDataUnsafe.user);
        loadHistory();
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
    <div className="px-5 py-2 space-y-8 animate-in fade-in duration-500 pb-32">
      {/* Главная карточка баланса */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-[2rem] p-7 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <img src="/init.png" alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-white/30" />
              <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">{t(language, 'balanceLabel')}</span>
            </div>
            <button onClick={toggleBalance} className="p-2 bg-white/10 rounded-full active:scale-95">
              {isBalanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <h2 className="text-4xl font-bold">
            {isBalanceVisible ? balances.tmt.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '****'} <span className="text-lg">TMT</span>
          </h2>
          <div className="mt-2 text-sm font-medium text-emerald-100">
             {isBalanceVisible ? balances.usdt.toFixed(2) : '****'} USDT
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-8 relative z-10">
          <button onClick={() => setModalType('deposit')} className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center transition-all active:scale-95"><Plus className="w-6 h-6" /></div>
            <span className="text-[10px] font-medium text-emerald-50">{t(language, 'salmak')}</span>
          </button>
          <button onClick={() => setModalType('withdraw')} className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center transition-all active:scale-95"><ArrowDownToLine className="w-5 h-5" /></div>
            <span className="text-[10px] font-medium text-emerald-50">{t(language, 'cykarmak')}</span>
          </button>
          <button onClick={() => setActiveTab('exchange')} className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 bg-white text-emerald-600 shadow-lg rounded-2xl flex items-center justify-center transition-all active:scale-95"><RefreshCcw className="w-5 h-5" /></div>
            <span className="text-[10px] font-medium text-emerald-50">{t(language, 'alyCaly')}</span>
          </button>
        </div>
      </div>

      {/* История крипто-транзакций */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">{t(language, 'codesHistory')}</h3>
          {history.map(tx => (
            <div key={tx.id} className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${tx.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {tx.type === 'DEPOSIT' ? t(language, 'salmak') : t(language, 'cykarmak')} {tx.network}
                  </span>
                </div>
                <div className="font-bold text-slate-800 text-sm">{tx.amount} USDT</div>
              </div>
              <div className="text-right">
                {tx.status === 'PENDING' && <span className="flex items-center gap-1 text-xs font-bold text-amber-500"><Clock className="w-3 h-3" /> {t(language, 'adminPending')}</span>}
                {tx.status === 'COMPLETED' && <span className="flex items-center gap-1 text-xs font-bold text-emerald-500"><CheckCircle2 className="w-3 h-3" /> {t(language, 'statusCompleted')}</span>}
                {tx.status === 'CANCELLED' && <span className="text-xs font-bold text-red-500">{t(language, 'statusCancelled')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* МОДАЛКА ВВОДА / ВЫВОДА */}
      {modalType !== 'none' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">
                {modalType === 'deposit' ? 'Пополнить USDT' : 'Вывести USDT'}
              </h3>
              <button onClick={() => setModalType('none')} className="p-2 bg-slate-100 rounded-full active:scale-95"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              {/* Выбор сети */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{t(language, 'walyutalar')}</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {['TRC20', 'BEP20', 'APTOS'].map((net: any) => (
                    <button key={net} onClick={() => setNetwork(net)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${network === net ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              {/* Логика пополнения (Депозит) */}
              {modalType === 'deposit' && (
                <>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                    <p className="text-xs font-medium text-slate-500 mb-1">{t(language, 'adminSendToAddress')} USDT ({network}):</p>
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg ring-1 ring-blue-200 mt-2">
                      <span className="text-xs font-bold truncate text-slate-800">{ESCROW_WALLETS[network]}</span>
                      <button onClick={() => copyToClipboard(ESCROW_WALLETS[network])} className="text-blue-500 p-1"><Copy className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{t(language, 'amount')}</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 ring-1 ring-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">TxID ({t(language, 'adminTxId')}) - {t(language, 'adminReturn')}</label>
                    <input type="text" value={txId} onChange={e => setTxId(e.target.value)} placeholder={t(language, 'adminTxId')} className="w-full bg-slate-50 ring-1 ring-slate-200 rounded-xl px-4 py-3 font-bold outline-none text-xs focus:ring-emerald-500" />
                  </div>
                </>
              )}

              {/* Логика вывода (Снятие) */}
              {modalType === 'withdraw' && (
                <>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-700 uppercase">{t(language, 'adminReturn')} {t(language, 'navAlys')}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{t(language, 'amount')} ({t(language, 'adminPending')}: {balances.usdt.toFixed(2)} USDT)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 ring-1 ring-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{t(language, 'adminSendToAddress')} ({network})</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder={t(language, 'adminSendToAddress')} className="w-full bg-slate-50 ring-1 ring-slate-200 rounded-xl px-4 py-3 font-bold outline-none text-xs focus:ring-emerald-500" />
                  </div>
                </>
              )}

              <button onClick={handleTransaction} disabled={isSubmitting} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg mt-4 active:scale-95 transition-all">
                {isSubmitting ? t(language, 'processing') : modalType === 'deposit' ? t(language, 'adminConfirm') : t(language, 'cykarmak')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
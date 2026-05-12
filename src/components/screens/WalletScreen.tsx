'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import {
  Eye, EyeOff, Plus, ArrowDownToLine, RefreshCcw, X, Copy, CheckCircle2, Clock,
  MapPin, Zap, Star, AlertTriangle, ArrowRightLeft, QrCode, Loader2, ShieldCheck, Gift
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { QRCodeSVG } from 'qrcode.react';
import { haptic } from '@/lib/haptic';
import Skeleton from '@/components/ui/Skeleton';
import PullToRefresh from '@/components/ui/PullToRefresh';

const MIN_DEPOSIT_USDT = 1;

const validateAddress = (address: string, network: string): boolean => {
  if (!address) return false;
  if (network === 'TRC20') return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
  if (network === 'BEP20') return /^0x[a-fA-F0-9]{40}$/.test(address);
  if (network === 'APTOS') return /^0x[a-fA-F0-9]{64}$/.test(address);
  return false;
};

export default function WalletScreen() {
  const {
    language,
    isBalanceVisible,
    toggleBalance,
    balances,
    setActiveTab,
    user,
    initUser,
    addToast,
  } = useAppStore();

  const [modalType, setModalType] = useState<'none' | 'deposit' | 'withdraw'>('none');
  const [depositMethod, setDepositMethod] = useState<'crypto' | 'cash' | 'rapCode'>('crypto');
  const [withdrawMethod, setWithdrawMethod] = useState<'crypto' | 'cash' | 'rapCode'>('crypto');

  const [network, setNetwork] = useState<'TRC20' | 'BEP20' | 'APTOS'>('TRC20');
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState('');
  const [address, setAddress] = useState('');
  const [depositAddress, setDepositAddress] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [city, setCity] = useState(t(language, 'walAshgabat'));
  const [rapCode, setRapCode] = useState('');

  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'DEPOSIT' | 'WITHDRAWAL' | 'SWAP'>('all');
  const [isFullHistoryOpen, setIsFullHistoryOpen] = useState(false);
  const [show2FAPrompt, setShow2FAPrompt] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');

  const [rates, setRates] = useState({
    usdToTmt: 3.50,
    usdtToTmt: 19.50,
    change24h: 1.2,
    lastUpdated: Date.now(),
  });
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const [isClaiming, setIsClaiming] = useState(false);

  const claimFaucet = async () => {
    haptic.medium();
    if (!user?.id) {
      addToast(t(language, 'walUserNotAuth'), 'error');
      return;
    }
    setIsClaiming(true);
    try {
      const res = await fetch('/api/wallet/claim-test-usdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(t(language, 'walClaimSuccess'), 'success');
        await initUser(WebApp.initData);
      } else {
        addToast(data.error || t(language, 'walClaimError'), 'error');
      }
    } catch (e) {
      addToast(t(language, 'networkError'), 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  const fetchDepositAddress = async (net: string) => {
    setIsLoadingAddress(true);
    try {
      const res = await fetch(`/api/wallet/deposit-address?network=${net}`);
      if (res.ok) {
        const data = await res.json();
        setDepositAddress(data.address);
      } else {
        addToast(t(language, 'walAddrError'), 'error');
      }
    } catch (error) {
      console.error(error);
      addToast(t(language, 'networkError'), 'error');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  useEffect(() => {
    if (modalType === 'deposit' && depositMethod === 'crypto') {
      fetchDepositAddress(network);
    }
  }, [network, modalType, depositMethod]);

  const getSafeStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'PENDING': t(language, 'walStatusPending'),
      'PROCESSING': t(language, 'walStatusProcessing'),
      'COMPLETED': t(language, 'walStatusCompleted'),
      'FAILED': t(language, 'walStatusFailed'),
      'CANCELLED': t(language, 'walStatusCancelled')
    };
    return statusMap[status] || status;
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const [txRes, exRes] = await Promise.all([
        fetch(`/api/wallet/transactions?userId=${user.id}`),
        fetch(`/api/exchange?userId=${user.id}`)
      ]);

      let txData = [];
      let exData = [];

      if (txRes.ok) {
        const resJson = await txRes.json();
        txData = resJson.transactions || [];
      }
      if (exRes.ok) exData = await exRes.json();

      const normalizedExchanges = (Array.isArray(exData) ? exData : []).map(ex => ({
        id: `swap-${ex.id}`,
        type: 'SWAP',
        amount: ex.direction === 'USDT_TO_TMT' ? ex.amountUsdt : ex.amountTmt,
        currencyText: ex.direction === 'USDT_TO_TMT' ? 'USDT ➔ TMT' : 'TMT ➔ USDT',
        status: ex.status,
        createdAt: ex.createdAt,
        txId: ex.id.toString(),
      }));

      const combined = [...(Array.isArray(txData) ? txData : []), ...normalizedExchanges];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setHistory(combined);
    } catch (e) { console.error(e); }
    finally { setIsLoadingHistory(false); }
  };

  const fetchSavedAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const res = await fetch('/api/wallet/addresses');
      if (res.ok) {
        const data = await res.json();
        setSavedAddresses(data.addresses || []);
      }
    } catch (error) { console.error(error); }
    finally { setIsLoadingAddresses(false); }
  };

  const fetchRates = async () => {
    setIsLoadingRates(true);
    try {
      const res = await fetch('/api/market-price?asset=USDT&fiat=TMT');
      const data = await res.json();
      setRates(prev => ({
        ...prev,
        usdtToTmt: data.basePrice || 19.50,
        change24h: data.change24h || 0,
        lastUpdated: Date.now(),
      }));
    } catch (error) { console.error(error); }
    finally { setIsLoadingRates(false); }
  };

  useEffect(() => {
    loadHistory();
    fetchRates();
    fetchSavedAddresses();
    const interval = setInterval(() => {
      initUser(WebApp.initData);
      loadHistory();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshBalance = async () => {
    haptic.medium();
    setIsLoadingRates(true);
    await initUser(WebApp.initData);
    await fetchRates();
    loadHistory();
    addToast(t(language, 'walBalanceUpdated'), 'info');
  };

  const copyToClipboard = (text: string) => {
    haptic.light();
    navigator.clipboard.writeText(text);
    addToast(t(language, 'walCopied'), 'info');
  };

  const filteredHistory = useMemo(() => {
    return history.filter((tx) => {
      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesSearch = !searchQuery ||
        tx.txId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.amount.toString().includes(searchQuery) ||
        new Date(tx.createdAt).toLocaleDateString('ru-RU').includes(searchQuery);
      return matchesType && matchesSearch;
    });
  }, [history, filterType, searchQuery]);

  const mainHistory = filteredHistory.slice(0, 20);

  const handleTransaction = async (tokenOverride?: string) => {
    haptic.medium();
    if ((modalType === 'deposit' && depositMethod === 'rapCode') ||
      (modalType === 'withdraw' && withdrawMethod === 'rapCode')) {
      return addToast(t(language, 'walInDev'), 'info');
    }

    if (!amount || Number(amount) <= 0) return addToast(t(language, 'walEnterAmount'), 'error');

    if (modalType === 'deposit' && depositMethod === 'crypto' && Number(amount) < MIN_DEPOSIT_USDT) {
      return addToast(t(language, 'walMinDeposit').replace('{amount}', MIN_DEPOSIT_USDT.toString()), 'error');
    }

    if (modalType === 'withdraw' && withdrawMethod === 'crypto') {
      if (!validateAddress(address, network)) return addToast(t(language, 'walInvalidAddr').replace('{network}', network), 'error');
      if (Number(amount) > balances.usdt) return addToast(t(language, 'walInsuffBalance'), 'error');
    }

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const currentToken = tokenOverride || twoFactorToken;
      if (currentToken) {
        headers['x-2fa-token'] = currentToken;
      }

      const res = await fetch('/api/wallet/transactions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.id,
          type: modalType === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL',
          amount: Number(amount),
          network,
          method: modalType === 'deposit' ? depositMethod : withdrawMethod,
          address,
          txId,
          city,
          rapCode
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast(t(language, 'walRequestCreated'), 'success');
        setModalType('none');
        setShow2FAPrompt(false);
        setTwoFactorToken('');
        setAmount('');
        loadHistory();
      } else if (data.error === '2FA_REQUIRED') {
        setShow2FAPrompt(true);
      } else {
        addToast(data.error || t(language, 'requestError'), 'error');
      }
    } catch (e) {
      addToast(t(language, 'requestError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPullRefresh = async () => {
    haptic.impact('heavy');
    await Promise.all([
      initUser(WebApp.initData),
      fetchRates(),
      loadHistory()
    ]);
  };

  const TransactionCard = ({ tx }: { tx: any }) => (
    <div
      onClick={() => haptic.light()}
      className="bg-white p-4 rounded-[2rem] flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600' :
            tx.type === 'SWAP' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
          }`}>
          {tx.type === 'DEPOSIT' ? <Plus className="w-6 h-6" /> :
            tx.type === 'SWAP' ? <ArrowRightLeft className="w-6 h-6" /> : <ArrowDownToLine className="w-6 h-6" />}
        </div>
        <div>
          <div className="text-[15px] font-bold text-slate-800">
            {tx.amount} {tx.type === 'SWAP' ? tx.currencyText : 'USDT'}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {new Date(tx.createdAt).toLocaleDateString('ru-RU')} {new Date(tx.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-[11px] font-bold flex items-center justify-end gap-1.5 px-2.5 py-1 rounded-full ${tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
            tx.status === 'FAILED' ? 'bg-rose-50 text-rose-600' :
              tx.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
          }`}>
          {tx.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
            tx.status === 'FAILED' ? <X className="w-3.5 h-3.5" /> :
              tx.status === 'PROCESSING' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
          {getSafeStatusLabel(tx.status)}
        </div>
        <div className="text-[10px] text-slate-300 font-mono mt-1.5 opacity-70 tracking-tighter">{tx.txId?.slice(0, 12)}...</div>
      </div>
    </div>
  );

  return (
    <PullToRefresh onRefresh={onPullRefresh}>
      <div className="px-5 py-2 space-y-6 pb-32 animate-in fade-in duration-500">
        {/* Brand Icon */}

        {/* Главная карточка */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-emerald-900 rounded-[3rem] p-9 text-white shadow-[0_20px_50px_rgba(16,185,129,0.2)] relative overflow-hidden group">
          {/* Декоративные элементы */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
          <div className="flex justify-start items-center mb-[-8px]">
            <img src="/init.png" alt="Logo" className="h-10 w-auto object-contain" />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">{t(language, 'balanceLabel')}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={handleRefreshBalance} className="p-2.5 bg-white/5 backdrop-blur-md rounded-2xl active:scale-90 transition-all border border-white/10 hover:bg-white/10">
                  <RefreshCcw className={`w-4 h-4 ${isLoadingRates ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={toggleBalance} className="p-2.5 bg-white/5 backdrop-blur-md rounded-2xl active:scale-90 transition-all border border-white/10 hover:bg-white/10">
                  {isBalanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-5xl font-black tracking-tight">
                {isBalanceVisible ? balances.tmt.toLocaleString() : '••••••'} <span className="text-xl font-medium opacity-40">TMT</span>
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-emerald-400/90 font-bold text-lg">
                  {isBalanceVisible ? balances.usdt.toFixed(2) : '••••'} <span className="text-sm opacity-60 font-medium">USDT</span>
                </p>
                <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${rates.change24h >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {rates.change24h >= 0 ? '+' : ''}{rates.change24h}%
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8 relative z-10">
            <button onClick={() => { haptic.medium(); setModalType('deposit'); }} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase">{t(language, 'salmak')}</span>
            </button>
            <button onClick={() => {
              haptic.medium();
              if (user?.kycStatus !== 'VERIFIED') {
                addToast(t(language, 'walKycRequired'), 'error');
                setActiveTab('profile');
                return;
              }
              if ((user?.level === 'Pro' || user?.level === 'Partner') && !user?.twoFactorEnabled) {
                addToast(t(language, 'wal2faRequiredLevel'), 'error');
                setActiveTab('profile');
                return;
              }
              setModalType('withdraw');
            }} className="flex flex-col items-center gap-2 group/btn">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/5">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter opacity-60 group-hover/btn:opacity-100 transition-opacity">{t(language, 'cykarmak')}</span>
            </button>
            <button onClick={() => { haptic.medium(); setActiveTab('exchange'); }} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white text-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase text-white">{t(language, 'alyCaly')}</span>
            </button>
          </div>
        </div>

        {/* Детализация активов */}
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-[11px] font-black text-white shadow-lg shadow-emerald-100">U</div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">USDT</span>
                </div>
                <ArrowRightLeft className="w-3 h-3 text-slate-200" />
              </div>
              {isLoadingRates ? <Skeleton className="h-8 w-24 mb-2" /> : <div className="text-2xl font-black text-slate-800 tracking-tight mb-1">{isBalanceVisible ? balances.usdt.toFixed(2) : '****'}</div>}
              {isLoadingRates ? <Skeleton className="h-5 w-32" /> : <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg inline-block">1 USDT ≈ {rates.usdtToTmt.toFixed(2)} TMT</div>}
              {/* Кнопка получения тестовых USDT */}
              <button
                onClick={claimFaucet}
                disabled={isClaiming}
                className="mt-4 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xs tracking-wider flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-60 shadow-lg shadow-emerald-200"
              >
                {isClaiming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
                {t(language, 'walGetTestUsdt')}
              </button>
            </div>
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-[11px] font-black text-white shadow-lg shadow-blue-100">T</div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">TMT</span>
                </div>
                <Zap className="w-3 h-3 text-slate-200" />
              </div>
              {isLoadingRates ? <Skeleton className="h-8 w-24 mb-2" /> : <div className="text-2xl font-black text-slate-800 tracking-tight mb-1">{isBalanceVisible ? balances.tmt.toFixed(2) : '****'}</div>}
              {isLoadingRates ? <Skeleton className="h-5 w-32" /> : <div className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg inline-block">{t(language, 'localCurrency')}</div>}
            </div>
          </div>

          {/* Бонусный счет */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-[2.5rem] shadow-sm border border-amber-100 hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-200/20 rounded-full blur-2xl group-hover:bg-amber-200/40 transition-colors"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest block">{t(language, 'walBonusAccount')}</span>
                  <div className="text-2xl font-black text-slate-800 tracking-tight">
                    {isBalanceVisible ? balances.bonus.toFixed(2) : '****'} <span className="text-sm font-bold text-slate-400">USDT</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-amber-600 bg-white/60 px-3 py-1.5 rounded-xl border border-amber-100 inline-block">
                  {t(language, 'walAvailableForExchange')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* История с фильтрами */}
        <div className="space-y-5">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{t(language, 'walHistory')}</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <Clock className="w-3 h-3" />
              Auto-refresh ON
            </div>
          </div>

          <div className="space-y-4">
            {/* Поиск */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </div>
              <input
                type="text"
                placeholder={t(language, 'walSearchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl text-[13px] font-medium border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Фильтры */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['all', 'DEPOSIT', 'WITHDRAWAL', 'SWAP'].map(type => (
                <button
                  key={type}
                  onClick={() => { haptic.selection(); setFilterType(type as any); }}
                  className={`px-6 py-3 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all ${filterType === type ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105' : 'bg-white text-slate-400 border border-slate-50 hover:bg-slate-50'}`}
                >
                  {type === 'all' ? t(language, 'walFilterAll') : type === 'SWAP' ? t(language, 'walFilterExchange') : type === 'DEPOSIT' ? t(language, 'walFilterDeposit') : t(language, 'walFilterWithdraw')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {isLoadingHistory ? (
              [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-[2rem]" />)
            ) : (
              <>
                {mainHistory.map((tx) => <TransactionCard key={tx.id} tx={tx} />)}

                {mainHistory.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t(language, 'walNoOps')}</p>
                  </div>
                )}

                {filteredHistory.length > 20 && (
                  <button
                    onClick={() => { haptic.medium(); setIsFullHistoryOpen(true); }}
                    className="w-full py-5 mt-2 text-xs font-black uppercase tracking-widest text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
                  >
                    {t(language, 'walSeeAll').replace('{count}', filteredHistory.length.toString())}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Полное окно истории */}
        {isFullHistoryOpen && (
          <div className="fixed inset-0 z-[150] bg-slate-50 overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-5 flex items-center justify-between shadow-sm z-10">
              <h2 className="text-lg font-black text-slate-800">{t(language, 'walFullHistory')}</h2>
              <button onClick={() => setIsFullHistoryOpen(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 pb-20">
              {filteredHistory.map((tx) => <TransactionCard key={`full-${tx.id}`} tx={tx} />)}
            </div>
          </div>
        )}

        {/* Модалка пополнения */}
        {modalType === 'deposit' && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-end justify-center p-4">
            <div className="bg-slate-50 w-full max-w-xl rounded-[3rem] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>

              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{t(language, 'walDeposit')}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t(language, 'walSelectPaymentMethod')}</p>
                </div>
                <button onClick={() => setModalType('none')} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl active:scale-90 transition-all"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-3 gap-3">
                  {(['crypto', 'cash', 'rapCode'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { haptic.selection(); setDepositMethod(m); }}
                      className={`flex flex-col items-center p-4 rounded-[2rem] gap-3 transition-all border ${depositMethod === m ? 'bg-white border-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.1)] text-emerald-600' : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'}`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${depositMethod === m ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50'}`}>
                        {m === 'crypto' ? <Zap className="w-5 h-5" /> : m === 'cash' ? <MapPin className="w-5 h-5" /> : <Star className="w-5 h-5" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider">{m === 'crypto' ? t(language, 'walCrypto') : m === 'cash' ? t(language, 'walCash') : t(language, 'walRapCode')}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-6">
                  {depositMethod === 'crypto' && (
                    <div className="space-y-6">
                      <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
                        {['TRC20', 'BEP20', 'APTOS'].map(n => (
                          <button key={n} onClick={() => { haptic.selection(); setNetwork(n as any); }} className={`flex-1 py-3 rounded-2xl text-[11px] font-black transition-all ${network === n ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{n}</button>
                        ))}
                      </div>

                      <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50 relative group">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t(language, 'walDepositAddr')} {network}</span>
                          <div className="flex gap-2">
                            <button onClick={() => { haptic.medium(); setShowQR(!showQR); }} disabled={!depositAddress || isLoadingAddress} className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm active:scale-90 transition-all hover:bg-emerald-50 disabled:opacity-50"><QrCode className="w-4 h-4" /></button>
                            <button onClick={() => copyToClipboard(depositAddress)} disabled={!depositAddress || isLoadingAddress} className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm active:scale-90 transition-all hover:bg-emerald-50 disabled:opacity-50"><Copy className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="min-h-[60px] flex items-center justify-center bg-white/50 p-4 rounded-2xl border border-emerald-50">
                          {isLoadingAddress ? (
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                          ) : (
                            <div className="text-[13px] font-mono break-all font-bold text-slate-700 leading-relaxed">{depositAddress || t(language, 'loading')}</div>
                          )}
                        </div>

                        {showQR && depositAddress && !isLoadingAddress && (
                          <div className="mt-6 flex flex-col items-center p-6 bg-white rounded-[2rem] shadow-inner border border-emerald-50 animate-in zoom-in duration-300">
                            <QRCodeSVG value={depositAddress} size={200} />
                            <p className="text-[10px] text-slate-400 mt-4 font-black uppercase tracking-widest">{t(language, 'walScanToPay')}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest flex justify-between">
                            <span>{t(language, 'walAmountUsdt')}</span>
                            <span className="text-emerald-500">Min: {MIN_DEPOSIT_USDT}</span>
                          </label>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white font-black text-lg transition-all outline-none shadow-sm"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">{t(language, 'walTxHash')}</label>
                          <input
                            type="text"
                            value={txId}
                            onChange={(e) => setTxId(e.target.value)}
                            className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white text-xs font-mono font-bold transition-all outline-none shadow-sm"
                            placeholder={t(language, 'walEnterTxId')}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {depositMethod === 'cash' && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">{t(language, 'walYourCity')}</label>
                        <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-slate-700 outline-none border-2 border-transparent focus:border-emerald-500 transition-all appearance-none shadow-sm">
                          {[t(language, 'walAshgabat'), t(language, 'walTurkmenabad'), t(language, 'walMary'), t(language, 'walDashoguz'), t(language, 'walBalkanabad')].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">{t(language, 'amount')}</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-lg outline-none border-2 border-transparent focus:border-emerald-500 transition-all shadow-sm" placeholder={t(language, 'amount') + ' USDT'} />
                      </div>
                      <div className="p-5 bg-amber-50/50 rounded-[2rem] border border-amber-100 flex gap-4">
                        <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[11px] text-amber-800 font-bold leading-relaxed">{t(language, 'walCashOperatorNote').replace('{city}', city)}</p>
                      </div>
                    </div>
                  )}

                  {depositMethod === 'rapCode' && (
                    <div className="space-y-6">
                      <div className="p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 flex gap-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                          <Star className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[11px] text-indigo-800 font-bold leading-relaxed">{t(language, 'walRapCodeActivationNote')}</p>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">{t(language, 'walActivationCode')}</label>
                        <input type="text" value={rapCode} onChange={(e) => setRapCode(e.target.value)} className="w-full p-6 bg-slate-50 rounded-2xl font-black text-center text-xl tracking-[0.3em] uppercase outline-none border-2 border-transparent focus:border-indigo-500 transition-all shadow-sm" placeholder="XXXX-XXXX-XXXX" />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTransaction()}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm tracking-widest shadow-2xl shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : t(language, 'walSubmitRequest')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модалка вывода */}
        {modalType === 'withdraw' && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-end justify-center p-4">
            <div className="bg-slate-50 w-full max-w-xl rounded-[3rem] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl"></div>

              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{t(language, 'walWithdrawal')}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t(language, 'walWithdrawalNote')}</p>
                </div>
                <button onClick={() => setModalType('none')} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl active:scale-90 transition-all"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-3 gap-3">
                  {(['crypto', 'cash', 'rapCode'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { haptic.selection(); setWithdrawMethod(m); }}
                      className={`flex flex-col items-center p-4 rounded-[2rem] gap-3 transition-all border ${withdrawMethod === m ? 'bg-slate-900 border-slate-900 shadow-xl text-white' : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'}`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${withdrawMethod === m ? 'bg-white/10' : 'bg-slate-50'}`}>
                        {m === 'crypto' ? <Zap className="w-5 h-5" /> : m === 'cash' ? <MapPin className="w-5 h-5" /> : <Star className="w-5 h-5" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider">{m === 'crypto' ? t(language, 'walCrypto') : m === 'cash' ? t(language, 'walCash') : t(language, 'walRapCode')}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-6">
                  {withdrawMethod === 'crypto' && (
                    <div className="space-y-6">
                      <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
                        {['TRC20', 'BEP20', 'APTOS'].map(n => (
                          <button key={n} onClick={() => { haptic.selection(); setNetwork(n as any); }} className={`flex-1 py-3 rounded-2xl text-[11px] font-black transition-all ${network === n ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{n}</button>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center ml-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t(language, 'walRecipientAddr')}</label>
                          {address && (
                            <div className={`flex items-center gap-1 text-[10px] font-black ${validateAddress(address, network) ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {validateAddress(address, network) ? <><CheckCircle2 className="w-3 h-3" /> {t(language, 'walValidFormat')}</> : <><X className="w-3 h-3" /> {t(language, 'walInvalidFormat')}</>}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full p-5 bg-slate-50 rounded-2xl text-[13px] font-mono font-bold border-2 border-transparent focus:border-slate-900 focus:bg-white transition-all outline-none shadow-sm"
                            placeholder={t(language, 'walEnterNetworkAddr').replace('{network}', network)}
                          />
                          {savedAddresses.length > 0 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                              {savedAddresses.filter(a => a.network === network).map(a => (
                                <button key={a.id} onClick={() => { haptic.light(); setAddress(a.address); }} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 whitespace-nowrap transition-colors border border-slate-200/50">
                                  {a.label || a.address.slice(0, 6) + '...'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t(language, 'walWithdrawAmount')}</label>
                          <button onClick={() => { haptic.light(); setAmount((balances.usdt - (network === 'TRC20' ? 1 : 0.5)).toFixed(2)); }} className="text-[10px] font-black text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors">{t(language, 'walWithdrawAll')}</button>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-5 bg-slate-50 rounded-2xl font-black text-lg border-2 border-transparent focus:border-slate-900 focus:bg-white transition-all outline-none shadow-sm"
                            placeholder="0.00"
                          />
                          <span className="absolute right-5 top-5 text-slate-300 font-bold">USDT</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-400">{t(language, 'walNetworkFeeLabel')}</span>
                            <span className="text-slate-800">{network === 'TRC20' ? '1.00' : '0.50'} USDT</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-black border-t border-slate-100 pt-2">
                            <span className="text-slate-500">{t(language, 'walToReceive')}</span>
                            <span className="text-emerald-600 text-sm">{amount ? (Math.max(0, Number(amount) - (network === 'TRC20' ? 1 : 0.5))).toFixed(2) : '0.00'} USDT</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {withdrawMethod === 'cash' && (
                    <div className="space-y-6 text-center py-4">
                      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-rose-100">
                        <MapPin className="w-10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-black text-xl text-slate-800 tracking-tight">{t(language, 'walCashWithdrawal')}</h4>
                        <p className="text-[11px] text-slate-400 font-bold px-8 leading-relaxed uppercase tracking-widest">{t(language, 'walSelectCityWithdraw')}</p>
                      </div>
                      <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-slate-800 outline-none border-2 border-transparent focus:border-slate-900 transition-all appearance-none shadow-sm text-center">
                        {['Ашхабад', 'Туркменабад', 'Мары', 'Дашогуз', 'Балканабад'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-black text-center text-lg outline-none border-2 border-transparent focus:border-slate-900 transition-all shadow-sm" placeholder="Сумма USDT" />
                      <p className="text-[10px] text-slate-400 font-medium px-10">{t(language, 'walCashWithdrawalNote')}</p>
                    </div>
                  )}

                  {withdrawMethod === 'rapCode' && (
                    <div className="space-y-6">
                      <div className="p-5 bg-amber-50/50 rounded-[2rem] border border-amber-100 flex gap-4">
                        <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                          <Star className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[11px] text-amber-800 font-bold leading-relaxed uppercase tracking-widest">{t(language, 'walVoucherCreation')}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium px-4">{t(language, 'walVoucherCreationNote')}</p>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest text-center block">{t(language, 'walAmountRapCode')}</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-6 bg-slate-50 rounded-2xl font-black text-center text-2xl outline-none border-2 border-transparent focus:border-amber-500 transition-all shadow-sm" placeholder="0.00" />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTransaction()}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm tracking-widest shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : t(language, 'walWithdrawBtn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Prompt Modal */}
        {show2FAPrompt && (
          <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <div className="bg-slate-100 p-3 rounded-2xl">
                  <ShieldCheck className="w-6 h-6 text-slate-800" />
                </div>
                <button onClick={() => setShow2FAPrompt(false)} className="p-2 bg-slate-50 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2">Подтверждение 2FA</h3>
              <p className="text-xs text-slate-400 font-bold mb-6">Введите 6-значный код из Google Authenticator</p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={twoFactorToken}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setTwoFactorToken(val);
                  if (val.length === 6) handleTransaction(val);
                }}
                className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-slate-900 text-center text-3xl font-black tracking-[0.5em] outline-none transition-all mb-6"
                placeholder="000000"
                autoFocus
              />

              <button
                disabled={isSubmitting || twoFactorToken.length !== 6}
                onClick={() => handleTransaction()}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest shadow-xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t(language, 'confirm')}
              </button>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
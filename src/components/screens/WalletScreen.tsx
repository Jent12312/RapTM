'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import {
  Eye, EyeOff, Plus, ArrowDownToLine, RefreshCcw, X, Copy, CheckCircle2, Clock,
  MapPin, Zap, Star, AlertTriangle, ArrowRightLeft, QrCode, Loader2
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { QRCodeSVG } from 'qrcode.react';

const ESCROW_WALLETS: Record<string, string> = {
  TRC20: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  BEP20: '0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  APTOS: '0xAPTOSXXXXXXXXXXXXXXXXXXXXXXXXXXX',
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [city, setCity] = useState('Ашхабад');
  const [rapCode, setRapCode] = useState('');

  const [history, setHistory] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'DEPOSIT' | 'WITHDRAWAL' | 'SWAP'>('all');
  const [isFullHistoryOpen, setIsFullHistoryOpen] = useState(false);

  const [rates, setRates] = useState({
    usdToTmt: 3.50,
    usdtToTmt: 19.50,
    change24h: 1.2,
    lastUpdated: Date.now(),
  });
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const getSafeStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'PENDING': 'Ожидание',
      'PROCESSING': 'В обработке',
      'COMPLETED': 'Выполнено',
      'FAILED': 'Ошибка',
      'CANCELLED': 'Отменено'
    };

    // Просто возвращаем текст из карты, не пытаясь мучить функцию t() 
    // если не уверены, что там есть эти ключи
    return statusMap[status] || status;
  };

  // ОБНОВЛЕННАЯ ФУНКЦИЯ: Загружаем и кошелек, и обмены
  const loadHistory = async () => {
    try {
      const [txRes, exRes] = await Promise.all([
        fetch(`/api/wallet/transactions?userId=${user.id}`),
        fetch(`/api/exchange?userId=${user.id}`)
      ]);
      
      let txData = [];
      let exData = [];
      
      if (txRes.ok) txData = await txRes.json();
      if (exRes.ok) exData = await exRes.json();

      // Нормализуем данные обменов под транзакции
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
      // Сортируем по дате (самые новые сверху)
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setHistory(combined);
    } catch (e) { console.error(e); }
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
    const interval = setInterval(() => {
        initUser(WebApp.initDataUnsafe.user);
        loadHistory();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshBalance = async () => {
    setIsLoadingRates(true);
    await initUser(WebApp.initDataUnsafe.user);
    await fetchRates();
    loadHistory();
    addToast('Баланс обновлён', 'info');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Скопировано', 'info');
  };

  const filteredHistory = useMemo(() => {
    return history.filter((tx) => filterType === 'all' || tx.type === filterType);
  }, [history, filterType]);

  // Разделяем на главные 20 и все остальные
  const mainHistory = filteredHistory.slice(0, 20);

  const handleTransaction = async () => {
    // ЗАГЛУШКА ДЛЯ RAPCODE
    if ((modalType === 'deposit' && depositMethod === 'rapCode') || 
        (modalType === 'withdraw' && withdrawMethod === 'rapCode')) {
      return addToast('Функция в разработке', 'info');
    }

    if (!amount || Number(amount) <= 0) return addToast('Введите сумму', 'error');

    if (modalType === 'deposit' && depositMethod === 'crypto' && Number(amount) < MIN_DEPOSIT_USDT) {
        return addToast(`Минимальный депозит ${MIN_DEPOSIT_USDT} USDT`, 'error');
    }

    if (modalType === 'withdraw' && withdrawMethod === 'crypto') {
      if (!validateAddress(address, network)) return addToast(`Неверный адрес ${network}`, 'error');
      if (Number(amount) > balances.usdt) return addToast('Недостаточно баланса', 'error');
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (res.ok) {
        addToast('Заявка создана', 'success');
        setModalType('none');
        setAmount('');
        loadHistory();
      }
    } catch (e) {
      addToast('Ошибка запроса', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Компонент карточки транзакции (чтобы не дублировать код)
  const TransactionCard = ({ tx }: { tx: any }) => (
    <div className="bg-white p-4 rounded-3xl flex justify-between items-center shadow-sm border border-slate-50">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
          tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-500' : 
          tx.type === 'SWAP' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'
        }`}>
          {tx.type === 'DEPOSIT' ? <Plus className="w-5 h-5"/> : 
           tx.type === 'SWAP' ? <ArrowRightLeft className="w-5 h-5"/> : <ArrowDownToLine className="w-5 h-5"/>}
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800">
            {tx.amount} {tx.type === 'SWAP' ? tx.currencyText : 'USDT'}
          </div>
          <div className="text-[10px] text-slate-400">
            {new Date(tx.createdAt).toLocaleDateString('ru-RU')} {new Date(tx.createdAt).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-[10px] font-bold flex items-center justify-end gap-1 ${
          tx.status === 'COMPLETED' ? 'text-emerald-500' : tx.status === 'FAILED' ? 'text-red-500' : 'text-amber-500'
        }`}>
          {tx.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : tx.status === 'FAILED' ? <X className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {getSafeStatusLabel(tx.status)}
        </div>
        <div className="text-[9px] text-slate-300 font-mono mt-1">{tx.txId?.slice(0,8)}...</div>
      </div>
    </div>
  );

  return (
    <div className="px-5 py-2 space-y-6 pb-32 animate-in fade-in duration-500">
      
      {/* Главная карточка */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-medium opacity-80 uppercase tracking-widest">{t(language, 'balanceLabel')}</span>
            <div className="flex gap-2">
              <button onClick={handleRefreshBalance} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform">
                <RefreshCcw className={`w-4 h-4 ${isLoadingRates ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={toggleBalance} className="p-2 bg-white/10 rounded-full">
                {isBalanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <h2 className="text-4xl font-black mb-1">
            {isBalanceVisible ? balances.tmt.toLocaleString() : '••••••'} <span className="text-lg font-normal">TMT</span>
          </h2>
          <p className="text-emerald-100/80 font-medium">
            ≈ {isBalanceVisible ? balances.usdt.toFixed(2) : '••••'} USDT
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 relative z-10">
          <button onClick={() => setModalType('deposit')} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase">{t(language, 'salmak')}</span>
          </button>
          <button onClick={() => setModalType('withdraw')} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-colors">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase">{t(language, 'cykarmak')}</span>
          </button>
          <button onClick={() => setActiveTab('exchange')} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white text-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase text-white">{t(language, 'alyCaly')}</span>
          </button>
        </div>
      </div>

      {/* Детализация активов */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">U</div>
              <span className="text-xs font-bold text-slate-500">USDT</span>
           </div>
           <div className="text-lg font-black text-slate-800">{isBalanceVisible ? balances.usdt.toFixed(2) : '****'}</div>
           <div className="text-[10px] text-slate-400">1 USDT ≈ {rates.usdtToTmt} TMT</div>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">T</div>
              <span className="text-xs font-bold text-slate-500">TMT</span>
           </div>
           <div className="text-lg font-black text-slate-800">{isBalanceVisible ? balances.tmt.toFixed(2) : '****'}</div>
           <div className="text-[10px] text-slate-400">Наличные / Карта</div>
        </div>
      </div>

      {/* История с фильтрами */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">История</h3>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {['all', 'DEPOSIT', 'WITHDRAWAL', 'SWAP'].map(type => (
             <button 
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${filterType === type ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-500'}`}
             >
               {type === 'all' ? 'Все' : type === 'SWAP' ? 'ОБМЕН' : type}
             </button>
           ))}
        </div>

        <div className="space-y-3">
          {mainHistory.map((tx) => <TransactionCard key={tx.id} tx={tx} />)}
          
          {mainHistory.length === 0 && (
             <p className="text-center text-xs text-slate-400 py-4">Нет операций</p>
          )}

          {filteredHistory.length > 20 && (
             <button 
               onClick={() => setIsFullHistoryOpen(true)}
               className="w-full py-4 mt-2 text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors"
             >
               Смотреть всю историю ({filteredHistory.length})
             </button>
          )}
        </div>
      </div>

      {/* Полное окно истории */}
      {isFullHistoryOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-50 overflow-y-auto animate-in slide-in-from-bottom duration-300">
           <div className="sticky top-0 bg-white/80 backdrop-blur-md p-5 flex items-center justify-between shadow-sm z-10">
              <h2 className="text-lg font-black text-slate-800">Вся история</h2>
              <button onClick={() => setIsFullHistoryOpen(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
           </div>
           <div className="p-5 space-y-3 pb-20">
              {filteredHistory.map((tx) => <TransactionCard key={`full-${tx.id}`} tx={tx} />)}
           </div>
        </div>
      )}

      {/* Модалка пополнения */}
      {modalType === 'deposit' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end justify-center">
          <div className="bg-white w-full max-w-xl rounded-t-[3rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">Пополнение</h3>
              <button onClick={() => setModalType('none')} className="p-2 bg-slate-100 rounded-full"><X /></button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                {(['crypto', 'cash', 'rapCode'] as const).map(m => (
                  <button 
                    key={m} 
                    onClick={() => setDepositMethod(m)}
                    className={`flex flex-col items-center p-3 rounded-2xl gap-2 transition-all ${depositMethod === m ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                  >
                    {m === 'crypto' ? <Zap className="w-5 h-5"/> : m === 'cash' ? <MapPin className="w-5 h-5"/> : <Star className="w-5 h-5"/>}
                    <span className="text-[9px] font-bold uppercase">{m}</span>
                  </button>
                ))}
              </div>

              {depositMethod === 'crypto' && (
                <div className="space-y-4">
                   <div className="flex bg-slate-100 p-1 rounded-2xl">
                      {['TRC20', 'BEP20', 'APTOS'].map(n => (
                        <button key={n} onClick={() => setNetwork(n as any)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${network === n ? 'bg-white shadow-sm' : 'text-slate-400'}`}>{n}</button>
                      ))}
                   </div>

                   <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Адрес для пополнения {network}</span>
                        <div className="flex gap-2">
                           <button onClick={() => setShowQR(!showQR)} className="p-1.5 bg-white rounded-lg text-emerald-600 shadow-sm"><QrCode className="w-4 h-4"/></button>
                           <button onClick={() => copyToClipboard(ESCROW_WALLETS[network])} className="p-1.5 bg-white rounded-lg text-emerald-600 shadow-sm"><Copy className="w-4 h-4"/></button>
                        </div>
                      </div>
                      <div className="text-xs font-mono break-all font-bold text-slate-700">{ESCROW_WALLETS[network]}</div>
                      
                      {showQR && (
                        <div className="mt-4 flex flex-col items-center p-4 bg-white rounded-2xl animate-in zoom-in">
                           <QRCodeSVG value={ESCROW_WALLETS[network]} size={180} />
                           <p className="text-[10px] text-slate-400 mt-2 font-bold">Сканируйте для оплаты</p>
                        </div>
                      )}
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Сумма (Min: {MIN_DEPOSIT_USDT} USDT)</label>
                      <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-2 ring-transparent focus:ring-emerald-500 font-bold transition-all"
                        placeholder="0.00"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Hash транзакции (TxID)</label>
                      <input 
                        type="text" 
                        value={txId} 
                        onChange={(e) => setTxId(e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border-none text-xs font-mono"
                        placeholder="Введите TxID"
                      />
                   </div>
                </div>
              )}

              {depositMethod === 'cash' && (
                <div className="space-y-4">
                   <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-emerald-100">
                      {['Ашхабад', 'Туркменабад', 'Мары', 'Дашогуз', 'Балканабад'].map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Сумма USDT" />
                   <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <p className="text-[10px] text-amber-700 font-medium leading-relaxed">Наш оператор свяжется с вами в Telegram для подтверждения места встречи в городе {city}.</p>
                   </div>
                </div>
              )}

              {depositMethod === 'rapCode' && (
                <div className="space-y-4">
                   <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-3">
                      <Star className="w-5 h-5 text-indigo-500 shrink-0" />
                      <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">Активация подарочных ваучеров и переводов внутри системы без комиссии.</p>
                   </div>
                   <input type="text" value={rapCode} onChange={(e) => setRapCode(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-center tracking-widest uppercase" placeholder="Введите код" />
                </div>
              )}

              <button 
                disabled={isSubmitting}
                onClick={handleTransaction}
                className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black shadow-xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'ПОДТВЕРДИТЬ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка вывода */}
      {modalType === 'withdraw' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end justify-center">
          <div className="bg-white w-full max-w-xl rounded-t-[3rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">Вывод средств</h3>
              <button onClick={() => setModalType('none')} className="p-2 bg-slate-100 rounded-full"><X /></button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                 {(['crypto', 'cash', 'rapCode'] as const).map(m => (
                    <button 
                      key={m} 
                      onClick={() => setWithdrawMethod(m)}
                      className={`flex flex-col items-center p-3 rounded-2xl gap-2 transition-all ${withdrawMethod === m ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                    >
                      {m === 'crypto' ? <Zap className="w-5 h-5"/> : m === 'cash' ? <MapPin className="w-5 h-5"/> : <Star className="w-5 h-5"/>}
                      <span className="text-[9px] font-bold uppercase">{m}</span>
                    </button>
                  ))}
              </div>

              {withdrawMethod === 'crypto' && (
                <div className="space-y-4">
                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                    {['TRC20', 'BEP20', 'APTOS'].map(n => (
                      <button key={n} onClick={() => setNetwork(n as any)} className={`flex-1 py-2 rounded-xl text-[10px] font-bold ${network === n ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>{n}</button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between ml-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Адрес получателя</label>
                       {address && (
                         <span className={`text-[9px] font-bold ${validateAddress(address, network) ? 'text-emerald-500' : 'text-red-500'}`}>
                           {validateAddress(address, network) ? '✓ Адрес валиден' : '× Неверный формат'}
                         </span>
                       )}
                    </div>
                    <input 
                      type="text" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-mono border-none ring-2 ring-transparent focus:ring-slate-900"
                      placeholder={`Введите ${network} адрес`}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Сумма (Доступно: {balances.usdt})</label>
                       <button onClick={() => setAmount((balances.usdt - 0.5).toFixed(2))} className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">MAX</button>
                    </div>
                    <input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl font-bold"
                      placeholder="0.00"
                    />
                    <div className="flex justify-between px-2 text-[10px] font-medium text-slate-400">
                       <span>Комиссия сети: 0.5 USDT</span>
                       <span>К зачислению: {amount ? (Math.max(0, Number(amount) - 0.5)).toFixed(2) : '0.00'} USDT</span>
                    </div>
                  </div>
                </div>
              )}

              {withdrawMethod === 'cash' && (
                 <div className="space-y-4 text-center py-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                       <MapPin className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-slate-800">Выдача наличных</h4>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold">
                      {['Ашхабад', 'Туркменабад', 'Мары', 'Дашогуз', 'Балканабад'].map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                    <p className="text-xs text-slate-500 px-6">После подачи заявки вы получите инструкции по встрече с курьером в городе {city}.</p>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Сумма USDT" />
                 </div>
              )}

              {withdrawMethod === 'rapCode' && (
                <div className="space-y-4">
                   <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                      <Star className="w-5 h-5 text-amber-500 shrink-0" />
                      <p className="text-[10px] text-amber-700 font-medium leading-relaxed">Создание ваучера для перевода другому пользователю без комиссии.</p>
                   </div>
                   <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-center" placeholder="Сумма для создания rapCode" />
                </div>
              )}

              <button 
                disabled={isSubmitting}
                onClick={handleTransaction}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'ВЫВЕСТИ СРЕДСТВА'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
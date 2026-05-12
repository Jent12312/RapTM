'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Clock, 
  Users, 
  Star, 
  Zap, 
  Lock, 
  Globe, 
  CreditCard, 
  Banknote, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';

interface Props {
  onClose: () => void;
}

interface MarketPrice {
  basePrice: number;
  pair: string;
  change24h: number;
}

export default function CreateAdScreen({ onClose }: Props) {
  const { user, language, balances, addToast } = useAppStore();

  // 1. Тип: Купить/Продать
  const [adDirection, setAdDirection] = useState<'buy' | 'sell'>('buy');
  
  // 2. Валютная пара
  const [asset, setAsset] = useState('USDT');
  const [fiat, setFiat] = useState('TMT');

  // 3. Тип цены: Фиксированная / Плавающая
  const [priceType, setPriceType] = useState<'fixed' | 'floating'>('fixed');
  const [price, setPrice] = useState('');
  const [pricePercent, setPricePercent] = useState('0');
  
  // 4. Лимиты (мин/макс)
  const [minLimit, setMinLimit] = useState('');
  const [maxLimit, setMaxLimit] = useState('');

  // 5. Метод оплаты
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [city, setCity] = useState('Ашхабад');

  // 6. Условия сделки (текст) и 7. Время на оплату
  const [description, setDescription] = useState('');
  const [paymentTime, setPaymentTime] = useState('15');

  // 8. Требования к контрагенту
  const [reqKyc, setReqKyc] = useState(false);
  const [reqMinTrades, setReqMinTrades] = useState('');
  const [reqMinRating, setReqMinRating] = useState('');
  const [reqFastConfirm, setReqFastConfirm] = useState(false);

  // 9. Тип объявления: публичный / приватный
  const [isPrivate, setIsPrivate] = useState(false);

  // Состояния для рынка
  const [marketPrice, setMarketPrice] = useState<MarketPrice | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  useEffect(() => {
    const fetchMarketPrice = async () => {
      setIsLoadingPrice(true);
      try {
        const res = await fetch(`/api/market-price?asset=${asset}&fiat=${fiat}`);
        const data = await res.json();
        if (data.basePrice) {
          setMarketPrice(data);
          if (priceType === 'fixed' && !price) setPrice(data.basePrice.toFixed(2));
        }
      } catch (error) {
        console.error('Market price error:', error);
      } finally {
        setIsLoadingPrice(false);
      }
    };
    fetchMarketPrice();
  }, [asset, fiat, priceType]);

  const calculatedPrice = (() => {
    if (!marketPrice) return '0.00';
    if (priceType === 'fixed') return price || '0.00';
    const percent = parseFloat(pricePercent) || 0;
    return (marketPrice.basePrice * (1 + percent / 100)).toFixed(2);
  })();

  const toggleMethod = (method: string) => {
    setSelectedMethods(prev => 
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const handlePublish = async () => {
    if ((priceType === 'fixed' && !price) || (priceType === 'floating' && !pricePercent)) {
      addToast(t(language, 'priceOrPercentError'), 'error'); return;
    }
    if (!minLimit || !maxLimit) {
      addToast(t(language, 'limitsError'), 'error'); return;
    }
    if (selectedMethods.length === 0) {
      addToast(t(language, 'paymentMethodError'), 'error'); return;
    }

    try {
      const res = await fetch('/api/p2p', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          type: adDirection,
          asset,
          fiat,
          priceType,
          price: priceType === 'floating' ? parseFloat(pricePercent) : parseFloat(price),
          minLimit: Number(minLimit),
          maxLimit: Number(maxLimit),
          paymentMethods: selectedMethods,
          city: selectedMethods.includes('cash') ? city : null,
          description,
          paymentTime: Number(paymentTime),
          reqKyc,
          reqMinTrades: Number(reqMinTrades) || 0,
          reqRating: Number(reqMinRating) || 0,
          reqFastConfirm,
          isPrivate
        })
      });

      if (res.ok) {
        addToast(t(language, 'success'), 'success');
        onClose();
      } else {
        addToast(t(language, 'error'), 'error');
      }
    } catch (e) {
      addToast(t(language, 'serverError'), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-bottom duration-300">
      
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500 active:scale-95 transition-transform">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">{t(language, 'createAd')}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">P2P Маркетплейс</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        
        {/* 1. Тип: Купить/Продать */}
        <div className="bg-white p-1.5 rounded-3xl ring-1 ring-slate-100 shadow-sm flex gap-1">
          <button
            onClick={() => setAdDirection('buy')}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all ${
              adDirection === 'buy' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'
            }`}
          >
            {t(language, 'buy')}
          </button>
          <button
            onClick={() => setAdDirection('sell')}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all ${
              adDirection === 'sell' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400'
            }`}
          >
            {t(language, 'sell')}
          </button>
        </div>

        {/* 2. Валютная пара */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t(language, 'cryptocurrency')}</label>
              <div className="relative">
                <select value={asset} onChange={(e) => setAsset(e.target.value)} className="w-full bg-slate-50 ring-1 ring-slate-200 rounded-2xl px-4 py-3 text-sm font-bold appearance-none outline-none">
                  <option value="USDT">USDT</option>
                  <option value="USD">USD</option>
                  <option value="TMT">TMT</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t(language, 'fiatCurrency')}</label>
              <div className="relative">
                <select value={fiat} onChange={(e) => setFiat(e.target.value)} className="w-full bg-slate-50 ring-1 ring-slate-200 rounded-2xl px-4 py-3 text-sm font-bold appearance-none outline-none">
                  <option value="TMT">TMT (Манат)</option>
                  <option value="USD">USD (Доллар)</option>
                  <option value="RUB">RUB (Рубль)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Тип цены и расчет */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 space-y-5">
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setPriceType('fixed')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl ${priceType === 'fixed' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>{t(language, 'fixed')}</button>
            <button onClick={() => setPriceType('floating')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl ${priceType === 'floating' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>{t(language, 'floating')}</button>
          </div>

          {marketPrice && (
            <div className={`p-4 rounded-2xl flex items-center justify-between ${marketPrice.change24h >= 0 ? 'bg-emerald-50/50 border border-emerald-100' : 'bg-red-50/50 border border-red-100'}`}>
              <div className="flex items-center gap-2">
                {marketPrice.change24h >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                <span className="text-xs font-bold text-slate-600">{t(language, 'exchangePrice')}: <span className="text-slate-900">{marketPrice.basePrice.toFixed(2)} {fiat}</span></span>
              </div>
              <span className={`text-[10px] font-black ${marketPrice.change24h >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {marketPrice.change24h >= 0 ? '+' : ''}{marketPrice.change24h.toFixed(2)}%
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                {priceType === 'fixed' ? t(language, 'pricePerUnit') : t(language, 'percentFromMarket')}
              </label>
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-slate-800 transition-all">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={priceType === 'fixed' ? price : pricePercent} 
                  onChange={(e) => priceType === 'fixed' ? setPrice(e.target.value) : setPricePercent(e.target.value)} 
                  className="w-full text-xl font-black text-slate-800 bg-transparent outline-none" 
                />
                <span className="font-bold text-slate-400">{priceType === 'fixed' ? fiat : '%'}</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-3xl text-white shadow-xl shadow-slate-200">
              <div className="flex items-center gap-2 mb-1 opacity-60">
                <Calculator className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t(language, 'totalCost')}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight">{calculatedPrice}</span>
                <span className="text-sm font-bold text-slate-400">{fiat} {t(language, 'perUnit')} 1 {asset}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Лимиты */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">{t(language, 'minLimit')}</label>
            <input type="number" placeholder="50" value={minLimit} onChange={(e) => setMinLimit(e.target.value)} className="w-full text-lg font-black text-slate-800 outline-none" />
          </div>
          <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">{t(language, 'maxLimit')}</label>
            <input type="number" placeholder="10000" value={maxLimit} onChange={(e) => setMaxLimit(e.target.value)} className="w-full text-lg font-black text-slate-800 outline-none" />
          </div>
        </div>

        {/* 5. Метод оплаты */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t(language, 'paymentMethods')}</label>
          <div className="space-y-2">
            {[
              { id: 'card', label: t(language, 'card'), icon: CreditCard, color: 'text-blue-500' },
              { id: 'cash', label: t(language, 'cash'), icon: Banknote, color: 'text-emerald-500' },
              { id: 'tmcell', label: t(language, 'tmcell'), icon: Smartphone, color: 'text-amber-500' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => toggleMethod(m.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                  selectedMethods.includes(m.id) ? 'border-slate-800 bg-slate-50' : 'border-slate-50 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                  <span className="text-sm font-bold text-slate-700">{m.label}</span>
                </div>
                {selectedMethods.includes(m.id) && <CheckCircle2 className="w-5 h-5 text-slate-800" />}
              </button>
            ))}
          </div>
 
          {selectedMethods.includes('cash') && (
            <div className="pt-2 animate-in slide-in-from-top-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2 ml-1">{t(language, 'city')}</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-slate-50 ring-1 ring-slate-200 p-3.5 rounded-xl text-sm font-bold outline-none">
                <option value="Ашхабад">{t(language, 'ashgabat')}</option>
                <option value="Мары">{t(language, 'mary')}</option>
                <option value="Туркменабад">{t(language, 'turkmenabat')}</option>
                <option value="Дашогуз">{t(language, 'dashoguz')}</option>
                <option value="Балканабад">{t(language, 'balkanabat')}</option>
              </select>
            </div>
          )}
        </div>

        {/* 6 & 7. Условия и Время */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t(language, 'tradeConditions')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(language, 'tradeConditionsPlaceholder')}
              className="w-full bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-100 text-sm font-medium min-h-[100px] outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> {t(language, 'paymentWindow')}
            </span>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {['15', '30', '45'].map(time => (
                <button
                  key={time}
                  onClick={() => setPaymentTime(time)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${paymentTime === time ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                >
                  {time} {t(language, 'min')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 8. Требования к контрагенту */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 space-y-5">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500" /> {t(language, 'protectionSettings')}
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-500"><ShieldCheck className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-slate-700">{t(language, 'onlyWithKyc')}</span>
              </div>
              <button onClick={() => setReqKyc(!reqKyc)} className={`w-10 h-6 rounded-full relative transition-colors ${reqKyc ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${reqKyc ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Users className="w-3 h-3" /> {t(language, 'minTrades')}</span>
                <input type="number" value={reqMinTrades} onChange={(e) => setReqMinTrades(e.target.value)} placeholder="0" className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold outline-none" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Star className="w-3 h-3" /> {t(language, 'rating')}</span>
                <input type="number" value={reqMinRating} onChange={(e) => setReqMinRating(e.target.value)} placeholder="0" className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold outline-none" />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-xl text-purple-500"><Zap className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-slate-700">{t(language, 'fastConfirm')}</span>
              </div>
              <button onClick={() => setReqFastConfirm(!reqFastConfirm)} className={`w-10 h-6 rounded-full relative transition-colors ${reqFastConfirm ? 'bg-purple-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${reqFastConfirm ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 9. Тип объявления: Публичный / Приватный */}
        <div className="bg-white p-2 rounded-3xl ring-1 ring-slate-100 shadow-sm flex gap-1">
          <button
            onClick={() => setIsPrivate(false)}
            className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
              !isPrivate ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">{t(language, 'public')}</span>
          </button>
          <button
            onClick={() => setIsPrivate(true)}
            className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${
              isPrivate ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase">{t(language, 'private')}</span>
          </button>
        </div>

        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
            {t(language, 'createAdWarning')}
          </p>
        </div>

      </div>

      {/* Фиксированная кнопка */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
        <button
          onClick={handlePublish}
          className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-xl active:scale-[0.98] transition-all text-lg tracking-tight"
        >
          {t(language, 'publishAd')}
        </button>
      </div>

    </div>
  );
}
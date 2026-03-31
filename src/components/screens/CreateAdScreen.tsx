'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Info, CheckCircle2, ShieldCheck, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
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
  // Состояния формы
  const { user, language, balances, addToast } = useAppStore();
  const [adDirection, setAdDirection] = useState<'buy' | 'sell'>('buy');
  const [asset, setAsset] = useState<'USDT' | 'TMT'>('USDT');
  const [fiat, setFiat] = useState<'TMT' | 'USD'>('TMT');
  const [priceType, setPriceType] = useState<'fixed' | 'floating'>('fixed');
  const [price, setPrice] = useState('');
  const [pricePercent, setPricePercent] = useState('0'); // Процент для плавающей цены
  const [minLimit, setMinLimit] = useState('');
  const [maxLimit, setMaxLimit] = useState('');
  const [city, setCity] = useState('Ашхабад');

  // Состояния для рыночной цены
  const [marketPrice, setMarketPrice] = useState<MarketPrice | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // Новые стейты для продвинутых настроек
  const [description, setDescription] = useState('');
  const [paymentTime, setPaymentTime] = useState('15');
  const [reqKyc, setReqKyc] = useState(false);
  const [reqMinTrades, setReqMinTrades] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false); // Тоггл для скрытия/показа сложных настроек

  // Загрузка рыночной цены при изменении asset/fiat
  useEffect(() => {
    const fetchMarketPrice = async () => {
      setIsLoadingPrice(true);
      try {
        const res = await fetch(`/api/market-price?asset=${asset}&fiat=${fiat}`);
        const data = await res.json();
        if (data.basePrice) {
          setMarketPrice(data);
          // Для фиксированной цены - автозаполняем текущим курсом
          if (priceType === 'fixed' && !price) {
            setPrice(data.basePrice.toFixed(2));
          }
        }
      } catch (error) {
        console.error('Failed to fetch market price:', error);
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchMarketPrice();
  }, [asset, fiat, priceType]);

  // Калькулятор цены
  const calculatedPrice = (() => {
    if (!marketPrice) return '0.00';
    
    if (priceType === 'fixed') {
      return price || '0.00';
    } else {
      // Плавающая цена: basePrice + процент
      const percent = parseFloat(pricePercent) || 0;
      const calculated = marketPrice.basePrice * (1 + percent / 100);
      return calculated.toFixed(2);
    }
  })();

  // Предпросмотр цены в зависимости от типа
  const pricePreview = (() => {
    if (!marketPrice) return '';
    
    if (priceType === 'fixed') {
      return `1 ${asset} = ${price || '0.00'} ${fiat}`;
    } else {
      const percent = parseFloat(pricePercent) || 0;
      const sign = percent >= 0 ? '+' : '';
      return `Рынок: ${marketPrice.basePrice} ${fiat} ${sign}${percent}% = ${calculatedPrice} ${fiat}`;
    }
  })();

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-bottom duration-300">
      
      {/* Шапка */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500 active:scale-95">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{t(language, 'createAdHeader')}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">P2P {t(language, 'navP2P')}</p>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        
        {/* 1. Направление (На прием / На выплаты) */}
        <div className="bg-white p-2 rounded-2xl ring-1 ring-slate-100 shadow-sm flex">
          <button
            onClick={() => setAdDirection('buy')}
            className={`flex-1 p-3 rounded-xl flex flex-col items-center transition-all ${
              adDirection === 'buy' ? 'bg-emerald-50 ring-1 ring-emerald-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className={`text-sm font-bold ${adDirection === 'buy' ? 'text-emerald-600' : ''}`}>{t(language, 'onReceive')}</span>
            <span className="text-[10px] font-medium mt-0.5 opacity-70">{t(language, 'buy')} {asset}</span>
          </button>

          <button
            onClick={() => setAdDirection('sell')}
            className={`flex-1 p-3 rounded-xl flex flex-col items-center transition-all ${
              adDirection === 'sell' ? 'bg-blue-50 ring-1 ring-blue-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className={`text-sm font-bold ${adDirection === 'sell' ? 'text-blue-600' : ''}`}>{t(language, 'onPayout')}</span>
            <span className="text-[10px] font-medium mt-0.5 opacity-70">{t(language, 'sell')} {asset}</span>
          </button>
        </div>

        {/* 2. Активы и Валюта */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <span className="text-sm font-bold text-slate-500">{adDirection === 'buy' ? t(language, 'receiveAmount') : t(language, 'payAmount')} ({t(language, 'asset')})</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setAsset('USDT')} className={`px-3 py-1 text-xs font-bold rounded-md ${asset === 'USDT' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>USDT</button>
              <button onClick={() => setAsset('TMT')} className={`px-3 py-1 text-xs font-bold rounded-md ${asset === 'TMT' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>TMT</button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">{adDirection === 'buy' ? t(language, 'payAmount') : t(language, 'receiveAmount')} ({t(language, 'fiat')})</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setFiat('TMT')} className={`px-3 py-1 text-xs font-bold rounded-md ${fiat === 'TMT' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>TMT</button>
              <button onClick={() => setFiat('USD')} className={`px-3 py-1 text-xs font-bold rounded-md ${fiat === 'USD' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>USD</button>
            </div>
          </div>
        </div>

        {/* 3. Цена и Лимиты */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-5">
          {/* Тип цены */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setPriceType('fixed')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${priceType === 'fixed' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>{t(language, 'fixed')}</button>
            <button onClick={() => setPriceType('floating')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${priceType === 'floating' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>{t(language, 'floating')}</button>
          </div>

          {/* Индикатор рыночной цены */}
          {marketPrice && (
            <div className={`p-3 rounded-xl flex items-center justify-between ${marketPrice.change24h >= 0 ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'bg-red-50 ring-1 ring-red-100'}`}>
              <div className="flex items-center gap-2">
                {marketPrice.change24h >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs font-bold text-slate-600">
                  Рынок: <span className="text-slate-800">{marketPrice.basePrice.toFixed(2)} {fiat}</span>
                </span>
              </div>
              <span className={`text-xs font-bold ${marketPrice.change24h >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {marketPrice.change24h >= 0 ? '+' : ''}{marketPrice.change24h.toFixed(2)}%
              </span>
            </div>
          )}

          {/* Поле ввода цены или процента */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              {priceType === 'fixed' ? t(language, 'price') : 'Процент от рынка'} 1 {asset}
            </label>
            
            {priceType === 'fixed' ? (
              <div className="flex items-center gap-3 mt-1 bg-slate-50 p-3 rounded-2xl ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                <input type="number" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full text-xl font-bold text-slate-800 bg-transparent outline-none placeholder-slate-500" />
                <span className="font-bold text-slate-500">{fiat}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={pricePercent} 
                    onChange={(e) => setPricePercent(e.target.value)} 
                    className="w-full text-xl font-bold text-slate-800 bg-transparent outline-none placeholder-slate-500" 
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-xl ring-1 ring-blue-100">
                  <p className="font-medium">
                    {parseFloat(pricePercent) || 0} &gt; 0 — цена выше рынка (быстрая сделка)
                  </p>
                  <p className="font-medium mt-1">
                    {parseFloat(pricePercent) || 0} &lt; 0 — цена ниже рынка (выгодная покупка)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Предпросмотр итоговой цены */}
          {priceType === 'floating' && marketPrice && (
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-4 rounded-2xl ring-1 ring-blue-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t(language, 'adFinalPrice')}</p>
              <p className="text-2xl font-bold text-slate-800">
                {calculatedPrice} <span className="text-sm font-medium text-slate-500">{fiat}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {marketPrice.basePrice.toFixed(2)} {fiat} × (1 + {parseFloat(pricePercent) || 0}% / 100)
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'minLimit')}</label>
              <div className="flex items-center gap-2 mt-1 bg-slate-50 p-3 rounded-2xl ring-1 ring-slate-200">
                <input type="number" placeholder="100" value={minLimit} onChange={(e) => setMinLimit(e.target.value)} className="w-full font-bold text-slate-800 bg-transparent outline-none placeholder-slate-500" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'maxLimit')}</label>
              <div className="flex items-center gap-2 mt-1 bg-slate-50 p-3 rounded-2xl ring-1 ring-slate-200">
                <input type="number" placeholder="10000" value={maxLimit} onChange={(e) => setMaxLimit(e.target.value)} className="w-full font-bold text-slate-800 bg-transparent outline-none placeholder-slate-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Детали сделки */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-4">

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'adCashMethod').replace('{cash}', t(language, 'adCash'))}</label>
            <div className="flex items-center justify-between mt-2 bg-emerald-50 ring-1 ring-emerald-100 p-3 rounded-2xl">
              <span className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {t(language, 'adCash')}
              </span>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="bg-white text-xs font-bold text-slate-700 px-3 py-1.5 rounded-lg outline-none ring-1 ring-slate-200 appearance-none text-center">
                <option value="Ашхабад">Ашхабад</option>
                <option value="Мары">Мары</option>
                <option value="Туркменабад">Туркменабад</option>
                <option value="Дашогуз">Дашогуз</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'adTerms')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(language, 'adTerms')}
              className="w-full mt-1 bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-slate-700 min-h-[80px] resize-none placeholder-slate-500"
            ></textarea>
          </div>

          <div className="flex justify-between items-center pt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'adPaymentTime')}</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['15', '30', '45'].map(time => (
                <button
                  key={time}
                  onClick={() => setPaymentTime(time)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${paymentTime === time ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                >
                  {time} {t(language, 'time')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Защита Мерчанта (Продвинутые настройки) */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex justify-between items-center"
          >
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" /> {t(language, 'adCounterpartyProtection')}
            </span>
            <span className="text-[10px] font-bold text-blue-500 uppercase bg-blue-50 px-2 py-1 rounded-lg">
              {showAdvanced ? t(language, 'cancel') : t(language, 'adminSearch')}
            </span>
          </button>

          {showAdvanced && (
            <div className="pt-4 border-t border-slate-50 space-y-4 animate-in fade-in slide-in-from-top-2">

              {/* Требовать KYC */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-800">{t(language, 'adOnlyVerified')}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">{t(language, 'adBuyerMustPassKYC')}</p>
                </div>
                <button
                  onClick={() => setReqKyc(!reqKyc)}
                  className={`w-12 h-7 rounded-full relative transition-all duration-300 ${reqKyc ? 'bg-blue-500 shadow-inner' : 'bg-slate-200 shadow-inner'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${reqKyc ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>

              {/* Минимум сделок */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'adMinTrades')}</label>
                <div className="flex items-center gap-3 mt-1 bg-slate-50 p-3 rounded-2xl ring-1 ring-slate-200">
                  <input
                    type="number"
                    placeholder="0"
                    value={reqMinTrades}
                    onChange={(e) => setReqMinTrades(e.target.value)}
                    className="w-full font-bold text-slate-800 bg-transparent outline-none placeholder-slate-500"
                  />
                  <span className="text-xs font-bold text-slate-400">{t(language, 'adTrades')}</span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Плавающая кнопка Опубликовать */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
        <button
        onClick={async () => {
            // Проверка для фиксированной цены
            if (priceType === 'fixed' && !price) {
              addToast(t(language, 'error') + ': Введите цену', 'error');
              return;
            }
            
            // Проверка для плавающей цены
            if (priceType === 'floating' && !pricePercent) {
              addToast(t(language, 'error') + ': Введите процент', 'error');
              return;
            }
            
            if (!minLimit || !maxLimit) {
              addToast(t(language, 'error') + ': Заполните лимиты', 'error');
              return;
            }

            if (adDirection === 'sell' && asset === 'USDT') {
              if (Number(maxLimit) > balances.usdt) {
                addToast(`Недостаточно USDT. Баланс: ${balances.usdt.toFixed(2)}`, 'error');
                return;
              }
            }

            // Определяем итоговую цену
            const finalPrice = priceType === 'floating' ? parseFloat(pricePercent) : parseFloat(price);

            const res = await fetch('/api/p2p', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                type: adDirection,
                asset,
                fiat,
                priceType,
                price: finalPrice, // Для floating - это процент, для fixed - это цена
                minLimit,
                maxLimit,
                city,
                autoReply: "",
                // НОВЫЕ ПОЛЯ
                description: description,
                paymentTime: Number(paymentTime),
                reqKyc: reqKyc,
                reqMinTrades: Number(reqMinTrades) || 0,
                reqRating: 0 // Пока оставляем 0, добавим расчет рейтинга позже если нужно
              })
            });

            if (res.ok) {
              addToast(t(language, 'success'), 'success');
              onClose();
            } else {
              addToast(t(language, 'error'), 'error');
            }
          }}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-[2rem] shadow-lg active:scale-95 transition-all text-lg"
        >
        {t(language, 'publish')}
        </button>
      </div>

    </div>
  );
}
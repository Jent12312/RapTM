'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Info, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface Props {
  onClose: () => void;
}

export default function CreateAdScreen({ onClose }: Props) {
  // Состояния формы
  const [adDirection, setAdDirection] = useState<'buy' | 'sell'>('buy'); // buy = На прием, sell = На выплаты
  const [asset, setAsset] = useState<'USDT' | 'TMT'>('USDT');
  const [fiat, setFiat] = useState<'TMT' | 'USD'>('TMT');
  const [priceType, setPriceType] = useState<'fixed' | 'floating'>('fixed');
  
  const [price, setPrice] = useState('');
  const [minLimit, setMinLimit] = useState('');
  const [maxLimit, setMaxLimit] = useState('');
  const [city, setCity] = useState('Ашхабад');
  const { user } = useAppStore();

  // Логика блокировки TMT-TMT
  useEffect(() => {
    if (asset === 'TMT' && fiat === 'TMT') setFiat('USD');
  }, [asset, fiat]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-bottom duration-300">
      
      {/* Шапка */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500 active:scale-95">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Создайте объявление</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">P2P Платформа</p>
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
            <span className={`text-sm font-bold ${adDirection === 'buy' ? 'text-emerald-600' : ''}`}>На приём</span>
            <span className="text-[10px] font-medium mt-0.5 opacity-70">Покупаю {asset}</span>
          </button>
          
          <button 
            onClick={() => setAdDirection('sell')}
            className={`flex-1 p-3 rounded-xl flex flex-col items-center transition-all ${
              adDirection === 'sell' ? 'bg-blue-50 ring-1 ring-blue-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className={`text-sm font-bold ${adDirection === 'sell' ? 'text-blue-600' : ''}`}>На выплаты</span>
            <span className="text-[10px] font-medium mt-0.5 opacity-70">Продаю {asset}</span>
          </button>
        </div>

        {/* 2. Активы и Валюта */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <span className="text-sm font-bold text-slate-500">Я {adDirection === 'buy' ? 'получаю (Актив)' : 'отдаю (Актив)'}</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setAsset('USDT')} className={`px-3 py-1 text-xs font-bold rounded-md ${asset === 'USDT' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>USDT</button>
              <button onClick={() => setAsset('TMT')} className={`px-3 py-1 text-xs font-bold rounded-md ${asset === 'TMT' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>TMT</button>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">Я {adDirection === 'buy' ? 'отдаю (Фиат)' : 'получаю (Фиат)'}</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button disabled={asset === 'TMT'} onClick={() => setFiat('TMT')} className={`px-3 py-1 text-xs font-bold rounded-md ${fiat === 'TMT' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'} ${asset === 'TMT' ? 'opacity-30' : ''}`}>TMT</button>
              <button onClick={() => setFiat('USD')} className={`px-3 py-1 text-xs font-bold rounded-md ${fiat === 'USD' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>USD</button>
            </div>
          </div>
        </div>

        {/* 3. Цена и Лимиты */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-5">
          {/* Тип цены */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setPriceType('fixed')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${priceType === 'fixed' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Фиксированная</button>
            <button onClick={() => setPriceType('floating')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${priceType === 'floating' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>Плавающая</button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Цена за 1 {asset}</label>
            <div className="flex items-center gap-3 mt-1 bg-slate-50 p-3 rounded-2xl ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
              <input type="number" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full text-xl font-bold text-slate-800 bg-transparent outline-none" />
              <span className="font-bold text-slate-500">{fiat}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Мин. лимит</label>
              <div className="flex items-center gap-2 mt-1 bg-slate-50 p-3 rounded-2xl ring-1 ring-slate-200">
                <input type="number" placeholder="100" value={minLimit} onChange={(e) => setMinLimit(e.target.value)} className="w-full font-bold text-slate-800 bg-transparent outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Макс. лимит</label>
              <div className="flex items-center gap-2 mt-1 bg-slate-50 p-3 rounded-2xl ring-1 ring-slate-200">
                <input type="number" placeholder="10000" value={maxLimit} onChange={(e) => setMaxLimit(e.target.value)} className="w-full font-bold text-slate-800 bg-transparent outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Детали сделки */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Способ оплаты</label>
            <div className="flex items-center justify-between mt-2 bg-emerald-50 ring-1 ring-emerald-100 p-3 rounded-2xl">
              <span className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Наличные
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Условия сделки (Автоответ)</label>
            <textarea 
              placeholder="Введите сообщение для покупателя..." 
              className="w-full mt-1 bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-slate-700 min-h-[100px] resize-none"
            ></textarea>
            <p className="text-[10px] text-slate-400 mt-1 text-right">0 из 1000 символов</p>
          </div>
        </div>

      </div>

      {/* Плавающая кнопка Опубликовать */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
        <button 
        onClick={async () => {
            if (!price || !minLimit || !maxLimit) return alert("Заполните все поля");

            const res = await fetch('/api/p2p', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id, // ID из нашей БД
                type: adDirection,
                asset,
                fiat,
                priceType,
                price,
                minLimit,
                maxLimit,
                city,
                autoReply: "" // Пока пусто
            })
            });

            if (res.ok) {
            alert('Объявление успешно опубликовано!');
            onClose();
            } else {
            alert('Ошибка при публикации');
            }
        }}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-[2rem] shadow-lg active:scale-95 transition-all text-lg"
        >
        Опубликовать
        </button>
      </div>

    </div>
  );
}
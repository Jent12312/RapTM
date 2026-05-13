'use client';

import { RefreshCw } from 'lucide-react';

interface CashTabProps {
  cashBalances: any[];
  isCashLoading: boolean;
  fetchCashBalances: () => void;
}

export default function CashTab({ cashBalances, isCashLoading, fetchCashBalances }: CashTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-500" /> Мониторинг Касс
          </h3>
          <button onClick={fetchCashBalances} className={`p-2 ${isCashLoading ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="space-y-3">
          {(cashBalances || []).length > 0 ? (
            (cashBalances || []).map((item: any) => (
              <div
                key={item.city}
                className="bg-slate-50 p-5 rounded-2xl flex justify-between items-center border border-slate-100 hover:border-amber-200 transition-colors"
              >
                <div>
                  <div className="text-lg font-black text-slate-800">{item.city}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Региональный пункт
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">{item._sum.amount?.toFixed(2) || '0.00'}</div>
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    USDT (Доступно)
                  </div>
                </div>
              </div>
            ))
          ) : (
            ['Ашхабад', 'Туркменабад', 'Мары', 'Дашогуз', 'Балканабад'].map((city) => (
              <div key={city} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center opacity-50">
                <div className="font-bold text-slate-700">{city}</div>
                <div className="text-lg font-black text-slate-900">
                  0.00 <span className="text-[10px] text-slate-400">USDT</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { t, Language } from '@/lib/dictionaries';
import { TrendingUp, DollarSign } from 'lucide-react';

interface StatsTabProps {
  language: Language;
  fullStats: any;
}

export default function StatsTab({ language, fullStats }: StatsTabProps) {
  if (!fullStats || !fullStats.users) {
    return <div className="text-center text-slate-400 py-10">{t(language, 'adminLoading')}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Общая статистика */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminTotalUsers')}</div>
          <div className="text-2xl font-black text-slate-800">{fullStats.users?.total || 0}</div>
          <div className="text-[10px] text-emerald-500 font-bold mt-1">+{fullStats.users?.active24h || 0} за 24ч</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminKYCVerified')}</div>
          <div className="text-2xl font-black text-emerald-600">{fullStats.kyc?.verified || 0}</div>
          <div className="text-[10px] text-amber-500 font-bold mt-1">{fullStats.kyc?.pending || 0} в очереди</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Активные споры</div>
          <div className="text-2xl font-black text-red-600">{fullStats.disputes?.active || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Активные сделки</div>
          <div className="text-2xl font-black text-amber-600">{fullStats.trades?.active || 0}</div>
        </div>
      </div>

      {/* Объемы торгов */}
      <div className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" /> Объемы торгов (24ч)
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="text-xs font-bold text-slate-600">P2P (USDT)</span>
            <span className="font-black text-slate-800">{fullStats.volume?.p2p24h?.toFixed(2) || '0.00'} USDT</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="text-xs font-bold text-slate-600">P2P (TMT)</span>
            <span className="font-black text-slate-800">{fullStats.volume?.p2pTmt24h?.toFixed(2) || '0.00'} TMT</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="text-xs font-bold text-slate-600">Быстрый обмен</span>
            <span className="font-black text-slate-800">{fullStats.volume?.swap24h?.toFixed(2) || '0.00'} USDT</span>
          </div>
        </div>
      </div>

      {/* Финансы */}
      <div className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" /> Финансовые показатели
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Всего USDT в системе:</span>{' '}
            <span className="font-bold text-slate-800">{fullStats.finance?.totalUsdt?.toFixed(2) || '0.00'} USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Всего TMT в системе:</span>{' '}
            <span className="font-bold text-slate-800">{fullStats.finance?.totalTmt?.toFixed(2) || '0.00'} TMT</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2">
            <span className="text-slate-500">Комиссии с обменов:</span>{' '}
            <span className="font-bold text-emerald-600">+{fullStats.finance?.swapFees?.toFixed(2) || '0.00'} USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Комиссии P2P (прибл.):</span>{' '}
            <span className="font-bold text-emerald-600">
              +{fullStats.finance?.p2pFeesEstimated?.toFixed(2) || '0.00'} USDT
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2">
            <span className="text-slate-500">Очередь на вывод:</span>{' '}
            <span className="font-bold text-red-600">{fullStats.finance?.pendingWithdrawals || 0} заявок</span>
          </div>
        </div>
      </div>
    </div>
  );
}

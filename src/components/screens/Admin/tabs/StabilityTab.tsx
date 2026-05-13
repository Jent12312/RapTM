'use client';

import { RefreshCw } from 'lucide-react';

interface StabilityTabProps {
  reconLogs: any[];
  reconLoading: boolean;
  runReconciliation: () => void;
}

export default function StabilityTab({ reconLogs, reconLoading, runReconciliation }: StabilityTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Сверка Балансов</h3>
        <button
          onClick={runReconciliation}
          disabled={reconLoading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${reconLoading ? 'animate-spin' : ''}`} /> Сверить
        </button>
      </div>
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Дата</th>
              <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Статус</th>
              <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Разница</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-bold">
            {(reconLogs || []).map((log) => (
              <tr key={log.id}>
                <td className="px-5 py-4 text-slate-400">{new Date(log.createdAt).toLocaleString('ru-RU')}</td>
                <td className="px-5 py-4">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                      log.isMatch ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {log.isMatch ? 'OK' : 'DIFF'}
                  </span>
                </td>
                <td className="px-5 py-4">{log.totalBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

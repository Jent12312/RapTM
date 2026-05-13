'use client';

import { RefreshCw } from 'lucide-react';

interface LogsTabProps {
  systemLogs: any[];
  logsLoading: boolean;
  logsPage: number;
  setLogsPage: (page: number | ((p: number) => number)) => void;
  logsTotal: number;
  fetchLogs: (page: number) => void;
}

export default function LogsTab({
  systemLogs,
  logsLoading,
  logsPage,
  setLogsPage,
  logsTotal,
  fetchLogs,
}: LogsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Журнал Системы</h3>
        <button onClick={() => fetchLogs(logsPage)} className="p-2 bg-white rounded-xl shadow-sm">
          <RefreshCw className={`w-4 h-4 text-slate-400 ${logsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Дата</th>
                <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Тип</th>
                <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Сообщение</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              {(systemLogs || []).map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-50/50 transition-colors ${log.severity === 'CRITICAL' ? 'bg-rose-50/30' : ''}`}
                >
                  <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[9px] font-black uppercase">
                      {log.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-800">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {logsTotal > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
            disabled={logsPage === 1}
            className="px-4 py-2 bg-white text-slate-600 rounded-xl font-bold text-xs disabled:opacity-50"
          >
            Назад
          </button>
          <span className="px-4 py-2 text-slate-400 text-xs font-bold">
            Страница {logsPage} из {Math.ceil(logsTotal / 20)}
          </span>
          <button
            onClick={() => setLogsPage((p) => p + 1)}
            disabled={logsPage >= Math.ceil(logsTotal / 20)}
            className="px-4 py-2 bg-white text-slate-600 rounded-xl font-bold text-xs disabled:opacity-50"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
}

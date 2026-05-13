'use client';

import { RefreshCw, ShieldCheck, Clock, Users } from 'lucide-react';

interface DashboardTabProps {
  dashboardStats: any;
  setActiveTab: (tab: any) => void;
  sysSettings: Record<string, string>;
  setSysSettings: (settings: Record<string, string>) => void;
  saveSetting: (key: string, value: string) => void;
  savingKey: string | null;
  auditLogs: any[];
}

export default function DashboardTab({
  dashboardStats,
  setActiveTab,
  sysSettings,
  setSysSettings,
  saveSetting,
  savingKey,
  auditLogs,
}: DashboardTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Real-time Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Объем 24ч</div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter">
            {Number(dashboardStats?.volume24h || 0).toFixed(2)} <span className="text-xs font-bold text-slate-400">USDT</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Объем 7д</div>
          <div className="text-3xl font-black text-slate-900 tracking-tighter">
            {Number(dashboardStats?.volume7d || 0).toFixed(2)} <span className="text-xs font-bold text-slate-400">USDT</span>
          </div>
        </div>
        <div className="bg-emerald-50/50 p-6 rounded-[2.5rem] shadow-sm ring-1 ring-emerald-100 relative overflow-hidden group hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-500">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-100/30 rounded-full"></div>
          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Комиссии сегодня</div>
          <div className="text-3xl font-black text-emerald-600 tracking-tighter">
            {Number(dashboardStats?.todayFees || 0).toFixed(2)} <span className="text-xs font-bold text-emerald-400">USDT</span>
          </div>
        </div>
        <div className="bg-blue-50/50 p-6 rounded-[2.5rem] shadow-sm ring-1 ring-blue-100 relative overflow-hidden group hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-500">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-100/30 rounded-full"></div>
          <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Активные сделки</div>
          <div className="text-3xl font-black text-blue-600 tracking-tighter">{dashboardStats?.activeOrders || '0'}</div>
        </div>
      </div>

      {/* Queues */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setActiveTab('kyc')}
          className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 flex flex-col items-center gap-3 group active:scale-95 transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-center">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Верификация</div>
            <div className="text-xl font-black text-slate-900">
              {dashboardStats?.verificationQueueCount || 0} <span className="text-[10px] text-slate-400">В ОЧЕРЕДИ</span>
            </div>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('crypto')}
          className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 flex flex-col items-center gap-3 group active:scale-95 transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-center">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Выводы</div>
            <div className="text-xl font-black text-slate-900">
              {dashboardStats?.withdrawalQueueCount || 0} <span className="text-[10px] text-slate-400">В ОЧЕРЕДИ</span>
            </div>
          </div>
        </button>
      </div>

      {/* Exchange Rate Control */}
      <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <RefreshCw className="w-32 h-32 text-white animate-spin-slow" />
        </div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <h3 className="text-white text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Глобальный курс
          </h3>

          <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Заморозить</span>
            <button
              onClick={() => {
                const newValue = sysSettings.RATE_FROZEN === 'true' ? 'false' : 'true';
                saveSetting('RATE_FROZEN', newValue);
              }}
              className={`w-10 h-5 rounded-full transition-all relative ${
                sysSettings.RATE_FROZEN === 'true' ? 'bg-red-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                  sysSettings.RATE_FROZEN === 'true' ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase tracking-widest">
              1 USDT =
            </div>
            <input
              type="number"
              step="0.1"
              disabled={sysSettings.RATE_FROZEN === 'true'}
              value={sysSettings.EXCHANGE_RATE}
              onChange={(e) => setSysSettings({ ...sysSettings, EXCHANGE_RATE: e.target.value })}
              className={`w-full border rounded-2xl py-4 pl-20 pr-4 text-2xl font-black outline-none transition-all ${
                sysSettings.RATE_FROZEN === 'true'
                  ? 'bg-red-500/10 border-red-500/30 text-red-500/50 cursor-not-allowed'
                  : 'bg-white/10 border-white/20 text-white focus:bg-white/20'
              }`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white font-bold text-lg opacity-50">TMT</div>
          </div>
          <button
            disabled={sysSettings.RATE_FROZEN === 'true' || savingKey === 'EXCHANGE_RATE'}
            onClick={() => saveSetting('EXCHANGE_RATE', sysSettings.EXCHANGE_RATE)}
            className={`font-black px-6 rounded-2xl transition-all active:scale-95 shadow-lg ${
              sysSettings.RATE_FROZEN === 'true'
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
            }`}
          >
            {savingKey === 'EXCHANGE_RATE' ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'OK'}
          </button>
        </div>

        {sysSettings.RATE_FROZEN === 'true' && (
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-3 animate-pulse">
            ⚠️ Курс заморожен. Изменения недоступны.
          </p>
        )}
      </div>

      {/* Recent Activity Mini-List */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" /> Последние действия
          </h3>
          <button
            onClick={() => setActiveTab('audit')}
            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
          >
            Все логи
          </button>
        </div>
        <div className="space-y-4">
          {(auditLogs || []).slice(0, 3).map((log) => (
            <div key={log.id} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800 line-clamp-1">{log.details}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {log.admin?.firstName || 'Система'} • {new Date(log.createdAt).toLocaleTimeString('ru-RU')}
                </div>
              </div>
            </div>
          ))}
          {(auditLogs || []).length === 0 && (
            <div className="text-center py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Нет недавних логов
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

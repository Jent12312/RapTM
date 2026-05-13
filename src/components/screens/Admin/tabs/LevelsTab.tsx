'use client';

import { RefreshCw, UserCheck } from 'lucide-react';

interface LevelsTabProps {
  levelApps: any[];
  isLevelsLoading: boolean;
  fetchLevelApps: () => void;
  processLevelApp: (id: string, status: 'VERIFIED' | 'REJECTED') => void;
  loading: Record<string, boolean>;
}

export default function LevelsTab({
  levelApps,
  isLevelsLoading,
  fetchLevelApps,
  processLevelApp,
  loading,
}: LevelsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2 px-1">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Заявки на повышение</h3>
        <button onClick={fetchLevelApps} className={`p-2 ${isLevelsLoading ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      {levelApps.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100">
          <UserCheck className="w-12 h-12 text-slate-100 mx-auto mb-2" />
          <div className="text-slate-400 font-bold text-xs">Нет новых заявок</div>
        </div>
      ) : (
        (levelApps || []).map((app) => (
          <div key={app.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  app.requestedLevel === 'PARTNER' ? 'bg-purple-500' : 'bg-blue-500'
                }`}
              >
                {app.requestedLevel === 'PARTNER' ? 'P' : 'PRO'}
              </div>
              <div>
                <div className="font-bold text-slate-800">{app.user.firstName || app.user.username}</div>
                <div className="text-[10px] text-slate-400">Запрос на {app.requestedLevel}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => processLevelApp(app.id, 'REJECTED')}
                disabled={loading[app.id]}
                className="p-3 bg-red-50 text-red-600 font-bold rounded-xl text-xs active:scale-95"
              >
                ОТКЛОНИТЬ
              </button>
              <button
                onClick={() => processLevelApp(app.id, 'VERIFIED')}
                disabled={loading[app.id]}
                className="p-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs active:scale-95"
              >
                ПОДТВЕРДИТЬ
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

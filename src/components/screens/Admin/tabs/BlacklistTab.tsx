'use client';

import { UserX, RefreshCw, XCircle } from 'lucide-react';

interface BlacklistTabProps {
  blacklist: any[];
  isBlacklistLoading: boolean;
  fetchBlacklist: () => void;
}

export default function BlacklistTab({ blacklist, isBlacklistLoading, fetchBlacklist }: BlacklistTabProps) {
  const handleAdd = async () => {
    const type = (document.getElementById('bl-type') as HTMLSelectElement).value;
    const value = (document.getElementById('bl-value') as HTMLInputElement).value;
    const reason = (document.getElementById('bl-reason') as HTMLInputElement).value;
    if (!value) return alert('Введите значение');
    const res = await fetch('/api/admin/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value, reason }),
    });
    if (res.ok) {
      alert('Добавлено в черный список');
      fetchBlacklist();
      (document.getElementById('bl-value') as HTMLInputElement).value = '';
      (document.getElementById('bl-reason') as HTMLInputElement).value = '';
    }
  };

  const handleDelete = async (value: string) => {
    if (!confirm('Удалить из черного списка?')) return;
    await fetch('/api/admin/blacklist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    fetchBlacklist();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <UserX className="w-5 h-5 text-red-500" /> Добавить в ЧС
        </h3>
        <div className="space-y-3">
          <select
            id="bl-type"
            className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-slate-200"
          >
            <option value="ID">По Telegram ID</option>
            <option value="CRYPTO_ADDRESS">По Крипто-адресу</option>
            <option value="BANK_CARD">По Банковской карте</option>
            <option value="DEVICE_ID">По Device ID</option>
          </select>
          <input
            id="bl-value"
            type="text"
            placeholder="Значение (ID, Адрес, Карта)"
            className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-slate-200"
          />
          <input
            id="bl-reason"
            type="text"
            placeholder="Причина блокировки"
            className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-slate-200"
          />
          <button
            onClick={handleAdd}
            className="w-full py-4 bg-red-600 text-white font-black rounded-xl active:scale-95 transition-all shadow-lg shadow-red-600/20"
          >
            ЗАБЛОКИРОВАТЬ ГЛОБАЛЬНО
          </button>
        </div>
      </div>

      {/* Список ЧС */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center justify-between">
          <span>Текущий ЧС</span>
          <button onClick={fetchBlacklist} className="p-2">
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isBlacklistLoading ? 'animate-spin' : ''}`} />
          </button>
        </h3>
        <div className="space-y-2">
          {(blacklist || []).length > 0 ? (
            (blacklist || []).map((entry) => (
              <div key={entry.id} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-red-500 uppercase px-2 py-0.5 bg-red-50 rounded-md">
                      {entry.type}
                    </span>
                    <span className="text-sm font-black text-slate-800">{entry.value}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {entry.reason || 'Без причины'}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.value)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <UserX className="w-12 h-12 text-slate-100 mx-auto mb-2" />
              <div className="text-slate-400 font-bold text-xs">Черный список пуст</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

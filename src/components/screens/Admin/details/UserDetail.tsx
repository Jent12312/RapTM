'use client';

import { t, Language } from '@/lib/dictionaries';
import { RefreshCw, UserCheck, Gift } from 'lucide-react';

interface UserDetailProps {
  selectedUser: any;
  language: Language;
  setSelectedUser: (user: any) => void;
  setSuccess: (msg: string | null) => void;
  setError: (msg: string | null) => void;
  fetchDashboard: () => void;
  userOperations: any[];
  selectedOpType: string;
  setSelectedOpType: (type: string) => void;
  fetchUserOperations: (userId: string, type?: string) => void;
}

export default function UserDetail({
  selectedUser,
  language,
  setSelectedUser,
  setSuccess,
  setError,
  fetchDashboard,
  userOperations,
  selectedOpType,
  setSelectedOpType,
  fetchUserOperations,
}: UserDetailProps) {
  const handleLimitUpdate = async () => {
    try {
      const val = (document.getElementById('user-limit-override') as HTMLInputElement).value;
      const res = await fetch(`/api/admin/users/${selectedUser.id}/limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyLimit: parseFloat(val) }),
      });
      if (res.ok) {
        setSuccess('Лимит обновлен');
        const data = await res.json();
        setSelectedUser(data.user || selectedUser);
      } else {
        throw new Error('Failed to update limit');
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleBonus = async () => {
    const amount = prompt('Сумма бонуса (USDT):');
    if (!amount) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      if (res.ok) {
        setSuccess('Бонус начислен');
        const data = await res.json();
        setSelectedUser(data.user || selectedUser);
        fetchDashboard();
      } else {
        throw new Error('Failed to award bonus');
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleBalanceAdjust = async () => {
    const amount = prompt('Сумма списания/начисления (USDT, можно минус):');
    if (!amount) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      if (res.ok) {
        setSuccess('Баланс изменен');
        const data = await res.json();
        setSelectedUser(data.user || selectedUser);
        fetchDashboard();
      } else {
        throw new Error('Failed to adjust balance');
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleBlockToggle = async () => {
    try {
      const action = selectedUser.isBlocked ? 'unblock' : 'block';
      const res = await fetch(`/api/admin/users/${selectedUser.id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data.user);
        setSuccess(data.user.isBlocked ? 'Заблокирован' : 'Разблокирован');
      } else {
        throw new Error('Failed to block/unblock user');
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-32">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-4 mb-6">
          {selectedUser.photoUrl ? (
            <img src={selectedUser.photoUrl} alt="" className="w-16 h-16 rounded-3xl object-cover ring-4 ring-slate-50" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-purple-400 rounded-3xl flex items-center justify-center text-white text-2xl font-black">
              {(selectedUser.firstName || selectedUser.username || 'U').charAt(0)}
            </div>
          )}
          <div>
            <div className="text-xl font-black text-slate-800">
              {selectedUser.firstName || selectedUser.username || t(language, 'userLabel')}
            </div>
            <div className="text-xs font-bold text-slate-400">@{selectedUser.username || 'no_username'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 p-4 rounded-2xl">
            <div className="text-[10px] font-bold text-emerald-600 uppercase">{t(language, 'adminUSDTBalance')}</div>
            <div className="text-2xl font-black text-emerald-700">
              {Number(selectedUser.wallet?.usdtBalance || 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl">
            <div className="text-[10px] font-bold text-blue-600 uppercase">{t(language, 'adminTMTBalance')}</div>
            <div className="text-2xl font-black text-blue-700">
              {Number(selectedUser.wallet?.tmtBalance || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Статус KYC:</span>
            <span
              className={`font-bold uppercase ${
                selectedUser.kycStatus === 'VERIFIED'
                  ? 'text-emerald-600'
                  : selectedUser.kycStatus === 'PENDING'
                  ? 'text-amber-600'
                  : selectedUser.kycStatus === 'REJECTED'
                  ? 'text-red-600'
                  : 'text-slate-400'
              }`}
            >
              {selectedUser.kycStatus || 'NONE'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{t(language, 'email')}:</span>
            <span className="font-bold text-slate-800">{selectedUser.email || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{t(language, 'phone')}:</span>
            <span className="font-bold text-slate-800">{selectedUser.phone || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{t(language, 'stats')}:</span>
            <span className="font-bold text-slate-800">
              {new Date(selectedUser.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-slate-50">
            <span className="text-slate-500">Лимит (24ч):</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                id="user-limit-override"
                defaultValue={selectedUser.dailyLimitOverride || 5000}
                className="w-20 bg-slate-100 rounded px-1 text-right font-bold text-xs outline-none"
              />
              <button onClick={handleLimitUpdate} className="p-1 bg-slate-800 text-white rounded">
                <UserCheck className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Управление Финансами */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-500" /> Финансовые операции
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleBonus}
            className="p-4 bg-purple-50 text-purple-600 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <Gift className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase">Бонус</span>
          </button>
          <button
            onClick={handleBalanceAdjust}
            className="p-4 bg-slate-50 text-slate-600 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <RefreshCw className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase">Баланс</span>
          </button>
        </div>
        <button
          onClick={handleBlockToggle}
          className={`w-full mt-4 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            selectedUser.isBlocked
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
          }`}
        >
          {selectedUser.isBlocked ? 'РАЗБЛОКИРОВАТЬ АККАУНТ' : 'ЗАБЛОКИРОВАТЬ АККАУНТ'}
        </button>
      </div>

      {/* Операции */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4">{t(language, 'adminOperations')}</h3>

        {/* Фильтр операций */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['all', 'crypto', 'exchange', 'codes'].map((type) => (
            <button
              key={type}
              onClick={() => {
                fetchUserOperations(selectedUser.id, type);
                setSelectedOpType(type);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${
                type === selectedOpType ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {type === 'all'
                ? t(language, 'adminAllOps')
                : type === 'crypto'
                ? t(language, 'adminCryptoOps')
                : type === 'exchange'
                ? t(language, 'adminExchangeOps')
                : t(language, 'adminCodesOps')}
            </button>
          ))}
        </div>

        {userOperations.length === 0 ? (
          <div className="text-center text-slate-400 py-10 text-sm">{t(language, 'adminNoOps')}</div>
        ) : (
          <div className="space-y-2">
            {userOperations.map((op: any) => (
              <div key={op.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${
                        op.type === 'CRYPTO'
                          ? 'bg-amber-100 text-amber-600'
                          : op.type === 'EXCHANGE'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      {op.type}
                    </span>
                    <span className="text-xs font-bold text-slate-600">{op.action}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{new Date(op.createdAt).toLocaleString('ru-RU')}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-800">
                    {op.amount
                      ? `${op.amount} ${op.currency || ''}`
                      : op.amountUsdt
                      ? `${op.amountUsdt} USDT`
                      : `${op.amountTmt} TMT`}
                  </div>
                  <div
                    className={`text-[10px] font-bold ${
                      op.status === 'COMPLETED'
                        ? 'text-emerald-600'
                        : op.status === 'PENDING'
                        ? 'text-amber-600'
                        : op.status === 'CANCELLED'
                        ? 'text-red-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {op.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { t, Language } from '../../../../lib/dictionaries';
import { Search, RefreshCw } from 'lucide-react';

interface UsersTabProps {
  users: any[];
  language: Language;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  usersPage: number;
  setUsersPage: (page: number | ((p: number) => number)) => void;
  usersTotal: number;
  setSelectedUser: (user: any) => void;
  fetchUsers: (page: number, search: string) => void;
}

export default function UsersTab({
  users,
  language,
  searchQuery,
  setSearchQuery,
  usersPage,
  setUsersPage,
  usersTotal,
  setSelectedUser,
  fetchUsers,
}: UsersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t(language, 'adminSearchPlaceholder')}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => fetchUsers(usersPage, searchQuery)}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 active:scale-95 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {!Array.isArray(users) || users.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-bold">{t(language, 'adminNoUsers')}</div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedUser(u)}
            >
              <div className="flex items-center gap-3 mb-3">
                {u.photoUrl ? (
                  <img src={u.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-50" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                    {(u.firstName || u.username || 'U').charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{u.firstName || u.username || t(language, 'userLabel')}</div>
                  <div className="text-[10px] text-slate-400">
                    @{u.username || 'no_username'} • ID: {u.telegramId}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block">{t(language, 'adminUSDTBalance')}</span>
                  <span className="font-bold text-slate-800">{Number(u.wallet?.usdtBalance || 0).toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block">{t(language, 'adminTMTBalance')}</span>
                  <span className="font-bold text-slate-800">{Number(u.wallet?.tmtBalance || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Пагинация */}
      {usersTotal > 20 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
            disabled={usersPage === 1}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {t(language, 'adminBack')}
          </button>
          <span className="px-4 py-2 text-slate-400 text-sm font-bold">
            {t(language, 'adminPage')} {usersPage} {t(language, 'adminOf')} {Math.ceil(usersTotal / 20)}
          </span>
          <button
            onClick={() => setUsersPage((p) => p + 1)}
            disabled={usersPage >= Math.ceil(usersTotal / 20)}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {t(language, 'adminForward')}
          </button>
        </div>
      )}
    </div>
  );
}

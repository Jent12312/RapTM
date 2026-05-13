'use client';

import { t, Language } from '@/lib/dictionaries';
import { Clock, ShieldCheck } from 'lucide-react';

interface KycTabProps {
  kycRequests: any[];
  language: Language;
  setSelectedKyc: (user: any) => void;
}

export default function KycTab({ kycRequests, language, setSelectedKyc }: KycTabProps) {
  if ((kycRequests || []).length === 0) {
    return <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoUsers')}</div>;
  }

  return (
    <div className="space-y-4">
      {(kycRequests || []).map((user) => (
        <div
          key={user.id}
          className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-emerald-100 border-t-4 border-emerald-500 cursor-pointer hover:shadow-md transition-all"
          onClick={() => setSelectedKyc(user)}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400">ID: #{user.id.slice(0, 8)}</span>
            <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg">
              {t(language, 'adminPending')}
            </span>
          </div>

          <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl text-sm">
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">{t(language, 'adminUser')}:</span>
              <span className="font-bold text-slate-800">{user.firstName || '—'}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Username:</span>
              <span className="font-bold text-slate-800">@{user.username || '—'}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Telegram ID:</span>
              <span className="font-bold text-slate-800 text-xs">{user.telegramId}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {new Date(user.createdAt).toLocaleDateString('ru-RU')}
            </span>
            <button className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              {t(language, 'adminUserDetails')} <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

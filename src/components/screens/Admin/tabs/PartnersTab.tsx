'use client';

import { t, Language } from '../../../../lib/dictionaries';
import { Users, Copy, ShieldCheck } from 'lucide-react';

interface PartnersTabProps {
  language: Language;
  user: any;
}

export default function PartnersTab({ language, user }: PartnersTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 text-center space-y-6">
        <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <Users className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t(language, 'adminInvitePartner')}</h3>
          <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
            {t(language, 'adminPartnerDesc')}
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
            {t(language, 'adminPartnerLink')}
          </label>

          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div className="flex-1 px-4 py-3 text-xs font-bold text-slate-600 truncate flex items-center bg-white rounded-2xl shadow-sm">
              {`https://t.me/rapira_tm_bot/app?startapp=partner_${user?.id}`}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://t.me/rapira_tm_bot/app?startapp=partner_${user?.id}`);
                alert(t(language, 'success'));
              }}
              className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 flex gap-4">
        <div className="p-3 bg-blue-100 text-blue-500 h-fit rounded-2xl">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest">Безопасность и уровни</h4>
          <p className="text-[11px] font-bold text-blue-600/70 leading-relaxed">
            Приглашенные партнеры автоматически получают статус Partner.
            Это позволяет им торговать с повышенными лимитами сразу после регистрации.
          </p>
        </div>
      </div>
    </div>
  );
}

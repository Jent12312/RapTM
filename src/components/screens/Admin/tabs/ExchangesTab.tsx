'use client';

import { t, Language } from '../../../../lib/dictionaries';

interface ExchangesTabProps {
  exchanges: any[];
  language: Language;
  processExchange: (id: string, action: 'approve' | 'reject') => void;
  loading: Record<string, boolean>;
}

export default function ExchangesTab({ exchanges, language, processExchange, loading }: ExchangesTabProps) {
  if ((exchanges || []).length === 0) {
    return <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoExchanges')}</div>;
  }

  return (
    <div className="space-y-4">
      {(exchanges || []).map((req) => (
        <div
          key={req.id}
          className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-blue-100 border-t-4 border-blue-500 mb-4"
        >
          <div className="flex justify-between items-center mb-3">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-lg ${
                req.direction === 'USDT_TO_TMT' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {req.direction === 'USDT_TO_TMT' ? t(language, 'adminSendToNumber') : t(language, 'adminPaymentReceived')}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl text-sm space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-slate-500">{t(language, 'adminUser')}:</span>{' '}
              <span className="font-bold">@{req.user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t(language, 'adminSendAmount')}:</span>{' '}
              <span className="font-bold text-slate-800">
                {req.direction === 'USDT_TO_TMT' ? `${req.amountUsdt} USDT` : `${req.amountTmt} TMT`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t(language, 'adminReceiveAmount')}:</span>{' '}
              <span className="font-bold text-slate-800">
                {req.direction === 'USDT_TO_TMT' ? `${req.amountTmt} TMT` : `${req.amountUsdt} USDT`}
              </span>
            </div>
            {req.direction === 'USDT_TO_TMT' && (
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-red-500 font-bold">{t(language, 'adminSendToNumber')}:</span>{' '}
                <span className="font-bold text-red-600">{req.userPhone}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => processExchange(req.id, 'reject')}
              disabled={loading[req.id]}
              className="p-3 bg-red-50 text-red-600 font-bold rounded-xl text-xs active:scale-95"
            >
              {t(language, 'adminReject')} ({t(language, 'adminReturn')})
            </button>
            <button
              onClick={() => processExchange(req.id, 'approve')}
              disabled={loading[req.id]}
              className="p-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs active:scale-95"
            >
              {req.direction === 'USDT_TO_TMT' ? t(language, 'adminConfirm') : t(language, 'adminPaymentReceived')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

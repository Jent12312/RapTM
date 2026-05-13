'use client';

import { t, Language } from '@/lib/dictionaries';

interface CryptoTabProps {
  cryptoTxs: any[];
  language: Language;
  processCrypto: (id: string, action: 'approve' | 'reject') => void;
  loading: Record<string, boolean>;
}

export default function CryptoTab({ cryptoTxs, language, processCrypto, loading }: CryptoTabProps) {
  if ((cryptoTxs || []).length === 0) {
    return <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoTransactions')}</div>;
  }

  return (
    <div className="space-y-4">
      {(cryptoTxs || []).map((tx) => (
        <div
          key={tx.id}
          className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-amber-100 border-t-4 border-amber-500 mb-4"
        >
          <div className="flex justify-between items-center mb-3">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-lg ${
                tx.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
              }`}
            >
              {tx.type === 'DEPOSIT' ? t(language, 'salmak') : t(language, 'cykarmak')} {tx.network}
            </span>
            <span className="font-black text-slate-800">{tx.amount} USDT</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-2 mb-4 font-medium break-all">
            <div className="flex justify-between">
              <span className="text-slate-500">{t(language, 'adminUser')}:</span>{' '}
              <span className="font-bold text-blue-500">@{tx.user.username}</span>
            </div>
            {tx.type === 'DEPOSIT' ? (
              <div>
                <span className="text-slate-500 block mb-1">{t(language, 'adminTxId')}:</span>{' '}
                <span className="font-mono bg-white p-1 rounded border border-slate-200 block">{tx.txId}</span>
              </div>
            ) : (
              <div>
                <span className="text-red-500 font-bold block mb-1">{t(language, 'adminSendToAddress')}:</span>{' '}
                <span className="font-mono bg-white p-1 rounded border border-slate-200 block">{tx.address}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => processCrypto(tx.id, 'reject')}
              disabled={loading[tx.id]}
              className="p-3 bg-red-50 text-red-600 font-bold rounded-xl text-xs active:scale-95"
            >
              {t(language, 'adminReject')} {tx.type === 'WITHDRAWAL' ? `(${t(language, 'adminReturn')})` : ''}
            </button>
            <button
              onClick={() => processCrypto(tx.id, 'approve')}
              disabled={loading[tx.id]}
              className="p-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs active:scale-95"
            >
              {t(language, 'adminApprove')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

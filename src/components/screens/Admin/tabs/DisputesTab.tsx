'use client';

import { t, Language } from '@/lib/dictionaries';
import { MessageCircle, XCircle, CheckCircle2 } from 'lucide-react';

interface DisputesTabProps {
  disputes: any[];
  language: Language;
  handleSelectDispute: (dispute: any) => void;
  resolveDispute: (orderId: string, resolution: 'COMPLETED' | 'CANCELLED') => void;
  loading: Record<string, boolean>;
}

export default function DisputesTab({
  disputes,
  language,
  handleSelectDispute,
  resolveDispute,
  loading,
}: DisputesTabProps) {
  if (!Array.isArray(disputes) || disputes.length === 0) {
    return <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoDisputes')}</div>;
  }

  return (
    <div className="space-y-4">
      {disputes.map((order) => (
        <div
          key={order.id}
          className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-red-100 border-t-4 border-red-500 cursor-pointer hover:shadow-md transition-all"
          onClick={() => handleSelectDispute(order)}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400">ID: #{order.id.slice(0, 8)}</span>
            <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-600 rounded-lg">
              {t(language, 'adminDisputeOpen')}
            </span>
          </div>

          <div className="space-y-2 mb-6 bg-slate-50 p-3 rounded-xl text-sm">
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">{t(language, 'limit')}:</span>
              <span className="font-bold text-slate-800">
                {order.amountAsset} {order.ad.asset}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">{t(language, 'buy')}:</span>
              <span className="font-bold text-blue-600">{order.buyer.firstName}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">{t(language, 'sell')}:</span>
              <span className="font-bold text-emerald-600">{order.seller.firstName}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button className="flex items-center gap-1 text-blue-600 text-xs font-bold">
              <MessageCircle className="w-4 h-4" /> {t(language, 'chatPlaceholder')}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resolveDispute(order.id, 'CANCELLED');
                }}
                disabled={loading[order.id]}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl font-bold text-xs transition-all ${
                  loading[order.id]
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 active:scale-95'
                }`}
              >
                {loading[order.id] ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <XCircle className="w-4 h-4" />
                )}{' '}
                {t(language, 'adminReject')}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resolveDispute(order.id, 'COMPLETED');
                }}
                disabled={loading[order.id]}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl font-bold text-xs transition-all ${
                  loading[order.id]
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95'
                }`}
              >
                {loading[order.id] ? (
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}{' '}
                {t(language, 'adminApprove')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

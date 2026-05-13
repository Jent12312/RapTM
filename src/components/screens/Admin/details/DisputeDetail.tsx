'use client';

import { t, Language } from '@/lib/dictionaries';
import { MessageCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface DisputeDetailProps {
  selectedDispute: any;
  language: Language;
  messages: any[];
  resolveDispute: (orderId: string, resolution: 'COMPLETED' | 'CANCELLED') => void;
  loading: Record<string, boolean>;
}

export default function DisputeDetail({
  selectedDispute,
  language,
  messages,
  resolveDispute,
  loading,
}: DisputeDetailProps) {
  return (
    <div className="p-4 space-y-4 pb-32">
      {/* Информация о сделке */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 font-medium">{t(language, 'adminBuyer')}:</span>
            <span className="font-bold text-blue-600 ml-2">{selectedDispute.buyer.firstName}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">{t(language, 'adminSeller')}:</span>
            <span className="font-bold text-emerald-600 ml-2">{selectedDispute.seller.firstName}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">{t(language, 'adminAmount')}:</span>
            <span className="font-bold text-slate-800 ml-2">
              {selectedDispute.amountAsset} {selectedDispute.ad.asset}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">{t(language, 'adminFiat')}:</span>
            <span className="font-bold text-slate-800 ml-2">
              {selectedDispute.amountFiat} {selectedDispute.ad.fiat}
            </span>
          </div>
        </div>
      </div>

      {/* Чат сделки */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">{t(language, 'adminChatHistory')}</span>
          <Clock className="w-4 h-4 text-slate-400 ml-auto" />
          <span className="text-xs text-slate-400">
            {new Date(selectedDispute.updatedAt).toLocaleString('ru-RU')}
          </span>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto space-y-3">
          {(messages || []).map((msg: any) => {
            const isBuyer = msg.senderId === selectedDispute.buyerId;
            return (
              <div key={msg.id} className={`flex ${isBuyer ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm ${
                    isBuyer ? 'bg-slate-100 text-slate-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'
                  }`}
                >
                  <div className="font-black mb-1 text-[9px] uppercase opacity-70">
                    {isBuyer ? selectedDispute.buyer.firstName : selectedDispute.seller.firstName}
                  </div>
                  {msg.text}
                  <div className="text-[8px] mt-1 opacity-50">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>
            );
          })}
          {(messages || []).length === 0 && (
            <div className="text-center py-10 text-xs text-slate-400 font-bold uppercase tracking-widest">
              История сообщений пуста
            </div>
          )}
        </div>
      </div>

      {/* Кнопки решения */}
      <div className="grid grid-cols-2 gap-3 sticky bottom-4 z-10">
        <button
          onClick={() => resolveDispute(selectedDispute.id, 'CANCELLED')}
          disabled={loading[selectedDispute.id]}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
            loading[selectedDispute.id]
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-red-600 hover:bg-red-50 ring-1 ring-red-100 active:scale-95'
          }`}
        >
          {loading[selectedDispute.id] ? (
            <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <XCircle className="w-6 h-6" />
          )}
          <span>В ПОЛЬЗУ ПРОДАВЦА (ОТМЕНА)</span>
        </button>
        <button
          onClick={() => resolveDispute(selectedDispute.id, 'COMPLETED')}
          disabled={loading[selectedDispute.id]}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
            loading[selectedDispute.id]
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-blue-500/20'
          }`}
        >
          {loading[selectedDispute.id] ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <CheckCircle2 className="w-6 h-6" />
          )}
          <span>В ПОЛЬЗУ ПОКУПАТЕЛЯ (ВЫПЛАТА)</span>
        </button>
      </div>
    </div>
  );
}

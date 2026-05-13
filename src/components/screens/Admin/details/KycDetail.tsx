'use client';

import { t, Language } from '../../../../lib/dictionaries';
import { ShieldCheck, UserCheck, UserX } from 'lucide-react';

interface KycDetailProps {
  selectedKyc: any;
  language: Language;
  kycLoading: Record<string, boolean>;
  processKyc: (userId: string, action: 'approve' | 'reject') => void;
}

export default function KycDetail({ selectedKyc, language, kycLoading, processKyc }: KycDetailProps) {
  return (
    <div className="p-4 space-y-4 pb-32">
      {/* Информация о пользователе */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-500" /> {t(language, 'adminUserInfo')}
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-500 text-sm">{t(language, 'adminUserName')}:</span>
            <span className="font-bold text-slate-800">{selectedKyc.firstName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-sm">Username:</span>
            <span className="font-bold text-slate-800">@{selectedKyc.username || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-sm">Telegram ID:</span>
            <span className="font-bold text-slate-800 text-xs">{selectedKyc.telegramId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-sm">{t(language, 'adminUserNickname')}:</span>
            <span className="font-bold text-slate-800">{selectedKyc.nickname || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-sm">{t(language, 'adminUserRegDate')}:</span>
            <span className="font-bold text-slate-800 text-xs">
              {new Date(selectedKyc.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
      </div>

      {/* Фото документа */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-500" /> {t(language, 'kycPassportScan')}
        </h3>
        {selectedKyc.kycPhotoUrl ? (
          <div className="rounded-2xl overflow-hidden border-2 border-emerald-200">
            <img src={selectedKyc.kycPhotoUrl} alt="KYC Document" className="w-full h-auto" />
          </div>
        ) : (
          <div className="bg-slate-50 p-8 rounded-2xl text-center text-slate-400">
            {t(language, 'adminPhotoNotUploaded')}
          </div>
        )}
      </div>

      {/* Селфи с паспортом */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-500" /> {t(language, 'kycSelfieWithPassport')}
        </h3>
        {selectedKyc.kycSelfieUrl ? (
          <div className="rounded-2xl overflow-hidden border-2 border-emerald-200">
            <img src={selectedKyc.kycSelfieUrl} alt="KYC Selfie" className="w-full h-auto" />
          </div>
        ) : (
          <div className="bg-slate-50 p-8 rounded-2xl text-center text-slate-400">
            {t(language, 'adminPhotoNotUploaded')}
          </div>
        )}
      </div>

      {/* Кнопки решения */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => processKyc(selectedKyc.id, 'reject')}
          disabled={kycLoading[selectedKyc.id]}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl font-bold text-sm transition-all ${
            kycLoading[selectedKyc.id]
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-50 text-red-600 hover:bg-red-100 active:scale-95'
          }`}
        >
          {kycLoading[selectedKyc.id] ? (
            <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <UserX className="w-6 h-6" />
          )}
          <span>{t(language, 'adminRejectBtn')}</span>
        </button>
        <button
          onClick={() => processKyc(selectedKyc.id, 'approve')}
          disabled={kycLoading[selectedKyc.id]}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl font-bold text-sm transition-all ${
            kycLoading[selectedKyc.id]
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95'
          }`}
        >
          {kycLoading[selectedKyc.id] ? (
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <UserCheck className="w-6 h-6" />
          )}
          <span>{t(language, 'adminApproveBtn')}</span>
        </button>
      </div>
    </div>
  );
}

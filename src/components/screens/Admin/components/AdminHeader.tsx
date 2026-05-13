'use client';

import { t, Language } from '@/lib/dictionaries';
import { ChevronLeft, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AdminHeaderProps {
  onClose: () => void;
  language: Language;
  selectedKyc?: any;
  selectedDispute?: any;
  handleBackToList: () => void;
}

export default function AdminHeader({ onClose, language, selectedKyc, selectedDispute, handleBackToList }: AdminHeaderProps) {
  if (selectedKyc) {
    return (
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={handleBackToList} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-emerald-600 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> {t(language, 'adminKYCRequest').replace('{id}', selectedKyc.id.slice(0, 8))}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'adminKYCCheck')}</p>
        </div>
      </div>
    );
  }

  if (selectedDispute) {
    return (
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={handleBackToList} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-red-600 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> {t(language, 'adminDisputeTitle').replace('{id}', selectedDispute.id.slice(0, 8))}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'adminDisputeSubtitle')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
      <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <div>
        <h2 className="text-lg font-bold text-red-600 tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {t(language, 'adminTitle')}
        </h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'adminSubtitle')}</p>
      </div>
    </div>
  );
}

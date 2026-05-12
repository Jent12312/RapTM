'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import {
  Gift, Key, Copy, Check, Clock, AlertCircle, History,
  X, ChevronLeft, RefreshCw, Share2, QrCode
} from 'lucide-react';

export default function CodeScreen({ onClose }: { onClose: () => void }) {
  const { user, language, addToast } = useAppStore();

  const [mode, setMode] = useState<'create' | 'redeem' | 'history'>('create');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USDT' | 'TMT'>('USDT');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeData, setCodeData] = useState<any>(null);

  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const [codesHistory, setCodesHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Загрузка истории кодов
  const fetchCodesHistory = async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/codes?userId=${user.id}&type=all`);
      if (res.ok) {
        const data = await res.json();
        setCodesHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch codes:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (mode === 'history') {
      fetchCodesHistory();
    }
  }, [mode]);

  // Генерация кода
  const handleGenerateCode = async () => {
    if (!amount || Number(amount) <= 0) {
      addToast(t(language, 'amount'), 'error');
      return;
    }

    try {
      const res = await fetch('/api/codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          currency
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedCode(data.code);
        setCodeData(data);
        addToast(t(language, 'codeGenerated'), 'success');
      } else {
        addToast(data.error || t(language, 'error'), 'error');
      }
    } catch (e) {
      addToast(t(language, 'error'), 'error');
    }
  };

  // Активация кода
  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      addToast(t(language, 'codeLabel'), 'error');
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await fetch('/api/codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: redeemCode.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(`${data.amount} ${data.currency} ${t(language, 'codeRedeemSuccess')}`, 'success');
        setRedeemCode('');
      } else {
        addToast(data.error || t(language, 'error'), 'error');
      }
    } catch (e) {
      addToast(t(language, 'error'), 'error');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Копирование кода
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast(t(language, 'linkCopied'), 'info');
  };

  // Сброс генерации
  const resetGeneration = () => {
    setGeneratedCode(null);
    setCodeData(null);
    setAmount('');
  };

  // Форматирование статуса кода
  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      ACTIVE: 'bg-emerald-100 text-emerald-700',
      USED: 'bg-slate-100 text-slate-600',
      EXPIRED: 'bg-red-100 text-red-600',
      CANCELLED: 'bg-orange-100 text-orange-600'
    };
    const labels: Record<string, string> = {
      ACTIVE: t(language, 'codeActive'),
      USED: t(language, 'codeUsed'),
      EXPIRED: t(language, 'codeExpired'),
      CANCELLED: t(language, 'codeCancelled')
    };
    return (
      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${badges[status] || badges.ACTIVE}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Шапка */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-500" /> {t(language, 'codesTitle')}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'codesSubtitle')}</p>
        </div>
      </div>

      {/* Табы переключения */}
      <div className="bg-white px-4 py-3 sticky top-[60px] z-10 border-b border-slate-100">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              mode === 'create'
                ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                : 'bg-slate-50 text-slate-500'
            }`}
          >
            <Gift className="w-4 h-4" /> {t(language, 'createCode')}
          </button>
          <button
            onClick={() => setMode('redeem')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              mode === 'redeem'
                ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                : 'bg-slate-50 text-slate-500'
            }`}
          >
            <Key className="w-4 h-4" /> {t(language, 'redeemCode')}
          </button>
          <button
            onClick={() => setMode('history')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              mode === 'history'
                ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
                : 'bg-slate-50 text-slate-500'
            }`}
          >
            <History className="w-4 h-4" /> {t(language, 'codesHistory')}
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="p-4 space-y-4 pb-32">
        {/* Создание кода */}
        {mode === 'create' && (
          <div className="space-y-4">
            {!generatedCode ? (
              <>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-emerald-50 rounded-2xl">
                      <Gift className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{t(language, 'createCode')}</h3>
                      <p className="text-[10px] text-slate-400">{t(language, 'codesSubtitle')}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{t(language, 'amount')}</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50 ring-1 ring-slate-200 rounded-2xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{t(language, 'walyutalar')}</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrency('USDT')}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold ${
                            currency === 'USDT'
                              ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                              : 'bg-slate-50 text-slate-500'
                          }`}
                        >
                          USDT
                        </button>
                        <button
                          onClick={() => setCurrency('TMT')}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold ${
                            currency === 'TMT'
                              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                              : 'bg-slate-50 text-slate-500'
                          }`}
                        >
                          TMT
                        </button>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                        <div className="text-[10px] text-amber-700 space-y-1">
                          <p className="font-bold">{t(language, 'codeCommission')} {user?.level === 'Partner' ? '0.2%' : '0%'}</p>
                          <p>{t(language, 'codeExpiresIn')}</p>
                          <p>{t(language, 'codeOneTime')}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateCode}
                      className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all"
                    >
                      {t(language, 'codeCreateBtn')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-emerald-200 border-2 border-emerald-100">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{t(language, 'codeGenerated')}</h3>
                  <p className="text-sm text-slate-500 mt-1">{t(language, 'codeCopyInfo')}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'codeLabel')}</span>
                    <button onClick={() => copyCode(generatedCode!)} className="text-emerald-500 p-1">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded-xl ring-1 ring-slate-200 text-center">
                    <code className="text-sm font-black text-slate-800 tracking-wider break-all">
                      {generatedCode}
                    </code>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{t(language, 'amount')}</span>
                    <span className="text-lg font-black text-slate-800">{codeData?.amount} {codeData?.currency}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{t(language, 'codeFee')}</span>
                    <span className="text-lg font-black text-slate-800">{codeData?.fee} {codeData?.currency}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 mb-4">
                  <Clock className="w-3 h-3" />
                  <span>{t(language, 'codeValidUntil')} {new Date(codeData?.expiresAt).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}</span>
                </div>

                <button
                  onClick={resetGeneration}
                  className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl active:scale-95 transition-all"
                >
                  {t(language, 'createCode')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Активация кода */}
        {mode === 'redeem' && (
          <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Key className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{t(language, 'redeemCode')}</h3>
                <p className="text-[10px] text-slate-400">{t(language, 'codeEnterPlaceholder')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{t(language, 'codeLabel')}</label>
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder={t(language, 'codeEnterPlaceholder')}
                  className="w-full bg-slate-50 ring-1 ring-slate-200 rounded-2xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider placeholder-slate-500"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="text-[10px] text-blue-700 space-y-1">
                    <p>{t(language, 'codeWarning1')}</p>
                    <p>{t(language, 'codeWarning2')}</p>
                    <p>{t(language, 'codeWarning3')}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRedeemCode}
                disabled={isRedeeming}
                className={`w-full py-4 font-bold rounded-2xl shadow-lg active:scale-95 transition-all ${
                  isRedeeming
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white shadow-blue-200'
                }`}
              >
                {isRedeeming ? t(language, 'processing') : t(language, 'codeRedeemBtn')}
              </button>
            </div>
          </div>
        )}

        {/* История кодов */}
        {mode === 'history' && (
          <div className="space-y-3">
            {isLoadingHistory ? (
              <div className="text-center text-slate-400 py-10">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm font-medium">{t(language, 'adminLoading')}</p>
              </div>
            ) : codesHistory.length === 0 ? (
              <div className="text-center text-slate-400 py-10">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">{t(language, 'codeEmptyHistory')}</p>
                <p className="text-xs mt-1">{t(language, 'codeEmptyHistorySub')}</p>
              </div>
            ) : (
              codesHistory.map((code) => (
                <div key={code.id} className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${code.creatorId === user.id ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                        {code.creatorId === user.id ? <Gift className="w-4 h-4 text-emerald-500" /> : <Key className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400">
                          {code.creatorId === user.id ? t(language, 'codeYouCreated') : t(language, 'codeYouRedeemed')}
                        </p>
                        <p className="text-sm font-black text-slate-800">{code.amount} {code.currency}</p>
                      </div>
                    </div>
                    {getStatusBadge(code.status)}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl mb-3">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t(language, 'codeIdKey')}</p>
                    <code className="text-xs font-bold text-slate-600 tracking-wider break-all">
                      {code.code}
                    </code>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(code.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                    {code.usedAt && (
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {new Date(code.usedAt).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

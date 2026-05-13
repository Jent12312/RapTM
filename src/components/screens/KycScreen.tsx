'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ShieldCheck, UploadCloud, CheckCircle2, X, Camera, Image } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import WebApp from '@twa-dev/sdk';

export default function KycScreen({ onClose }: { onClose: () => void }) {
  const { user, language, addToast, initUser } = useAppStore();
  const [kycSelfie, setKycSelfie] = useState<File | null>(null);
  const [kycSelfiePreview, setKycSelfiePreview] = useState<string | null>(null);
  const [kycDocument, setKycDocument] = useState<File | null>(null);
  const [kycDocumentPreview, setKycDocumentPreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Получаем актуальный статус из user или храним локально
  const kycStatus = user?.kycStatus || 'NONE';
  const isVerified = user?.isVerified || kycStatus === 'VERIFIED';
  const isPending = kycStatus === 'PENDING';
  const isRejected = kycStatus === 'REJECTED';

  const handlePhotoSelect = (file: File, type: 'selfie' | 'document') => {
    // Проверка типа
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      addToast(t(language, 'kycOnlyJpegPng'), 'error');
      return;
    }

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast(t(language, 'kycMaxFileSize'), 'error');
      return;
    }

    if (type === 'selfie') setKycSelfie(file);
    else setKycDocument(file);
    
    // Создаём превью
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'selfie') setKycSelfiePreview(e.target?.result as string);
      else setKycDocumentPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitKyc = async () => {
    if (!kycSelfie || !kycDocument) {
      addToast(t(language, 'kycPhotoRequired'), 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('selfie', kycSelfie);
      formData.append('document', kycDocument);

      const res = await fetch(`/api/user/${user.id}/kyc-upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        addToast(t(language, 'kycSubmitSuccess'), 'success');
        // Обновляем пользователя в сторе
        await initUser(WebApp.initData);
      } else {
        addToast(data.error || t(language, 'kycSubmitError'), 'error');
      }
    } catch (error) {
      console.error(error);
      addToast(t(language, 'networkError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePhoto = (type: 'selfie' | 'document') => {
    if (type === 'selfie') {
      setKycSelfie(null);
      setKycSelfiePreview(null);
      if (selfieInputRef.current) selfieInputRef.current.value = '';
    } else {
      setKycDocument(null);
      setKycDocumentPreview(null);
      if (documentInputRef.current) documentInputRef.current.value = '';
    }
  };

  // Компонент для секции загрузки
  const UploadSection = ({ 
    title, 
    preview, 
    inputRef, 
    onSelect, 
    onRemove 
  }: { 
    title: string, 
    preview: string | null, 
    inputRef: React.RefObject<HTMLInputElement>,
    onSelect: (file: File) => void,
    onRemove: () => void
  }) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
      <h4 className="text-sm font-bold text-slate-700 mb-4">{title}</h4>

      {preview ? (
        <div className="relative">
          <div className="rounded-2xl overflow-hidden border-2 border-emerald-200">
            <img
              src={preview}
              alt="KYC Photo"
              className="w-full h-48 object-cover"
            />
          </div>
          <button
            onClick={onRemove}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-red-500 shadow-lg hover:bg-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-400 transition-all"
          >
            <Camera className="w-8 h-8 text-slate-400" />
            <p className="text-sm font-bold text-slate-600">{t(language, 'kycOpenCam')}</p>
            <p className="text-xs text-slate-400">Telegram MediaPicker</p>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSelect(file);
            }}
            className="hidden"
          />
        </div>
      )}
    </div>
  );

  // Если уже верифицирован
  if (isVerified) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
          <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{t(language, 'kycTitle')}</h2>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t(language, 'kycSecurity')}</p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-[2rem] text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-emerald-800">{t(language, 'kycVerifiedTitle')}</h3>
            <p className="text-sm text-emerald-600 mt-2 font-medium">{t(language, 'kycVerifiedDesc')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Если заявка на рассмотрении
  if (isPending) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
          <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{t(language, 'kycTitle')}</h2>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{t(language, 'kycPending')}</p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-[2rem] text-center">
            <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-pulse" />
            <h3 className="text-xl font-bold text-blue-800">{t(language, 'kycPendingTitle2')}</h3>
            <p className="text-sm text-blue-600 mt-2 font-medium">{t(language, 'kycPendingDesc2')}</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
            <h4 className="text-sm font-bold text-slate-700 mb-2">{t(language, 'kycWhatNext')}</h4>
            <ul className="text-sm font-medium text-slate-500 space-y-2">
              <li>⏳ {t(language, 'kycStep1Wait')}</li>
              <li>📩 {t(language, 'kycStep2Check')}</li>
              <li>✅ {t(language, 'kycNextStepDone')}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Если заявка отклонена
  if (isRejected) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
          <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{t(language, 'kycTitle')}</h2>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{t(language, 'kycRejected')}</p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div className="bg-red-50 border border-red-200 p-6 rounded-[2rem] text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-red-800">{t(language, 'kycRejectedTitle2')}</h3>
            <p className="text-sm text-red-600 mt-2 font-medium">{t(language, 'kycRejectedDesc2')}</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
            <h4 className="text-sm font-bold text-slate-700 mb-2">{t(language, 'kycPossibleReasons2')}</h4>
            <ul className="text-sm font-medium text-slate-500 space-y-2">
              <li>❌ {t(language, 'kycReasonBlurry')}</li>
              <li>❌ {t(language, 'kycReasonExpired')}</li>
              <li>❌ {t(language, 'kycReasonMismatch')}</li>
            </ul>
          </div>

          <button
            onClick={() => {
              handleRemovePhoto('selfie');
              handleRemovePhoto('document');
            }}
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            {t(language, 'kycSubmitBtn')}
          </button>
        </div>
      </div>
    );
  }

  // Стандартная форма подачи заявки
  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">{t(language, 'kycTitle')}</h2>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t(language, 'kycSecurity')}</p>
        </div>
      </div>

      <div className="p-5 space-y-6">

        <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">{t(language, 'kycWhy')}</h3>
          <ul className="text-sm font-medium text-slate-500 space-y-2">
            <li>✅ {t(language, 'kycVerifiedDesc')}</li>
            <li>✅ {t(language, 'adOnlyVerified')}</li>
            <li>✅ {t(language, 'kycWhyDesc2')}</li>
          </ul>
        </div>

        <UploadSection 
          title={t(language, 'kycStep1Title')}
          preview={kycSelfiePreview}
          inputRef={selfieInputRef}
          onSelect={(file) => handlePhotoSelect(file, 'selfie')}
          onRemove={() => handleRemovePhoto('selfie')}
        />

        <UploadSection 
          title={t(language, 'kycStep2Title')}
          preview={kycDocumentPreview}
          inputRef={documentInputRef}
          onSelect={(file) => handlePhotoSelect(file, 'document')}
          onRemove={() => handleRemovePhoto('document')}
        />

        <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
          <h4 className="text-sm font-bold text-slate-700 mb-4">{t(language, 'kycStep3Title')}</h4>
          <button
            onClick={handleSubmitKyc}
            disabled={!kycSelfie || !kycDocument || isSubmitting}
            className={`w-full font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all ${
              kycSelfie && kycDocument && !isSubmitting
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? t(language, 'kycSubmitting') : t(language, 'kycSubmitBtn')}
          </button>
        </div>

    </div>
  );
}

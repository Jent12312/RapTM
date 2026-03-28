'use client';

import { useState } from 'react';
import { ChevronLeft, ShieldCheck, UploadCloud, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function KycScreen({ onClose }: { onClose: () => void }) {
  const { user, addToast } = useAppStore();
  const [isSubmitted, setIsSubmitted] = useState(user?.isVerified || false);

  const handleSubmitKyc = async () => {
    // В MVP мы просто отправляем запрос админу, а не грузим реальные фото на S3.
    // Для демо мы просто поставим пользователю статус "в ожидании" или сразу верифицируем его (если он админ).
    
    addToast("Заявка на верификацию отправлена! Ожидайте проверки.", "success");
    setIsSubmitted(true);

    // Временный ХАК для MVP: Если юзер нажал кнопку, даем ему KYC через 3 секунды "автоматически", 
    // чтобы ты мог тестить функционал без ручного захода в БД.
    // В реале тут будет API запрос /api/user/kyc
    setTimeout(async () => {
      await fetch(`/api/user/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: true })
      });
      addToast("Ваш аккаунт успешно верифицирован!", "success");
      // Перезагрузка страницы для обновления стейта
      window.location.reload();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Верификация (KYC)</h2>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Безопасность платформы</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {user?.isVerified ? (
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-[2rem] text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-emerald-800">Аккаунт подтвержден</h3>
            <p className="text-sm text-emerald-600 mt-2 font-medium">Вам доступны все лимиты и торговля с проверенными мерчантами.</p>
          </div>
        ) : isSubmitted ? (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-[2rem] text-center">
            <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-pulse" />
            <h3 className="text-xl font-bold text-blue-800">Заявка на проверке</h3>
            <p className="text-sm text-blue-600 mt-2 font-medium">Администратор проверяет ваши документы. Обычно это занимает 10-15 минут.</p>
          </div>
        ) : (
          <>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Зачем нужен KYC?</h3>
              <ul className="text-sm font-medium text-slate-500 space-y-2">
                <li>✅ Торговля без ограничений</li>
                <li>✅ Доступ к объявлениям топовых мерчантов</li>
                <li>✅ Защита от мошенников (Ваш аккаунт сложнее украсть)</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100 text-center border-2 border-dashed border-slate-200">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Загрузите фото паспорта</p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG до 5 MB</p>
              
              <button 
                onClick={handleSubmitKyc}
                className="mt-6 w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                Отправить на проверку
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

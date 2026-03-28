'use client';

import { useState } from 'react';
import { ChevronLeft, ShieldCheck, UploadCloud, CheckCircle2, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import WebApp from '@twa-dev/sdk';

export default function KycScreen({ onClose }: { onClose: () => void }) {
  const { user, addToast, initUser } = useAppStore();
  const [kycPhoto, setKycPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Получаем актуальный статус из user или храним локально
  const kycStatus = user?.kycStatus || 'none';
  const isVerified = user?.isVerified || kycStatus === 'verified';
  const isPending = kycStatus === 'pending';
  const isRejected = kycStatus === 'rejected';

  const handlePhotoUpload = () => {
    // Имитация загрузки фото - в Telegram используем нативный picker
    WebApp.showPopup({
      title: 'Загрузка фото',
      message: 'Выберите способ загрузки',
      buttons: [
        {
          id: 'camera',
          text: 'Сделать фото',
          type: 'default'
        },
        {
          id: 'gallery',
          text: 'Выбрать из галереи',
          type: 'default'
        }
      ]
    }, (btnId) => {
      if (btnId) {
        // Для демо просто ставим "загружено"
        setKycPhoto('uploaded_photo.jpg');
        WebApp.HapticFeedback.notificationOccurred('success');
      }
    });
  };

  const handleSubmitKyc = async () => {
    if (!kycPhoto) {
      addToast('Сначала загрузите фото документа', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/user/${user.id}/kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kycPhotoUrl: kycPhoto
        })
      });

      const data = await res.json();

      if (res.ok) {
        addToast('Заявка отправлена! Ожидайте проверки администратором.', 'success');
        // Обновляем пользователя в сторе
        await initUser(WebApp.initDataUnsafe.user);
      } else {
        addToast(data.error || 'Ошибка при отправке заявки', 'error');
      }
    } catch (error) {
      addToast('Ошибка сети', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Если уже верифицирован
  if (isVerified) {
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
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-[2rem] text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-emerald-800">Аккаунт подтвержден</h3>
            <p className="text-sm text-emerald-600 mt-2 font-medium">Вам доступны все лимиты и торговля с проверенными мерчантами.</p>
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
            <h2 className="text-lg font-bold text-slate-800">Верификация (KYC)</h2>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">На проверке</p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-[2rem] text-center">
            <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-pulse" />
            <h3 className="text-xl font-bold text-blue-800">Заявка на проверке</h3>
            <p className="text-sm text-blue-600 mt-2 font-medium">Администратор проверяет ваши документы. Обычно это занимает 10-15 минут.</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
            <h4 className="text-sm font-bold text-slate-700 mb-2">Что дальше?</h4>
            <ul className="text-sm font-medium text-slate-500 space-y-2">
              <li>⏳ Ожидайте уведомления о проверке</li>
              <li>📩 Администратор свяжется с вами в случае вопросов</li>
              <li>✅ После одобрения вы получите галочку верификации</li>
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
            <h2 className="text-lg font-bold text-slate-800">Верификация (KYC)</h2>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Отклонено</p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div className="bg-red-50 border border-red-200 p-6 rounded-[2rem] text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-red-800">Заявка отклонена</h3>
            <p className="text-sm text-red-600 mt-2 font-medium">Администратор не смог подтвердить ваши данные.</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
            <h4 className="text-sm font-bold text-slate-700 mb-2">Возможные причины:</h4>
            <ul className="text-sm font-medium text-slate-500 space-y-2">
              <li>❌ Фото нечеткое или не читается</li>
              <li>❌ Документ просрочен</li>
              <li>❌ Данные не совпадают с профилем</li>
            </ul>
          </div>

          <button
            onClick={() => { setKycPhoto(null); }}
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            Подать заявку повторно
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
          <h2 className="text-lg font-bold text-slate-800">Верификация (KYC)</h2>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Безопасность платформы</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Зачем нужен KYC?</h3>
          <ul className="text-sm font-medium text-slate-500 space-y-2">
            <li>✅ Торговля без ограничений</li>
            <li>✅ Доступ к объявлениям топовых мерчантов</li>
            <li>✅ Защита от мошенников (Ваш аккаунт сложнее украсть)</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
          <h4 className="text-sm font-bold text-slate-700 mb-4">Шаг 1: Загрузите фото документа</h4>
          
          {kycPhoto ? (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-emerald-700">Фото загружено</p>
                  <p className="text-xs text-emerald-600">{kycPhoto}</p>
                </div>
              </div>
              <button onClick={() => setKycPhoto(null)} className="p-2 bg-white rounded-full text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handlePhotoUpload}
              className="w-full border-2 border-dashed border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-400 transition-all"
            >
              <UploadCloud className="w-10 h-10 text-slate-400" />
              <p className="text-sm font-bold text-slate-600">Нажмите для загрузки</p>
              <p className="text-xs text-slate-400">JPEG, PNG до 5 MB</p>
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
          <h4 className="text-sm font-bold text-slate-700 mb-4">Шаг 2: Отправьте на проверку</h4>
          <button
            onClick={handleSubmitKyc}
            disabled={!kycPhoto || isSubmitting}
            className={`w-full font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all ${
              kycPhoto && !isSubmitting
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Отправка...' : 'Отправить на проверку'}
          </button>
        </div>

      </div>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ShieldCheck, UploadCloud, CheckCircle2, X, Camera, Image } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import WebApp from '@twa-dev/sdk';

export default function KycScreen({ onClose }: { onClose: () => void }) {
  const { user, addToast, initUser } = useAppStore();
  const [kycPhoto, setKycPhoto] = useState<File | null>(null);
  const [kycPreview, setKycPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Получаем актуальный статус из user или храним локально
  const kycStatus = user?.kycStatus || 'none';
  const isVerified = user?.isVerified || kycStatus === 'verified';
  const isPending = kycStatus === 'pending';
  const isRejected = kycStatus === 'rejected';

  const handlePhotoSelect = (file: File) => {
    // Проверка типа
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Только JPEG и PNG изображения', 'error');
      return;
    }

    // Проверка размера (5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('Размер файла должен быть меньше 5MB', 'error');
      return;
    }

    setKycPhoto(file);
    
    // Создаём превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setKycPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = () => {
    // Открываем стандартный выбор файла через click
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoSelect(file);
    }
  };

  const handleSubmitKyc = async () => {
    if (!kycPhoto) {
      addToast('Сначала загрузите фото документа', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('photo', kycPhoto);

      const res = await fetch(`/api/user/${user.id}/kyc-upload`, {
        method: 'POST',
        body: formData
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
      console.error(error);
      addToast('Ошибка сети', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePhoto = () => {
    setKycPhoto(null);
    setKycPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            onClick={handleRemovePhoto}
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
          
          {kycPreview ? (
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border-2 border-emerald-200">
                <img 
                  src={kycPreview} 
                  alt="KYC Photo" 
                  className="w-full h-64 object-cover"
                />
              </div>
              <button 
                onClick={handleRemovePhoto}
                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-red-500 shadow-lg hover:bg-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handlePhotoUpload}
                className="w-full border-2 border-dashed border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-400 transition-all"
              >
                <Camera className="w-10 h-10 text-slate-400" />
                <p className="text-sm font-bold text-slate-600">Открыть камеру / Галерею</p>
                <p className="text-xs text-slate-400">Telegram MediaPicker</p>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs text-slate-400 font-medium">или</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 p-4 rounded-2xl flex items-center justify-center gap-3 hover:border-blue-400 transition-all"
              >
                <Image className="w-6 h-6 text-slate-400" />
                <p className="text-sm font-bold text-slate-600">Выбрать файл</p>
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}
          
          <p className="text-xs text-slate-400 mt-3 text-center">
            📸 Сделайте четкое фото паспорта или другого документа
          </p>
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

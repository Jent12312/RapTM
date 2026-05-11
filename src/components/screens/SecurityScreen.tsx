'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { 
  ChevronLeft, ShieldCheck, Phone, Mail, Lock, 
  Smartphone, Eye, EyeOff, Loader2, X, CheckCircle2,
  AlertTriangle, Key
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';

interface Props {
  onClose: () => void;
}

export default function SecurityScreen({ onClose }: Props) {
  const { user, language, addToast, initUser } = useAppStore();
  
  // Security levels
  const [securityScore, setSecurityScore] = useState(0);
  const [isChangingPasscode, setIsChangingPasscode] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [oldPasscode, setOldPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState(''); // Also used for 2FA token
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<any>(null);

  // Phone & Email states
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    // Calculate security score
    let score = 0;
    if (user?.phone) score += 25;
    if (user?.email && user?.isEmailVerified) score += 25;
    if (user?.passcode) score += 25;
    if (isTwoFactorEnabled) score += 25;
    setSecurityScore(score);

    // Fetch 2FA status
    fetch(`/api/user/${user?.id}/2fa`)
      .then(res => res.json())
      .then(data => setIsTwoFactorEnabled(data.enabled));
  }, [user, isTwoFactorEnabled]);

  const handleChangePasscode = async () => {
    if (newPasscode.length < 4) return addToast('Минимум 4 цифры', 'error');
    if (newPasscode !== confirmPasscode) return addToast('Пароли не совпадают', 'error');

    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: newPasscode })
      });

      if (res.ok) {
        addToast('Пароль изменен', 'success');
        setIsChangingPasscode(false);
        setOldPasscode('');
        setNewPasscode('');
        setConfirmPasscode('');
        initUser(WebApp.initData);
        WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (e) {
      addToast('Ошибка запроса', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = async (token?: string, secretToEnable?: string) => {
    setIsLoading(true);
    try {
      if (!isTwoFactorEnabled) {
        if (!token) {
          // Step 1: Get Setup Data
          const res = await fetch(`/api/user/${user?.id}/2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'setup' })
          });
          const data = await res.json();
          if (res.ok) {
            setTwoFactorData(data);
            setConfirmPasscode(''); // Reset token input
            setIs2FAModalOpen(true);
          } else {
            addToast(data.error || 'Ошибка настройки 2FA', 'error');
          }
        } else {
          // Step 2: Verify and Enable
          const res = await fetch(`/api/user/${user?.id}/2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'enable', token, secret: secretToEnable })
          });
          if (res.ok) {
            setIsTwoFactorEnabled(true);
            setIs2FAModalOpen(false);
            addToast('Google Authenticator подключен', 'success');
            initUser(WebApp.initData);
          } else {
            const data = await res.json();
            addToast(data.error || 'Неверный код', 'error');
          }
        }
      } else {
        // Disable Flow
        if (!token) {
          // Open modal to ask for token to disable
          setTwoFactorData({ action: 'disable' });
          setConfirmPasscode(''); // Reset token input
          setIs2FAModalOpen(true);
        } else {
          const res = await fetch(`/api/user/${user?.id}/2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'disable', token })
          });
          if (res.ok) {
            setIsTwoFactorEnabled(false);
            setIs2FAModalOpen(false);
            addToast('2FA отключена', 'info');
            initUser(WebApp.initData);
          } else {
            const data = await res.json();
            addToast(data.error || 'Неверный код', 'error');
          }
        }
      }
    } catch (e) {
      addToast('Ошибка запроса', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/${user.id}/contact`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        setIsEditingPhone(false);
        addToast('Телефон обновлен', 'success');
        initUser(WebApp.initData);
        WebApp.HapticFeedback.notificationOccurred('success');
      } else {
        addToast('Ошибка сохранения', 'error');
      }
    } catch (e) {
      addToast('Ошибка запроса', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/${user.id}/contact`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setIsEditingEmail(false);
        addToast('Email обновлен', 'success');
        initUser(WebApp.initData);
        WebApp.HapticFeedback.notificationOccurred('success');
      } else {
        addToast('Ошибка сохранения', 'error');
      }
    } catch (e) {
      addToast('Ошибка запроса', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const MenuItem = ({ icon: Icon, label, value, onClick, isVerified, color }: any) => (
    <button 
      onClick={onClick}
      className="w-full bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${color} shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{label}</h4>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{value || 'Не привязано'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isVerified ? (
          <div className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ring-1 ring-emerald-100">Активно</div>
        ) : (
          <div className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ring-1 ring-amber-100">Настроить</div>
        )}
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-3 border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Безопасность</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-20">
        {/* Security Score Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-1">Уровень защиты</p>
                <h3 className="text-2xl font-black">{securityScore}%</h3>
              </div>
              <div className={`p-3 rounded-2xl ${securityScore >= 75 ? 'bg-emerald-500' : 'bg-amber-500'} shadow-lg`}>
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${securityScore >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${securityScore}%` }}
              ></div>
            </div>
            <p className="text-[10px] font-bold text-slate-400">
              {securityScore < 100 ? 'Рекомендуем привязать все методы защиты' : 'Ваш аккаунт максимально защищен'}
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          <MenuItem 
            icon={Phone} 
            label="Телефон" 
            value={user?.phone ? `+${user.phone}` : 'Привязать для вывода'} 
            isVerified={!!user?.phone}
            color="bg-blue-500"
            onClick={() => setIsEditingPhone(true)}
          />
          <MenuItem 
            icon={Mail} 
            label="Email" 
            value={user?.email || 'Привязать для уведомлений'} 
            isVerified={user?.isEmailVerified}
            color="bg-indigo-500"
            onClick={() => setIsEditingEmail(true)}
          />
          <MenuItem 
            icon={Smartphone} 
            label="2FA Authenticator" 
            value={isTwoFactorEnabled ? 'Google Authenticator' : 'Не настроено'} 
            isVerified={isTwoFactorEnabled}
            color="bg-purple-500"
            onClick={() => handleToggle2FA()}
          />
          <MenuItem 
            icon={Lock} 
            label="PIN-код" 
            value="Защита при входе и операциях" 
            isVerified={!!user?.passcode}
            color="bg-slate-700"
            onClick={() => setIsChangingPasscode(true)}
          />
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100/50 flex gap-4">
           <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
           <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
             Внимание: При изменении PIN-кода или привязки нового телефона, вывод средств будет заблокирован на 24 часа в целях безопасности.
           </p>
        </div>
      </div>

      {/* Change Passcode Modal */}
      {isChangingPasscode && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-md flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Изменить PIN</h3>
              </div>
              <button onClick={() => setIsChangingPasscode(false)} className="p-2 bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Новый PIN-код</label>
                <input 
                  type="password" 
                  inputMode="numeric"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-900 focus:bg-white text-center text-2xl font-black tracking-[1em] outline-none transition-all"
                  placeholder="••••"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Повторите PIN-код</label>
                <input 
                  type="password" 
                  inputMode="numeric"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-900 focus:bg-white text-center text-2xl font-black tracking-[1em] outline-none transition-all"
                  placeholder="••••"
                  maxLength={6}
                />
              </div>

              <button 
                disabled={isLoading}
                onClick={handleChangePasscode}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'СОХРАНИТЬ НОВЫЙ PIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup/Disable Modal */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-50 overflow-y-auto animate-in slide-in-from-bottom duration-500">
           <div className="p-8 space-y-8 max-w-md mx-auto">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                   {twoFactorData?.action === 'disable' ? 'Отключение 2FA' : 'Настройка 2FA'}
                 </h3>
                 <button onClick={() => setIs2FAModalOpen(false)} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl"><X className="w-6 h-6 text-slate-400" /></button>
              </div>

              <div className="space-y-6 text-center">
                 {twoFactorData?.qrCode && (
                   <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 inline-block">
                      <img src={twoFactorData?.qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
                   </div>
                 )}
                 
                 <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-800">
                      {twoFactorData?.action === 'disable' ? 'Введите код из приложения для отключения' : 'Отсканируйте QR в Google Authenticator'}
                    </p>
                    {twoFactorData?.secret && (
                      <>
                        <p className="text-xs text-slate-400">Или введите код вручную:</p>
                        <div className="bg-slate-100 p-4 rounded-2xl font-mono text-sm font-black text-slate-600 tracking-widest break-all">
                           {twoFactorData?.secret}
                        </div>
                      </>
                    )}
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Введите 6-значный код</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmPasscode} 
                      onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-5 bg-white rounded-2xl border-2 border-slate-100 focus:border-slate-900 text-center text-2xl font-black tracking-[0.5em] outline-none transition-all shadow-sm"
                      placeholder="000000"
                    />
                 </div>

                 <div className={`${twoFactorData?.action === 'disable' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'} p-6 rounded-[2rem] border flex gap-4 text-left`}>
                    {twoFactorData?.action === 'disable' ? <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" /> : <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />}
                    <p className={`text-[11px] ${twoFactorData?.action === 'disable' ? 'text-rose-800' : 'text-emerald-800'} font-bold leading-relaxed`}>
                       {twoFactorData?.action === 'disable' 
                         ? 'Внимание: отключение 2FA снижает уровень безопасности вашего аккаунта.' 
                         : 'После сохранения секрета, ваш аккаунт будет требовать 6-значный код для каждого вывода и входа в систему.'}
                    </p>
                 </div>

                 <button 
                   disabled={isLoading || confirmPasscode.length !== 6}
                   onClick={() => handleToggle2FA(confirmPasscode, twoFactorData?.secret)}
                   className={`w-full py-5 ${twoFactorData?.action === 'disable' ? 'bg-rose-500 shadow-rose-100' : 'bg-emerald-500 shadow-emerald-100'} text-white rounded-2xl font-black text-xs tracking-widest shadow-lg disabled:opacity-50`}
                 >
                   {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'ПОДТВЕРДИТЬ'}
                 </button>
              </div>
           </div>
        </div>
      )}
      {/* Phone Modal */}
      {isEditingPhone && (
        <div className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Привязать телефон</h3>
              </div>
              <button onClick={() => setIsEditingPhone(false)} className="p-2 bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Номер телефона</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white text-lg font-bold outline-none transition-all"
                  placeholder="+993..."
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl flex gap-3">
                 <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                 <p className="text-[10px] text-amber-800 font-bold">После привязки или изменения номера вывод средств будет ограничен на 24 часа.</p>
              </div>

              <button 
                disabled={isLoading}
                onClick={handleUpdatePhone}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'СОХРАНИТЬ НОМЕР'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEditingEmail && (
        <div className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-indigo-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Привязать Email</h3>
              </div>
              <button onClick={() => setIsEditingEmail(false)} className="p-2 bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Адрес электронной почты</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white text-lg font-bold outline-none transition-all"
                  placeholder="example@mail.com"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
                 <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                 <p className="text-[10px] text-blue-800 font-bold">Email используется для получения уведомлений и восстановления доступа.</p>
              </div>

              <button 
                disabled={isLoading}
                onClick={handleUpdateEmail}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'СОХРАНИТЬ EMAIL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

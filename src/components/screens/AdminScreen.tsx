'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { ChevronLeft, AlertTriangle, CheckCircle2, XCircle, MessageCircle, Clock, ShieldCheck, UserCheck, UserX, Gift, RefreshCw, Users, TrendingUp, ArrowLeft, Copy, Settings, DollarSign, Percent, Lock, Unlock, Save } from 'lucide-react';

export default function AdminScreen({ onClose }: { onClose: () => void }) {
  const { language, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'disputes' | 'kyc' | 'exchanges' | 'crypto' | 'users' | 'partners' | 'stats' | 'settings' | 'logs' | 'audit' | 'stability' | 'blacklist' | 'cash' | 'levels'>('dashboard');
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // KYC состояния
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [kycLoading, setKycLoading] = useState<{ [key: string]: boolean }>({});

  // Обмены
  const [exchanges, setExchanges] = useState<any[]>([]);

  // Криптовалютные транзакции
  const [cryptoTxs, setCryptoTxs] = useState<any[]>([]);

  // Пользователи
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userOperations, setUserOperations] = useState<any[]>([]);
  const [selectedOpType, setSelectedOpType] = useState('all');
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Статистика
  const [stats, setStats] = useState<any>(null);

  // Настройки
  const [sysSettings, setSysSettings] = useState<Record<string, string>>({
    EXCHANGE_RATE: '19.5',
    EXCHANGE_FEE: '1',
    WELCOME_BONUS: '15',
    RATE_FROZEN: 'false'
  });
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [cashBalances, setCashBalances] = useState<any[]>([]);
  const [isBlacklistLoading, setIsBlacklistLoading] = useState(false);
  const [isCashLoading, setIsCashLoading] = useState(false);
  const [levelApps, setLevelApps] = useState<any[]>([]);
  const [isLevelsLoading, setIsLevelsLoading] = useState(false);

  // Audit logs
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);

  // System logs
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);

  // Reconciliation
  const [reconLoading, setReconLoading] = useState(false);
  const [reconLogs, setReconLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/disputes')
      .then(res => res.json())
      .then(data => setDisputes(data || []));
  }, []);

  // Загрузка KYC заявок
  const fetchKycRequests = async () => {
    try {
      const res = await fetch('/api/admin/kyc');
      const data = await res.json();
      if (data.success) {
        setKycRequests(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'kyc') {
      fetchKycRequests();
    }
  }, [activeTab]);

  // Загрузка обменов
  const fetchExchanges = async () => {
    const res = await fetch('/api/admin/exchange');
    const data = await res.json();
    setExchanges(data || []);
  };

  useEffect(() => {
    if (activeTab === 'exchanges') fetchExchanges();
  }, [activeTab]);

  // Загрузка крипто-транзакций
  const fetchCryptoTxs = async () => {
    const res = await fetch('/api/admin/transactions');
    const data = await res.json();
    setCryptoTxs(data || []);
  };

  useEffect(() => {
    if (activeTab === 'crypto') fetchCryptoTxs();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats); // Partial stats for dashboard
        setSysSettings(prev => ({
          ...prev,
          EXCHANGE_RATE: data.rate?.rate || prev.EXCHANGE_RATE,
          RATE_FROZEN: data.rate?.isFrozen ? 'true' : 'false'
        }));
      }
    } catch (e) {
      console.error('Failed to fetch dashboard:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
  }, [activeTab]);

  const fetchAuditLogs = async (page = 1) => {
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/admin/audit?page=${page}`);
      const data = await res.json();
      setAuditLogs(data.logs || []);
      setAuditTotal(data.total || 0);
    } catch (e) { console.error(e); }
    setAuditLoading(false);
  };

  const fetchLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?page=${page}`);
      const data = await res.json();
      setSystemLogs(data.logs || []);
      setLogsTotal(data.total || 0);
    } catch (e) { console.error(e); }
    setLogsLoading(false);
  };

  const runReconciliation = async () => {
    setReconLoading(true);
    try {
      const res = await fetch('/api/admin/reconcile', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setReconLogs(prev => [data.log, ...prev]);
        alert('Сверка завершена: ' + (data.log.isMatch ? 'Успешно' : 'Найдено расхождение'));
      }
    } catch (e) { console.error(e); }
    setReconLoading(false);
  };

  const fetchBlacklist = async () => {
    setIsBlacklistLoading(true);
    try {
      const res = await fetch('/api/admin/blacklist');
      const data = await res.json();
      if (data.success) setBlacklist(data.entries || []);
    } catch (e) { console.error(e); }
    setIsBlacklistLoading(false);
  };

  const fetchCashBalances = async () => {
    setIsCashLoading(true);
    try {
      const res = await fetch('/api/admin/cash');
      const data = await res.json();
      if (data.success) setCashBalances(data.balances || []);
    } catch (e) { console.error(e); }
    setIsCashLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs(auditPage);
    if (activeTab === 'logs') fetchLogs(logsPage);
    if (activeTab === 'stability') {
      fetch('/api/admin/reconcile').then(r => r.json()).then(d => setReconLogs(d.logs || []));
    }
    if (activeTab === 'blacklist') fetchBlacklist();
    if (activeTab === 'cash') fetchCashBalances();
    if (activeTab === 'levels') fetchLevelApps();
  }, [activeTab, auditPage, logsPage]);

  const fetchLevelApps = async () => {
    setIsLevelsLoading(true);
    try {
      const res = await fetch('/api/admin/levels');
      const data = await res.json();
      if (data.success) setLevelApps(data.applications || []);
    } catch (e) { console.error(e); }
    setIsLevelsLoading(false);
  };

  const processLevelApp = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setLoading({ ...loading, [id]: true });
    try {
      const res = await fetch('/api/admin/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        setLevelApps(levelApps.filter(a => a.id !== id));
        fetchDashboard();
      }
    } catch (e) { console.error(e); }
    setLoading({ ...loading, [id]: false });
  };

  // Загрузка пользователей
  const fetchUsers = async (page = 1, search = '') => {
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20&search=${search}`);
      const data = await res.json();
      setUsers(data.users || []);
      setUsersTotal(data.pagination?.total || 0);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers(usersPage, searchQuery);
  }, [activeTab, usersPage]);

  // Загрузка настроек
  const fetchSysSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok) setSysSettings(prev => ({ ...prev, ...data }));
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') fetchSysSettings();
  }, [activeTab]);

  const saveSetting = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        alert(`Настройка ${key} успешно обновлена!`);
        fetchSysSettings();
      } else {
        throw new Error('Server error');
      }
    } catch (e) {
      alert(`Ошибка при сохранении ${key}`);
    } finally {
      setSavingKey(null);
    }
  };

  // Загрузка операций пользователя
  const fetchUserOperations = async (userId: string, type = 'all') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/operations?type=${type}`);
      const data = await res.json();
      setUserOperations(data.operations);
    } catch (e) {
      console.error('Failed to fetch operations:', e);
    }
  };

  const loadMessages = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const handleSelectDispute = (dispute: any) => {
    setSelectedDispute(dispute);
    loadMessages(dispute.id);
  };

  const handleBackToList = () => {
    setSelectedDispute(null);
    setMessages([]);
  };

  // Обработка KYC заявки
  const processKyc = async (userId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Вы уверены, что хотите ${action === 'approve' ? 'одобрить' : 'отклонить'} заявку?`)) return;

    setKycLoading(prev => ({ ...prev, [userId]: true }));

    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      const data = await res.json();

      if (data.success) {
        // Обновляем список заявок
        setKycRequests(kycRequests.filter(k => k.id !== userId));

        // Если это текущая выбранная заявка, возвращаемся к списку
        if (selectedKyc?.id === userId) {
          setSelectedKyc(null);
        }

        alert(`KYC заявка ${action === 'approve' ? 'одобрена' : 'отклонена'}!`);
      } else {
        alert(data.error || 'Ошибка при обработке KYC');
      }
    } catch (error) {
      console.error('KYC process error:', error);
      alert('Ошибка при обработке KYC');
    } finally {
      setKycLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleBackToKycList = () => {
    setSelectedKyc(null);
  };

  // Обработка обмена
  const processExchange = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(action === 'approve' ? 'Подтвердить заявку?' : 'Отклонить заявку?')) return;

    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch('/api/admin/exchange', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        setExchanges(exchanges.filter(e => e.id !== id));
        alert('Заявка обработана');
      }
    } catch (e) {
      alert('Ошибка');
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Обработка крипто-транзакции
  const processCrypto = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm('Продолжить?')) return;
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        setCryptoTxs(cryptoTxs.filter(t => t.id !== id));
      }
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const resolveDispute = async (orderId: string, resolution: 'COMPLETED' | 'CANCELLED') => {
    if (!confirm(`Вы уверены, что хотите установить статус ${resolution}?`)) return;

    // Устанавливаем состояние загрузки для конкретного ордера
    setLoading(prev => ({ ...prev, [orderId]: true }));

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: resolution, isDisputed: false }) // снимаем флаг спора
      });

      const data = await res.json();

      if (data.success && data.order) {
        // Обновляем список споров
        setDisputes(disputes.filter(d => d.id !== orderId));

        // Если это текущий выбранный спор, возвращаемся к списку
        if (selectedDispute?.id === orderId) {
          handleBackToList();
        }

        // Уведомляем обоих участников о решении спора
        alert(`Спор разрешен! Статус сделки изменен на ${resolution === 'COMPLETED' ? 'Завершен' : 'Отменен'}.`);

        // Немедленное обновление данных для всех участников
        setTimeout(async () => {
          try {
            // Пытаемся обновить данные для обоих участников
            const orderDetails = data.order;
            const buyerId = orderDetails.buyerId;
            const sellerId = orderDetails.sellerId;

            console.log(`Спор ${orderId} разрешен. Уведомляем участников: ${buyerId}, ${sellerId}`);
          } catch (e) {
            console.error('Failed to notify participants:', e);
          }
        }, 1000);
      } else {
        alert("Ошибка: Сервер не вернул данные ордера");
      }
    } catch (e) {
      alert("Ошибка при разрешении спора");
    } finally {
      // Снимаем состояние загрузки
      setLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Просмотр KYC заявки */}
      {selectedKyc ? (
        <>
          <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
            <button onClick={handleBackToKycList} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-emerald-600 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> {t(language, 'adminKYCRequest').replace('{id}', selectedKyc.id.slice(0, 8))}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'adminKYCCheck')}</p>
            </div>
          </div>

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
                <ShieldCheck className="w-4 h-4 text-blue-500" /> {t(language, 'adminDocPhoto')}
              </h3>
              {selectedKyc.kycPhotoUrl ? (
                <div className="rounded-2xl overflow-hidden border-2 border-emerald-200">
                  <img
                    src={selectedKyc.kycPhotoUrl}
                    alt="KYC Document"
                    className="w-full h-auto"
                  />
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
                className={`flex flex-col items-center gap-2 p-4 rounded-xl font-bold text-sm transition-all ${kycLoading[selectedKyc.id]
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
                className={`flex flex-col items-center gap-2 p-4 rounded-xl font-bold text-sm transition-all ${kycLoading[selectedKyc.id]
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
        </>
      ) : !selectedDispute ? (
        <>
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

          {/* Табы */}
          <div className="bg-white px-4 py-3 sticky top-[60px] z-20 border-b border-slate-100">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveTab('disputes')}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'disputes' ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-slate-50 text-slate-500'}`}
              >
                <AlertTriangle className="w-4 h-4 inline mr-1" /> {t(language, 'adminDisputes')}
                {disputes.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {disputes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('kyc')}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'kyc' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-slate-50 text-slate-500'}`}
              >
                <ShieldCheck className="w-4 h-4 inline mr-1" /> {t(language, 'adminKYC')}
                {kycRequests.length > 0 && (
                  <span className="ml-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {kycRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('exchanges')}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'exchanges' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'bg-slate-50 text-slate-500'}`}
              >
                {t(language, 'adminExchanges')}
                {exchanges.length > 0 && <span className="ml-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">{exchanges.length}</span>}
              </button>
              <button
                onClick={() => setActiveTab('crypto')}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'crypto' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' : 'bg-slate-50 text-slate-500'}`}
              >
                {t(language, 'adminCrypto')}
                {cryptoTxs.length > 0 && <span className="ml-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">{cryptoTxs.length}</span>}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-purple-50 text-purple-600 ring-1 ring-purple-200' : 'bg-slate-50 text-slate-500'}`}
              >
                {t(language, 'adminUsers')}
              </button>
              <button
                onClick={() => setActiveTab('partners')}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'partners' ? 'bg-purple-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}
              >
                <Users className="w-4 h-4 inline mr-1" /> {t(language, 'adminPartners')}
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-slate-50 text-slate-500'}`}
              >
                {t(language, 'adminStats')}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200' : 'bg-slate-50 text-slate-500'}`}
              >
                <RefreshCw className="w-4 h-4 inline mr-1" /> {t(language, 'exSettings')}
              </button>
              <button
                onClick={() => setActiveTab('blacklist')}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'blacklist' ? 'bg-red-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}
              >
                <UserX className="w-4 h-4 inline mr-1" /> ЧС
              </button>
              <button
                onClick={() => setActiveTab('cash')}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'cash' ? 'bg-amber-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}
              >
                <RefreshCw className="w-4 h-4 inline mr-1" /> Кассы
              </button>
              <button
                onClick={() => setActiveTab('levels')}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'levels' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' : 'bg-slate-50 text-slate-500'}`}
              >
                <TrendingUp className="w-4 h-4 inline mr-1" /> Уровни
                {levelApps?.length > 0 && <span className="ml-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">{levelApps.length}</span>}
              </button>
            </div>
          </div>

          {/* Контент табов */}
          <div className="p-4 space-y-4 pb-32">
            {activeTab === 'dashboard' ? (
              <div className="space-y-4 animate-in fade-in duration-500">
                {/* Real-time Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Объем 24ч</div>
                    <div className="text-3xl font-black text-slate-900 tracking-tighter">{Number(stats?.volume24h || 0).toFixed(2)} <span className="text-xs font-bold text-slate-400">USDT</span></div>
                  </div>
                  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Объем 7д</div>
                    <div className="text-3xl font-black text-slate-900 tracking-tighter">{Number(stats?.volume7d || 0).toFixed(2)} <span className="text-xs font-bold text-slate-400">USDT</span></div>
                  </div>
                  <div className="bg-emerald-50/50 p-6 rounded-[2.5rem] shadow-sm ring-1 ring-emerald-100 relative overflow-hidden group hover:shadow-xl hover:shadow-emerald-100/50 transition-all duration-500">
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-100/30 rounded-full"></div>
                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Комиссии сегодня</div>
                    <div className="text-3xl font-black text-emerald-600 tracking-tighter">{Number(stats?.todayFees || 0).toFixed(2)} <span className="text-xs font-bold text-emerald-400">USDT</span></div>
                  </div>
                  <div className="bg-blue-50/50 p-6 rounded-[2.5rem] shadow-sm ring-1 ring-blue-100 relative overflow-hidden group hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-500">
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-100/30 rounded-full"></div>
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Активные сделки</div>
                    <div className="text-3xl font-black text-blue-600 tracking-tighter">{stats?.activeOrders || '0'}</div>
                  </div>
                </div>

                {/* Queues - Enhanced Visualization */}
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('kyc')} className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 flex flex-col items-center gap-3 group active:scale-95 transition-all relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Верификация</div>
                      <div className="text-xl font-black text-slate-900">{stats?.verificationQueueCount || 0} <span className="text-[10px] text-slate-400">В ОЧЕРЕДИ</span></div>
                    </div>
                  </button>
                  <button onClick={() => setActiveTab('crypto')} className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 flex flex-col items-center gap-3 group active:scale-95 transition-all relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Выводы</div>
                      <div className="text-xl font-black text-slate-900">{stats?.withdrawalQueueCount || 0} <span className="text-[10px] text-slate-400">В ОЧЕРЕДИ</span></div>
                    </div>
                  </button>
                </div>

                {/* Exchange Rate Control */}
                <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <RefreshCw className="w-32 h-32 text-white animate-spin-slow" />
                  </div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <h3 className="text-white text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> Глобальный курс
                    </h3>

                    <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Заморозить</span>
                      <button
                        onClick={() => {
                          const newValue = sysSettings.RATE_FROZEN === 'true' ? 'false' : 'true';
                          saveSetting('RATE_FROZEN', newValue);
                        }}
                        className={`w-10 h-5 rounded-full transition-all relative ${sysSettings.RATE_FROZEN === 'true' ? 'bg-red-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${sysSettings.RATE_FROZEN === 'true' ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 relative z-10">
                    <div className="flex-1 relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase tracking-widest">1 USDT =</div>
                      <input
                        type="number"
                        step="0.1"
                        disabled={sysSettings.RATE_FROZEN === 'true'}
                        value={sysSettings.EXCHANGE_RATE}
                        onChange={(e) => setSysSettings({ ...sysSettings, EXCHANGE_RATE: e.target.value })}
                        className={`w-full border rounded-2xl py-4 pl-20 pr-4 text-2xl font-black outline-none transition-all ${sysSettings.RATE_FROZEN === 'true'
                            ? 'bg-red-500/10 border-red-500/30 text-red-500/50 cursor-not-allowed'
                            : 'bg-white/10 border-white/20 text-white focus:bg-white/20'
                          }`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white font-bold text-lg opacity-50">TMT</div>
                    </div>
                    <button
                      disabled={sysSettings.RATE_FROZEN === 'true' || savingKey === 'EXCHANGE_RATE'}
                      onClick={() => saveSetting('EXCHANGE_RATE', sysSettings.EXCHANGE_RATE)}
                      className={`font-black px-6 rounded-2xl transition-all active:scale-95 shadow-lg ${sysSettings.RATE_FROZEN === 'true'
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
                        }`}
                    >
                      {savingKey === 'EXCHANGE_RATE' ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'OK'}
                    </button>
                  </div>

                  {sysSettings.RATE_FROZEN === 'true' && (
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-3 animate-pulse">
                      ⚠️ Курс заморожен. Изменения недоступны.
                    </p>
                  )}
                </div>

                {/* Recent Activity Mini-List */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" /> Последние действия
                    </h3>
                    <button onClick={() => setActiveTab('audit')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Все логи</button>
                  </div>
                  <div className="space-y-4">
                    {(auditLogs || []).slice(0, 3).map(log => (
                      <div key={log.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-800 line-clamp-1">{log.details}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{log.admin?.firstName || 'Система'} • {new Date(log.createdAt).toLocaleTimeString('ru-RU')}</div>
                        </div>
                      </div>
                    ))}
                    {(auditLogs || []).length === 0 && <div className="text-center py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Нет недавних логов</div>}
                  </div>
                </div>
              </div>
            ) : activeTab === 'levels' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2 px-1">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Заявки на повышение</h3>
                  <button onClick={fetchLevelApps} className={`p-2 ${isLevelsLoading ? 'animate-spin' : ''}`}><RefreshCw className="w-4 h-4 text-slate-400" /></button>
                </div>
                {levelApps.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100">
                    <UserCheck className="w-12 h-12 text-slate-100 mx-auto mb-2" />
                    <div className="text-slate-400 font-bold text-xs">Нет новых заявок</div>
                  </div>
                ) : (
                  (levelApps || []).map(app => (
                    <div key={app.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${app.requestedLevel === 'PARTNER' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                          {app.requestedLevel === 'PARTNER' ? 'P' : 'PRO'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{app.user.firstName || app.user.username}</div>
                          <div className="text-[10px] text-slate-400">Запрос на {app.requestedLevel}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => processLevelApp(app.id, 'REJECTED')} disabled={loading[app.id]} className="p-3 bg-red-50 text-red-600 font-bold rounded-xl text-xs active:scale-95">ОТКЛОНИТЬ</button>
                        <button onClick={() => processLevelApp(app.id, 'APPROVED')} disabled={loading[app.id]} className="p-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs active:scale-95">ПОДТВЕРДИТЬ</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === 'disputes' ? (
              (disputes || []).length === 0 ? (
                <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoDisputes')}</div>
              ) : (
                (disputes || []).map(order => (
                  <div
                    key={order.id}
                    className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-red-100 border-t-4 border-red-500 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleSelectDispute(order)}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-400">ID: #{order.id.slice(0, 8)}</span>
                      <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-600 rounded-lg">{t(language, 'adminDisputeOpen')}</span>
                    </div>

                    <div className="space-y-2 mb-6 bg-slate-50 p-3 rounded-xl text-sm">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">{t(language, 'limit')}:</span>
                        <span className="font-bold text-slate-800">{order.amountAsset} {order.ad.asset}</span>
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
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl font-bold text-xs transition-all ${loading[order.id]
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 active:scale-95'
                            }`}
                        >
                          {loading[order.id] ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )} {t(language, 'adminReject')}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveDispute(order.id, 'COMPLETED');
                          }}
                          disabled={loading[order.id]}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl font-bold text-xs transition-all ${loading[order.id]
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95'
                            }`}
                        >
                          {loading[order.id] ? (
                            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )} {t(language, 'adminApprove')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : activeTab === 'kyc' ? (
              (kycRequests || []).length === 0 ? (
                <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoUsers')}</div>
              ) : (
                (kycRequests || []).map(user => (
                  <div
                    key={user.id}
                    className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-emerald-100 border-t-4 border-emerald-500 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setSelectedKyc(user)}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-400">ID: #{user.id.slice(0, 8)}</span>
                      <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg">{t(language, 'adminPending')}</span>
                    </div>

                    <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl text-sm">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">{t(language, 'adminUser')}:</span>
                        <span className="font-bold text-slate-800">{user.firstName || '—'}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">Username:</span>
                        <span className="font-bold text-slate-800">@{user.username || '—'}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">Telegram ID:</span>
                        <span className="font-bold text-slate-800 text-xs">{user.telegramId}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                      <button className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        {t(language, 'adminUserDetails')} <ShieldCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : activeTab === 'exchanges' ? (
              (exchanges || []).length === 0 ? (
                <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoExchanges')}</div>
              ) : (
                (exchanges || []).map(req => (
                  <div key={req.id} className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-blue-100 border-t-4 border-blue-500 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${req.direction === 'USDT_TO_TMT' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {req.direction === 'USDT_TO_TMT' ? t(language, 'adminSendToNumber') : t(language, 'adminPaymentReceived')}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl text-sm space-y-2 mb-4">
                      <div className="flex justify-between"><span className="text-slate-500">{t(language, 'adminUser')}:</span> <span className="font-bold">@{req.user.username}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">{t(language, 'adminSendAmount')}:</span> <span className="font-bold text-slate-800">{req.direction === 'USDT_TO_TMT' ? `${req.amountUsdt} USDT` : `${req.amountTmt} TMT`}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">{t(language, 'adminReceiveAmount')}:</span> <span className="font-bold text-slate-800">{req.direction === 'USDT_TO_TMT' ? `${req.amountTmt} TMT` : `${req.amountUsdt} USDT`}</span></div>
                      {req.direction === 'USDT_TO_TMT' && (
                        <div className="flex justify-between pt-2 border-t border-slate-200"><span className="text-red-500 font-bold">{t(language, 'adminSendToNumber')}:</span> <span className="font-bold text-red-600">{req.userPhone}</span></div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => processExchange(req.id, 'reject')} disabled={loading[req.id]} className="p-3 bg-red-50 text-red-600 font-bold rounded-xl text-xs active:scale-95">
                        {t(language, 'adminReject')} ({t(language, 'adminReturn')})
                      </button>
                      <button onClick={() => processExchange(req.id, 'approve')} disabled={loading[req.id]} className="p-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs active:scale-95">
                        {req.direction === 'USDT_TO_TMT' ? t(language, 'adminConfirm') : t(language, 'adminPaymentReceived')}
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : activeTab === 'crypto' ? (
              (cryptoTxs || []).length === 0 ? (
                <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoTransactions')}</div>
              ) : (
                (cryptoTxs || []).map(tx => (
                  <div key={tx.id} className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-amber-100 border-t-4 border-amber-500 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${tx.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'DEPOSIT' ? t(language, 'salmak') : t(language, 'cykarmak')} {tx.network}
                      </span>
                      <span className="font-black text-slate-800">{tx.amount} USDT</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-2 mb-4 font-medium break-all">
                      <div className="flex justify-between"><span className="text-slate-500">{t(language, 'adminUser')}:</span> <span className="font-bold text-blue-500">@{tx.user.username}</span></div>
                      {tx.type === 'DEPOSIT' ? (
                        <div><span className="text-slate-500 block mb-1">{t(language, 'adminTxId')}:</span> <span className="font-mono bg-white p-1 rounded border border-slate-200 block">{tx.txId}</span></div>
                      ) : (
                        <div><span className="text-red-500 font-bold block mb-1">{t(language, 'adminSendToAddress')}:</span> <span className="font-mono bg-white p-1 rounded border border-slate-200 block">{tx.address}</span></div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => processCrypto(tx.id, 'reject')} disabled={loading[tx.id]} className="p-3 bg-red-50 text-red-600 font-bold rounded-xl text-xs active:scale-95">
                        {t(language, 'adminReject')} {tx.type === 'WITHDRAWAL' ? `(${t(language, 'adminReturn')})` : ''}
                      </button>
                      <button onClick={() => processCrypto(tx.id, 'approve')} disabled={loading[tx.id]} className="p-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs active:scale-95">
                        {t(language, 'adminApprove')}
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : activeTab === 'users' ? (
              <div className="space-y-4">
                {/* Поиск */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t(language, 'adminSearchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-white ring-1 ring-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                  />
                  <button
                    onClick={() => { setUsersPage(1); fetchUsers(1, searchQuery); }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-xl font-bold text-sm active:scale-95"
                  >
                    {t(language, 'adminSearch')}
                  </button>
                </div>

                {/* Список пользователей */}
                {(users || []).length === 0 ? (
                  <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoUsers')}</div>
                ) : (
                  (users || []).map(u => (
                    <div
                      key={u.id}
                      className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => { setSelectedUser(u); fetchUserOperations(u.id); }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                            {(u.firstName || u.username || 'U').charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-bold text-slate-800">{u.firstName || u.username || t(language, 'userLabel')}</div>
                          <div className="text-[10px] text-slate-400">@{u.username || 'no_username'} • ID: {u.telegramId}</div>
                        </div>

                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-slate-400 block">{t(language, 'adminUSDTBalance')}</span>
                          <span className="font-bold text-slate-800">{Number(u.wallet?.usdtBalance || 0).toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-slate-400 block">{t(language, 'adminTMTBalance')}</span>
                          <span className="font-bold text-slate-800">{Number(u.wallet?.tmtBalance || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Пагинация */}
                {usersTotal > 20 && (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      {t(language, 'adminBack')}
                    </button>
                    <span className="px-4 py-2 text-slate-400 text-sm font-bold">
                      {t(language, 'adminPage')} {usersPage} {t(language, 'adminOf')} {Math.ceil(usersTotal / 20)}
                    </span>
                    <button
                      onClick={() => setUsersPage(p => p + 1)}
                      disabled={usersPage >= Math.ceil(usersTotal / 20)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      {t(language, 'adminForward')}
                    </button>
                  </div>
                )}
              </div>
            ) : activeTab === 'partners' ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 text-center space-y-6">
                  <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <Users className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t(language, 'adminInvitePartner')}</h3>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                      {t(language, 'adminPartnerDesc')}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                      {t(language, 'adminPartnerLink')}
                    </label>

                    <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <div className="flex-1 px-4 py-3 text-xs font-bold text-slate-600 truncate flex items-center bg-white rounded-2xl shadow-sm">
                        {`https://t.me/rapira_tm_bot/app?startapp=partner_${user?.id}`}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://t.me/rapira_tm_bot/app?startapp=partner_${user?.id}`);
                          alert(t(language, 'success'));
                        }}
                        className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 flex gap-4">
                  <div className="p-3 bg-blue-100 text-blue-500 h-fit rounded-2xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest">Безопасность и уровни</h4>
                    <p className="text-[11px] font-bold text-blue-600/70 leading-relaxed">
                      Приглашенные партнеры автоматически получают статус Partner.
                      Это позволяет им торговать с повышенными лимитами сразу после регистрации.
                    </p>
                  </div>
                </div>
              </div>
            ) : activeTab === 'stats' ? (
              <div className="space-y-4">
                {!stats || !stats.users ? (
                  <div className="text-center text-slate-400 py-10">{t(language, 'adminLoading')}</div>
                ) : (
                  <>
                    {/* Общая статистика */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminTotalUsers')}</div>
                        <div className="text-2xl font-black text-slate-800">{stats.users?.total || 0}</div>
                        <div className="text-[10px] text-emerald-500 font-bold mt-1">+{stats.users?.active24h || 0} за 24ч</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminKYCVerified')}</div>
                        <div className="text-2xl font-black text-emerald-600">{stats.kyc?.verified || 0}</div>
                        <div className="text-[10px] text-amber-500 font-bold mt-1">{stats.kyc?.pending || 0} в очереди</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Активные споры</div>
                        <div className="text-2xl font-black text-red-600">{stats.disputes?.active || 0}</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Активные сделки</div>
                        <div className="text-2xl font-black text-amber-600">{stats.trades?.active || 0}</div>
                      </div>
                    </div>

                    {/* Объемы торгов */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-slate-100">
                      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" /> Объемы торгов (24ч)
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                          <span className="text-xs font-bold text-slate-600">P2P Платформа</span>
                          <span className="font-black text-slate-800">{stats.volume?.p2p24h?.toFixed(2) || '0.00'} USDT</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                          <span className="text-xs font-bold text-slate-600">Быстрый обмен</span>
                          <span className="font-black text-slate-800">{stats.volume?.swap24h?.toFixed(2) || '0.00'} USDT</span>
                        </div>
                        <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                          <span className="text-xs font-black text-indigo-700">ОБЩИЙ ОБЪЕМ</span>
                          <span className="font-black text-indigo-800">{(Number(stats.volume?.p2p24h || 0) + Number(stats.volume?.swap24h || 0)).toFixed(2)} USDT</span>
                        </div>
                      </div>
                    </div>

                    {/* Финансы */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-slate-100">
                      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" /> Финансовые показатели
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Комиссии с обменов:</span> <span className="font-bold text-emerald-600">+{stats.finance?.swapFees?.toFixed(2) || '0.00'} USDT</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Комиссии P2P (прибл.):</span> <span className="font-bold text-emerald-600">+{stats.finance?.p2pFeesEstimated?.toFixed(2) || '0.00'} USDT</span></div>
                        <div className="flex justify-between border-t border-slate-100 pt-2"><span className="text-slate-500">Очередь на вывод:</span> <span className="font-bold text-red-600">{stats.finance?.pendingWithdrawals || 0} заявок</span></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : activeTab === 'settings' ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <DollarSign className="w-24 h-24 text-indigo-500" />
                  </div>
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">Глобальный курс USDT/TMT</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Для автоматических обменов</p>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">1 USDT =</span>
                        <input
                          type="number"
                          step="0.1"
                          value={sysSettings.EXCHANGE_RATE || ''}
                          onChange={(e) => setSysSettings({ ...sysSettings, EXCHANGE_RATE: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-400 focus:bg-white rounded-2xl py-4 pl-24 pr-4 text-slate-900 text-xl font-black outline-none transition-all"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">TMT</span>
                      </div>
                      <button
                        onClick={() => saveSetting('EXCHANGE_RATE', sysSettings.EXCHANGE_RATE)}
                        disabled={savingKey === 'EXCHANGE_RATE'}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white w-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                      >
                        {savingKey === 'EXCHANGE_RATE' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        {sysSettings.RATE_FROZEN === 'true' ? <Lock className="w-5 h-5 text-red-500" /> : <Unlock className="w-5 h-5 text-emerald-500" />}
                        <div>
                          <div className="text-sm font-bold text-slate-800">Заморозка курса</div>
                          <div className="text-[10px] text-slate-500">Запретить боту авто-обновление</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newVal = sysSettings.RATE_FROZEN === 'true' ? 'false' : 'true';
                          setSysSettings({ ...sysSettings, RATE_FROZEN: newVal });
                          saveSetting('RATE_FROZEN', newVal);
                        }}
                        disabled={savingKey === 'RATE_FROZEN'}
                        className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${sysSettings.RATE_FROZEN === 'true' ? 'bg-red-500' : 'bg-slate-200'}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full transition-transform transform shadow-sm ${sysSettings.RATE_FROZEN === 'true' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">Комиссия системы</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Взимается при обменах</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        step="0.1"
                        value={sysSettings.EXCHANGE_FEE || ''}
                        onChange={(e) => setSysSettings({ ...sysSettings, EXCHANGE_FEE: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-400 focus:bg-white rounded-2xl py-4 px-4 text-slate-900 text-xl font-black outline-none transition-all"
                        placeholder="1.0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">%</span>
                    </div>
                    <button
                      onClick={() => saveSetting('EXCHANGE_FEE', sysSettings.EXCHANGE_FEE)}
                      disabled={savingKey === 'EXCHANGE_FEE'}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white w-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                    >
                      {savingKey === 'EXCHANGE_FEE' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">Приветственный бонус</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">За регистрацию</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={sysSettings.WELCOME_BONUS || ''}
                        onChange={(e) => setSysSettings({ ...sysSettings, WELCOME_BONUS: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 focus:border-purple-400 focus:bg-white rounded-2xl py-4 px-4 text-slate-900 text-xl font-black outline-none transition-all"
                        placeholder="15"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">USDT</span>
                    </div>
                    <button
                      onClick={() => saveSetting('WELCOME_BONUS', sysSettings.WELCOME_BONUS)}
                      disabled={savingKey === 'WELCOME_BONUS'}
                      className="bg-purple-500 hover:bg-purple-600 text-white w-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                    >
                      {savingKey === 'WELCOME_BONUS' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200/50 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-xs font-bold text-amber-800 leading-relaxed">
                    Изменения настроек применяются мгновенно и влияют на все новые операции в системе. Будьте внимательны при изменении глобального курса.
                  </p>
                </div>
              </div>
            ) : activeTab === 'blacklist' ? (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <UserX className="w-5 h-5 text-red-500" /> Добавить в ЧС
                  </h3>
                  <div className="space-y-3">
                    <select id="bl-type" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-slate-200">
                      <option value="ID">По Telegram ID</option>
                      <option value="CRYPTO_ADDRESS">По Крипто-адресу</option>
                      <option value="BANK_CARD">По Банковской карте</option>
                      <option value="DEVICE_ID">По Device ID</option>
                    </select>
                    <input id="bl-value" type="text" placeholder="Значение (ID, Адрес, Карта)" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-slate-200" />
                    <input id="bl-reason" type="text" placeholder="Причина блокировки" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-slate-200" />
                    <button
                      onClick={async () => {
                        const type = (document.getElementById('bl-type') as HTMLSelectElement).value;
                        const value = (document.getElementById('bl-value') as HTMLInputElement).value;
                        const reason = (document.getElementById('bl-reason') as HTMLInputElement).value;
                        if (!value) return alert('Введите значение');
                        const res = await fetch('/api/admin/blacklist', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type, value, reason })
                        });
                        if (res.ok) {
                          alert('Добавлено в черный список');
                          fetchBlacklist();
                          (document.getElementById('bl-value') as HTMLInputElement).value = '';
                          (document.getElementById('bl-reason') as HTMLInputElement).value = '';
                        }
                      }}
                      className="w-full py-4 bg-red-600 text-white font-black rounded-xl active:scale-95 transition-all shadow-lg shadow-red-600/20"
                    >
                      ЗАБЛОКИРОВАТЬ ГЛОБАЛЬНО
                    </button>
                  </div>
                </div>

                {/* Список ЧС */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center justify-between">
                    <span>Текущий ЧС</span>
                    <button onClick={fetchBlacklist} className="p-2"><RefreshCw className={`w-4 h-4 text-slate-400 ${isBlacklistLoading ? 'animate-spin' : ''}`} /></button>
                  </h3>
                  <div className="space-y-2">
                    {(blacklist || []).length > 0 ? (blacklist || []).map(entry => (
                      <div key={entry.id} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-red-500 uppercase px-2 py-0.5 bg-red-50 rounded-md">{entry.type}</span>
                            <span className="text-sm font-black text-slate-800">{entry.value}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.reason || 'Без причины'}</div>
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm('Удалить из черного списка?')) return;
                            await fetch('/api/admin/blacklist', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ value: entry.value })
                            });
                            fetchBlacklist();
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )) : (
                      <div className="text-center py-10">
                        <UserX className="w-12 h-12 text-slate-100 mx-auto mb-2" />
                        <div className="text-slate-400 font-bold text-xs">Черный список пуст</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'cash' ? (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-amber-500" /> Мониторинг Касс
                    </h3>
                    <button onClick={fetchCashBalances} className={`p-2 ${isCashLoading ? 'animate-spin' : ''}`}>
                      <RefreshCw className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(cashBalances || []).length > 0 ? (cashBalances || []).map((item: any) => (
                      <div key={item.city} className="bg-slate-50 p-5 rounded-2xl flex justify-between items-center border border-slate-100 hover:border-amber-200 transition-colors">
                        <div>
                          <div className="text-lg font-black text-slate-800">{item.city}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Региональный пункт</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-900">{item._sum.amount?.toFixed(2) || '0.00'}</div>
                          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">USDT (Доступно)</div>
                        </div>
                      </div>
                    )) : (
                      ['Ашхабад', 'Туркменабад', 'Мары', 'Дашогуз', 'Балканабад'].map(city => (
                        <div key={city} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center opacity-50">
                          <div className="font-bold text-slate-700">{city}</div>
                          <div className="text-lg font-black text-slate-900">0.00 <span className="text-[10px] text-slate-400">USDT</span></div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'audit' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Действия Администраторов</h3>
                  <button onClick={() => fetchAuditLogs(auditPage)} className="p-2 bg-white rounded-xl shadow-sm"><RefreshCw className={`w-4 h-4 text-slate-400 ${auditLoading ? 'animate-spin' : ''}`} /></button>
                </div>
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Дата</th>
                          <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Админ</th>
                          <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Действие</th>
                          <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Детали</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-bold">
                        {(auditLogs || []).map(log => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('ru-RU')}</td>
                            <td className="px-5 py-4 text-slate-800">{log.admin?.firstName || 'System'}</td>
                            <td className="px-5 py-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase">{log.action}</span></td>
                            <td className="px-5 py-4 text-slate-600">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'logs' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Журнал Системы</h3>
                  <button onClick={() => fetchLogs(logsPage)} className="p-2 bg-white rounded-xl shadow-sm"><RefreshCw className={`w-4 h-4 text-slate-400 ${logsLoading ? 'animate-spin' : ''}`} /></button>
                </div>
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Дата</th>
                          <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Тип</th>
                          <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Сообщение</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-bold">
                        {(systemLogs || []).map(log => (
                          <tr key={log.id} className={`hover:bg-slate-50/50 transition-colors ${log.severity === 'CRITICAL' ? 'bg-rose-50/30' : ''}`}>
                            <td className="px-5 py-4 text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('ru-RU')}</td>
                            <td className="px-5 py-4"><span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[9px] font-black uppercase">{log.type}</span></td>
                            <td className="px-5 py-4 text-slate-800">{log.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'stability' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Сверка Балансов</h3>
                  <button onClick={runReconciliation} disabled={reconLoading} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold active:scale-95 disabled:opacity-50">
                    <RefreshCw className={`w-3 h-3 ${reconLoading ? 'animate-spin' : ''}`} /> Сверить
                  </button>
                </div>
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Дата</th>
                        <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Статус</th>
                        <th className="px-5 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Разница</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-bold">
                      {(reconLogs || []).map(log => (
                        <tr key={log.id}>
                          <td className="px-5 py-4 text-slate-400">{new Date(log.createdAt).toLocaleString('ru-RU')}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${log.isMatch ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                              {log.isMatch ? 'OK' : 'DIFF'}
                            </span>
                          </td>
                          <td className="px-5 py-4">{log.totalBalance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
            <button onClick={handleBackToList} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-red-600 tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> {t(language, 'adminDisputeArbitration').replace('{id}', selectedDispute.id.slice(0, 8))}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'adminDisputeView')}</p>
            </div>
          </div>

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
                  <span className="font-bold text-slate-800 ml-2">{selectedDispute.amountAsset} {selectedDispute.ad.asset}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">{t(language, 'adminFiat')}:</span>
                  <span className="font-bold text-slate-800 ml-2">{selectedDispute.amountFiat} {selectedDispute.ad.fiat}</span>
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
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8 text-sm">{t(language, 'chatNoMessages')}</div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === selectedDispute.buyerId ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${message.senderId === selectedDispute.buyerId
                          ? 'bg-blue-50 text-slate-800 rounded-tl-none'
                          : 'bg-emerald-50 text-slate-800 rounded-tr-none'
                          }`}
                      >
                        <div className="font-bold text-xs mb-1">
                          {message.senderId === selectedDispute.buyerId ? t(language, 'adminBuyer') : t(language, 'adminSeller')}
                        </div>
                        <div>{message.text}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Кнопки решения */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => resolveDispute(selectedDispute.id, 'CANCELLED')}
                disabled={loading[selectedDispute.id]}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl font-bold text-sm transition-all ${loading[selectedDispute.id]
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-50 text-red-600 hover:bg-red-100 active:scale-95'
                  }`}
              >
                {loading[selectedDispute.id] ? (
                  <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
                <span>{t(language, 'adminCancelDeal')}</span>
                <span className="text-xs text-red-400 font-normal">{t(language, 'adminReturnCryptoToSeller')}</span>
              </button>
              <button
                onClick={() => resolveDispute(selectedDispute.id, 'COMPLETED')}
                disabled={loading[selectedDispute.id]}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl font-bold text-sm transition-all ${loading[selectedDispute.id]
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95'
                  }`}
              >
                {loading[selectedDispute.id] ? (
                  <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
                <span>{t(language, 'adminCompleteDeal')}</span>
                <span className="text-xs text-emerald-400 font-normal">{t(language, 'adminTransferCryptoToBuyer')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Экран просмотра пользователя */}
      {selectedUser && (
        <div className="fixed inset-0 z-[200] bg-slate-50 overflow-y-auto animate-in slide-in-from-right">
          <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
            <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{t(language, 'adminUserDetails')}</h2>
              <p className="text-[10px] text-slate-400">@{selectedUser.username || 'no_username'}</p>
            </div>
          </div>

          <div className="p-4 space-y-4 pb-32">
            {/* Основная информация */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center gap-4 mb-4">
                {selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {(selectedUser.firstName || 'U').charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedUser.firstName || selectedUser.nickname || t(language, 'userLabel')}</h3>
                  <p className="text-sm text-slate-500">ID: {selectedUser.telegramId}</p>

                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">{t(language, 'adminUSDTBalance')}</div>
                  <div className="text-2xl font-black text-emerald-700">{Number(selectedUser.wallet?.usdtBalance || 0).toFixed(2)}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-blue-600 uppercase">{t(language, 'adminTMTBalance')}</div>
                  <div className="text-2xl font-black text-blue-700">{Number(selectedUser.wallet?.tmtBalance || 0).toFixed(2)}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Статус KYC:</span>
                  <span className={`font-bold uppercase ${selectedUser.kycStatus === 'VERIFIED' ? 'text-emerald-600' : selectedUser.kycStatus === 'PENDING' ? 'text-amber-600' : selectedUser.kycStatus === 'REJECTED' ? 'text-red-600' : 'text-slate-400'}`}>
                    {selectedUser.kycStatus || 'NONE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t(language, 'email')}:</span>
                  <span className="font-bold text-slate-800">{selectedUser.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t(language, 'phone')}:</span>
                  <span className="font-bold text-slate-800">{selectedUser.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t(language, 'stats')}:</span>
                  <span className="font-bold text-slate-800">{new Date(selectedUser.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-50">
                  <span className="text-slate-500">Лимит (24ч):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      id="user-limit-override"
                      defaultValue={selectedUser.dailyLimitOverride || 5000}
                      className="w-20 bg-slate-100 rounded px-1 text-right font-bold text-xs outline-none"
                    />
                    <button
                      onClick={async () => {
                        const val = (document.getElementById('user-limit-override') as HTMLInputElement).value;
                        const res = await fetch(`/api/admin/users/${selectedUser.id}/limit`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ dailyLimit: parseFloat(val) })
                        });
                        if (res.ok) alert('Лимит обновлен');
                      }}
                      className="p-1 bg-slate-800 text-white rounded"
                    >
                      <UserCheck className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Управление Финансами */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-500" /> Финансовые операции
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    const amount = prompt('Сумма бонуса (USDT):');
                    if (!amount) return;
                    const res = await fetch(`/api/admin/users/${selectedUser.id}/bonus`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount: parseFloat(amount) })
                    });
                    if (res.ok) alert('Бонус начислен');
                  }}
                  className="p-4 bg-purple-50 text-purple-600 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-all"
                >
                  <Gift className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase">Бонус</span>
                </button>
                <button
                  onClick={async () => {
                    const amount = prompt('Сумма списания/начисления (USDT, можно минус):');
                    if (!amount) return;
                    const res = await fetch(`/api/admin/users/${selectedUser.id}/balance`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount: parseFloat(amount) })
                    });
                    if (res.ok) alert('Баланс изменен');
                  }}
                  className="p-4 bg-slate-50 text-slate-600 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase">Баланс</span>
                </button>
              </div>
              <button
                onClick={async () => {
                  const res = await fetch(`/api/admin/users/${selectedUser.id}/freeze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isFrozen: !selectedUser.isFrozen })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setSelectedUser(data.user);
                    alert(data.user.isFrozen ? 'Заморожен' : 'Разморожен');
                  }
                }}
                className={`w-full mt-4 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${selectedUser.isFrozen ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  }`}
              >
                {selectedUser.isFrozen ? 'РАЗМОРОЗИТЬ АККАУНТ' : 'ЗАМОРОЗИТЬ АККАУНТ'}
              </button>
            </div>

            {/* Операции */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-4">{t(language, 'adminOperations')}</h3>

              {/* Фильтр операций */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {['all', 'crypto', 'exchange', 'codes'].map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      fetchUserOperations(selectedUser.id, type);
                      setSelectedOpType(type);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${type === selectedOpType ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                  >
                    {type === 'all' ? t(language, 'adminAllOps') : type === 'crypto' ? t(language, 'adminCryptoOps') : type === 'exchange' ? t(language, 'adminExchangeOps') : t(language, 'adminCodesOps')}
                  </button>
                ))}
              </div>

              {userOperations.length === 0 ? (
                <div className="text-center text-slate-400 py-10 text-sm">{t(language, 'adminNoOps')}</div>
              ) : (
                <div className="space-y-2">
                  {userOperations.map((op: any) => (
                    <div key={op.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${op.type === 'CRYPTO' ? 'bg-amber-100 text-amber-600' :
                            op.type === 'EXCHANGE' ? 'bg-blue-100 text-blue-600' :
                              'bg-purple-100 text-purple-600'
                            }`}>
                            {op.type}
                          </span>
                          <span className="text-xs font-bold text-slate-600">{op.action}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(op.createdAt).toLocaleString('ru-RU')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-800">
                          {op.amount ? `${op.amount} ${op.currency || ''}` : op.amountUsdt ? `${op.amountUsdt} USDT` : `${op.amountTmt} TMT`}
                        </div>
                        <div className={`text-[10px] font-bold ${op.status === 'COMPLETED' ? 'text-emerald-600' :
                          op.status === 'PENDING' ? 'text-amber-600' :
                            op.status === 'CANCELLED' ? 'text-red-600' : 'text-slate-400'
                          }`}>
                          {op.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
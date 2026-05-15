'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { t, Language } from '../../../lib/dictionaries';
import { XCircle, CheckCircle2 } from 'lucide-react';

// Components
import AdminHeader from './components/AdminHeader';
import AdminTabs from './components/AdminTabs';
import DashboardTab from './tabs/DashboardTab';
import DisputesTab from './tabs/DisputesTab';
import KycTab from './tabs/KycTab';
import ExchangesTab from './tabs/ExchangesTab';
import CryptoTab from './tabs/CryptoTab';
import UsersTab from './tabs/UsersTab';
import PartnersTab from './tabs/PartnersTab';
import StatsTab from './tabs/StatsTab';
import SettingsTab from './tabs/SettingsTab';
import BlacklistTab from './tabs/BlacklistTab';
import CashTab from './tabs/CashTab';
import LevelsTab from './tabs/LevelsTab';
import LogsTab from './tabs/LogsTab';
import AuditTab from './tabs/AuditTab';
import StabilityTab from './tabs/StabilityTab';

// Details
import KycDetail from './details/KycDetail';
import DisputeDetail from './details/DisputeDetail';
import UserDetail from './details/UserDetail';

export default function AdminScreen({ onClose }: { onClose: () => void }) {
  const { language, user } = useAppStore() as { language: Language, user: any };
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
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [fullStats, setFullStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Настройки
  const [sysSettings, setSysSettings] = useState<Record<string, string>>({
    EXCHANGE_RATE: '19.5',
    EXCHANGE_FEE: '1',
    WELCOME_BONUS: '15',
    RATE_FROZEN: 'false',
    RECEIVE_PHONE: '+993 65 XX-XX-XX',
    WALLET_TRC20: '',
    WALLET_BEP20: '',
    WALLET_APTOS: ''
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
      .then(res => res.ok ? res.json() : [])
      .then(data => setDisputes(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to fetch disputes:', err);
        setDisputes([]);
      });
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'kyc') fetchKycRequests();
    if (activeTab === 'exchanges') fetchExchanges();
    if (activeTab === 'crypto') fetchCryptoTxs();
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'audit') fetchAuditLogs(auditPage);
    if (activeTab === 'logs') fetchLogs(logsPage);
    if (activeTab === 'stability') {
      fetch('/api/admin/reconciliation').then(r => r.json()).then(d => setReconLogs(d.logs || []));
    }
    if (activeTab === 'blacklist') fetchBlacklist();
    if (activeTab === 'cash') fetchCashBalances();
    if (activeTab === 'levels') fetchLevelApps();
    if (activeTab === 'users') fetchUsers(usersPage, searchQuery);
    if (activeTab === 'settings') fetchSysSettings();
  }, [activeTab, auditPage, logsPage, usersPage, searchQuery]);

  const fetchKycRequests = async () => {
    try {
      const res = await fetch('/api/admin/kyc');
      if (res.ok) {
        const data = await res.json();
        setKycRequests(Array.isArray(data.users) ? data.users : []);
      }
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error);
    }
  };

  const fetchExchanges = async () => {
    setLoading(prev => ({ ...prev, exchanges: true }));
    try {
      const res = await fetch('/api/admin/exchange');
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      setExchanges(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch exchanges');
    } finally {
      setLoading(prev => ({ ...prev, exchanges: false }));
    }
  };

  const fetchCryptoTxs = async () => {
    setLoading(prev => ({ ...prev, crypto: true }));
    try {
      const res = await fetch('/api/admin/transactions');
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      setCryptoTxs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch crypto transactions');
    } finally {
      setLoading(prev => ({ ...prev, crypto: false }));
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      setFullStats(data);
    } catch (e: any) {
      console.error('Failed to fetch stats:', e);
      setError(e.message || 'Failed to fetch stats');
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data.stats);
      }
    } catch (e: any) {
      console.error('Failed to fetch dashboard:', e);
      setError(e.message || 'Failed to fetch dashboard');
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/admin/audit?page=${page}`);
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      setAuditLogs(data.logs || []);
      setAuditTotal(data.total || 0);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to fetch audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?page=${page}`);
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      setSystemLogs(data.logs || []);
      setLogsTotal(data.total || 0);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to fetch system logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const runReconciliation = async () => {
    setReconLoading(true);
    try {
      const res = await fetch('/api/admin/reconciliation', { method: 'POST' });
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      if (data.success && data.log) {
        setReconLogs(prev => [data.log, ...prev]);
        setSuccess('Сверка завершена: ' + (data.log.isMatch ? 'Успешно' : 'Найдено расхождение'));
      } else if (data.success) {
        setSuccess('Сверка завершена');
        fetch('/api/admin/reconciliation').then(r => r.json()).then(d => setReconLogs(d.logs || []));
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to run reconciliation');
    } finally {
      setReconLoading(false);
    }
  };

  const fetchBlacklist = async () => {
    setIsBlacklistLoading(true);
    try {
      const res = await fetch('/api/admin/blacklist');
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      if (data.success) setBlacklist(Array.isArray(data.entries) ? data.entries : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to fetch blacklist');
    } finally {
      setIsBlacklistLoading(false);
    }
  };

  const fetchCashBalances = async () => {
    setIsCashLoading(true);
    try {
      const res = await fetch('/api/admin/cash');
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      if (data.success) setCashBalances(Array.isArray(data.balances) ? data.balances : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to fetch cash balances');
    } finally {
      setIsCashLoading(false);
    }
  };

  const fetchLevelApps = async () => {
    setIsLevelsLoading(true);
    try {
      const res = await fetch('/api/admin/levels');
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      if (data.success) setLevelApps(Array.isArray(data.applications) ? data.applications : []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to fetch level applications');
    } finally {
      setIsLevelsLoading(false);
    }
  };

  const processLevelApp = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch('/api/admin/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        setSuccess(`Заявка ${status === 'VERIFIED' ? 'одобрена' : 'отклонена'}!`);
        setLevelApps(prev => prev.filter(a => a.id !== id));
        fetchDashboard();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка при обработке');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Ошибка при обработке');
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const fetchUsers = async (page = 1, search = '') => {
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20&search=${search}`);
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
      setUsersTotal(data.pagination?.total || 0);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to fetch users');
    }
  };

  const fetchSysSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error(t(language, 'serverError'));
      const data = await res.json();
      setSysSettings(prev => ({ ...prev, ...data }));
    } catch (e: any) {
      console.error('Failed to fetch settings:', e);
      setError(e.message || 'Failed to fetch settings');
    }
  };

  const saveSetting = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        setSuccess(`Настройка ${key} успешно обновлена!`);
        fetchSysSettings();
      } else {
        throw new Error('Server error');
      }
    } catch (e: any) {
      setError(`Ошибка при сохранении ${key}`);
    } finally {
      setSavingKey(null);
    }
  };

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
    setSelectedKyc(null);
    setSelectedUser(null);
    setMessages([]);
  };

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
        setKycRequests(kycRequests.filter(k => k.id !== userId));
        if (selectedKyc?.id === userId) setSelectedKyc(null);
        setSuccess(`KYC заявка ${action === 'approve' ? 'одобрена' : 'отклонена'}!`);
        fetchDashboard();
      } else {
        setError(data.error || 'Ошибка при обработке KYC');
      }
    } catch (error: any) {
      setError('Ошибка при обработке KYC');
    } finally {
      setKycLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

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
        setSuccess('Заявка обработана');
        fetchDashboard();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка');
      }
    } catch (e: any) {
      setError(e.message || 'Ошибка');
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

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
        setSuccess('Транзакция обработана');
        fetchDashboard();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка');
      }
    } catch (e: any) {
      setError(e.message || 'Ошибка');
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const resolveDispute = async (orderId: string, resolution: 'COMPLETED' | 'CANCELLED') => {
    if (!confirm(`Вы уверены, что хотите установить статус ${resolution}?`)) return;
    setLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: resolution, isDisputed: false })
      });
      if (res.ok) {
        setSuccess('Спор разрешен');
        setDisputes(disputes.filter(d => d.id !== orderId));
        fetchDashboard();
        if (selectedDispute?.id === orderId) handleBackToList();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка');
      }
    } catch (e: any) {
      setError(e.message || 'Ошибка');
    } finally {
      setLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const counts = {
    disputes: disputes.length,
    kyc: kycRequests.length,
    exchanges: exchanges.length,
    crypto: cryptoTxs.length,
    levels: levelApps.length,
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto animate-in slide-in-from-right duration-300">
      <AdminHeader 
        onClose={onClose} 
        language={language} 
        selectedKyc={selectedKyc} 
        selectedDispute={selectedDispute}
        handleBackToList={handleBackToList}
      />

      {!selectedKyc && !selectedDispute && !selectedUser && (
        <AdminTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          language={language} 
          counts={counts}
        />
      )}

      <div className="p-4 space-y-4 pb-32">
        {selectedKyc ? (
          <KycDetail 
            selectedKyc={selectedKyc} 
            language={language} 
            kycLoading={kycLoading} 
            processKyc={processKyc} 
          />
        ) : selectedDispute ? (
          <DisputeDetail 
            selectedDispute={selectedDispute} 
            language={language} 
            messages={messages} 
            resolveDispute={resolveDispute} 
            loading={loading} 
          />
        ) : selectedUser ? (
          <UserDetail 
            selectedUser={selectedUser} 
            language={language} 
            setSelectedUser={setSelectedUser}
            setSuccess={setSuccess}
            setError={setError}
            fetchDashboard={fetchDashboard}
            userOperations={userOperations}
            selectedOpType={selectedOpType}
            setSelectedOpType={setSelectedOpType}
            fetchUserOperations={fetchUserOperations}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardTab 
                dashboardStats={dashboardStats} 
                setActiveTab={setActiveTab} 
                sysSettings={sysSettings} 
                setSysSettings={setSysSettings} 
                saveSetting={saveSetting} 
                savingKey={savingKey} 
                auditLogs={auditLogs} 
              />
            )}
            {activeTab === 'disputes' && (
              <DisputesTab 
                disputes={disputes} 
                language={language} 
                handleSelectDispute={handleSelectDispute} 
                resolveDispute={resolveDispute} 
                loading={loading} 
              />
            )}
            {activeTab === 'kyc' && (
              <KycTab 
                kycRequests={kycRequests} 
                language={language} 
                setSelectedKyc={setSelectedKyc} 
              />
            )}
            {activeTab === 'exchanges' && (
              <ExchangesTab 
                exchanges={exchanges} 
                language={language} 
                processExchange={processExchange} 
                loading={loading} 
              />
            )}
            {activeTab === 'crypto' && (
              <CryptoTab 
                cryptoTxs={cryptoTxs} 
                language={language} 
                processCrypto={processCrypto} 
                loading={loading} 
              />
            )}
            {activeTab === 'users' && (
              <UsersTab 
                users={users} 
                language={language} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                usersPage={usersPage} 
                setUsersPage={setUsersPage} 
                usersTotal={usersTotal} 
                setSelectedUser={(u: any) => { setSelectedUser(u); fetchUserOperations(u.id); }} 
                fetchUsers={fetchUsers} 
              />
            )}
            {activeTab === 'partners' && (
              <PartnersTab language={language} user={user} />
            )}
            {activeTab === 'stats' && (
              <StatsTab language={language} fullStats={fullStats} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab 
                sysSettings={sysSettings} 
                setSysSettings={setSysSettings} 
                saveSetting={saveSetting} 
                savingKey={savingKey} 
              />
            )}
            {activeTab === 'blacklist' && (
              <BlacklistTab 
                blacklist={blacklist} 
                isBlacklistLoading={isBlacklistLoading} 
                fetchBlacklist={fetchBlacklist} 
              />
            )}
            {activeTab === 'cash' && (
              <CashTab 
                cashBalances={cashBalances} 
                isCashLoading={isCashLoading} 
                fetchCashBalances={fetchCashBalances} 
              />
            )}
            {activeTab === 'levels' && (
              <LevelsTab 
                levelApps={levelApps} 
                isLevelsLoading={isLevelsLoading} 
                fetchLevelApps={fetchLevelApps} 
                processLevelApp={processLevelApp} 
                loading={loading} 
              />
            )}
            {activeTab === 'audit' && (
              <AuditTab 
                auditLogs={auditLogs} 
                auditLoading={auditLoading} 
                auditPage={auditPage} 
                setAuditPage={setAuditPage} 
                auditTotal={auditTotal} 
                fetchAuditLogs={fetchAuditLogs} 
              />
            )}
            {activeTab === 'logs' && (
              <LogsTab 
                systemLogs={systemLogs} 
                logsLoading={logsLoading} 
                logsPage={logsPage} 
                setLogsPage={setLogsPage} 
                logsTotal={logsTotal} 
                fetchLogs={fetchLogs} 
              />
            )}
            {activeTab === 'stability' && (
              <StabilityTab 
                reconLogs={reconLogs} 
                reconLoading={reconLoading} 
                runReconciliation={runReconciliation} 
              />
            )}
          </>
        )}
      </div>

      {/* Toast-like notifications */}
      {error && (
        <div className="fixed bottom-24 left-4 right-4 bg-red-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-bottom duration-300 z-50">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <span className="text-sm font-bold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1"><XCircle className="w-4 h-4 opacity-50" /></button>
        </div>
      )}
      {success && (
        <div className="fixed bottom-24 left-4 right-4 bg-emerald-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-bottom duration-300 z-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="p-1"><XCircle className="w-4 h-4 opacity-50" /></button>
        </div>
      )}
    </div>
  );
}

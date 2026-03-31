'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { ChevronLeft, AlertTriangle, CheckCircle2, XCircle, MessageCircle, Clock, ShieldCheck, UserCheck, UserX, Gift, RefreshCw, Users, TrendingUp, ArrowLeft } from 'lucide-react';

export default function AdminScreen({ onClose }: { onClose: () => void }) {
  const { language, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<'disputes' | 'kyc' | 'exchanges' | 'crypto' | 'users' | 'stats'>('disputes');
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});

  // KYC состояния
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [kycLoading, setKycLoading] = useState<{[key: string]: boolean}>({});

  // Обмены
  const [exchanges, setExchanges] = useState<any[]>([]);

  // Криптовалютные транзакции
  const [cryptoTxs, setCryptoTxs] = useState<any[]>([]);

  // Пользователи
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userOperations, setUserOperations] = useState<any[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Статистика
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/disputes')
      .then(res => res.json())
      .then(data => setDisputes(data));
  }, []);

  // Загрузка KYC заявок
  const fetchKycRequests = async () => {
    try {
      const res = await fetch('/api/admin/kyc');
      const data = await res.json();
      if (data.success) {
        setKycRequests(data.users);
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
    setExchanges(data);
  };

  useEffect(() => {
    if (activeTab === 'exchanges') fetchExchanges();
  }, [activeTab]);

  // Загрузка крипто-транзакций
  const fetchCryptoTxs = async () => {
    const res = await fetch('/api/admin/transactions');
    setCryptoTxs(await res.json());
  };

  useEffect(() => {
    if (activeTab === 'crypto') fetchCryptoTxs();
  }, [activeTab]);

  // Загрузка статистики
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  // Загрузка пользователей
  const fetchUsers = async (page = 1, search = '') => {
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20&search=${search}`);
      const data = await res.json();
      setUsers(data.users);
      setUsersTotal(data.pagination.total);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers(usersPage, searchQuery);
  }, [activeTab, usersPage]);

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
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('disputes')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'disputes'
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                    : 'bg-slate-50 text-slate-500'
                }`}
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
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'kyc'
                    ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                    : 'bg-slate-50 text-slate-500'
                }`}
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
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'exchanges' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'bg-slate-50 text-slate-500'
                }`}
              >
                {t(language, 'adminExchanges')}
                {exchanges.length > 0 && <span className="ml-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">{exchanges.length}</span>}
              </button>
              <button
                onClick={() => setActiveTab('crypto')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'crypto' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' : 'bg-slate-50 text-slate-500'
                }`}
              >
                {t(language, 'adminCrypto')}
                {cryptoTxs.length > 0 && <span className="ml-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">{cryptoTxs.length}</span>}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'users' ? 'bg-purple-50 text-purple-600 ring-1 ring-purple-200' : 'bg-slate-50 text-slate-500'
                }`}
              >
                {t(language, 'adminUsers')}
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'stats' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-slate-50 text-slate-500'
                }`}
              >
                {t(language, 'adminStats')}
              </button>
            </div>
          </div>

          {/* Контент табов */}
          <div className="p-4 space-y-4 pb-32">
            {activeTab === 'disputes' ? (
              disputes.length === 0 ? (
                <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoDisputes')}</div>
              ) : (
                disputes.map(order => (
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
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl font-bold text-xs transition-all ${
                            loading[order.id]
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
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl font-bold text-xs transition-all ${
                            loading[order.id]
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
              kycRequests.length === 0 ? (
                <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoUsers')}</div>
              ) : (
                kycRequests.map(user => (
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
              exchanges.length === 0 ? (
                <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoExchanges')}</div>
              ) : (
                exchanges.map(req => (
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
              cryptoTxs.length === 0 ? (
                <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoTransactions')}</div>
              ) : (
                cryptoTxs.map(tx => (
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
                    className="flex-1 bg-white ring-1 ring-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => { setUsersPage(1); fetchUsers(1, searchQuery); }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-xl font-bold text-sm active:scale-95"
                  >
                    {t(language, 'adminSearch')}
                  </button>
                </div>

                {/* Список пользователей */}
                {users.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 font-bold">{t(language, 'adminNoUsers')}</div>
                ) : (
                  users.map(u => (
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
                        {u.isAdmin && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-lg">ADMIN</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-slate-400 block">{t(language, 'adminUSDTBalance')}</span>
                          <span className="font-bold text-slate-800">{u.wallet?.usdtBalance?.toFixed(2) || 0}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-slate-400 block">{t(language, 'adminTMTBalance')}</span>
                          <span className="font-bold text-slate-800">{u.wallet?.tmtBalance?.toFixed(2) || 0}</span>
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
            ) : activeTab === 'stats' ? (
              <div className="space-y-4">
                {!stats ? (
                  <div className="text-center text-slate-400 py-10">{t(language, 'adminLoading')}</div>
                ) : (
                  <>
                    {/* Общая статистика */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminTotalUsers')}</div>
                        <div className="text-2xl font-black text-slate-800">{stats.users?.total || 0}</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminKYCVerified')}</div>
                        <div className="text-2xl font-black text-emerald-600">{stats.kyc?.verified || 0}</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminActiveDisputes')}</div>
                        <div className="text-2xl font-black text-red-600">{stats.disputes?.active || 0}</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminPending')}</div>
                        <div className="text-2xl font-black text-amber-600">{stats.cryptoTx?.pending || 0}</div>
                      </div>
                    </div>

                    {/* Статистика по кодам */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-slate-100">
                      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-purple-500" /> {t(language, 'codesTitle')}
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="text-lg font-black text-slate-800">{stats.codes?.total || 0}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminCodesTotal')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-black text-emerald-600">{stats.codes?.active || 0}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminCodesActive')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-black text-blue-600">{stats.codes?.used || 0}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminCodesUsed')}</div>
                        </div>
                      </div>
                      {stats.codes?.volume && Object.keys(stats.codes.volume).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t(language, 'adminCodesVolume')}</div>
                          {Object.entries(stats.codes.volume).map(([currency, amount]) => (
                            <div key={currency} className="flex justify-between text-sm">
                              <span className="font-bold text-slate-600">{currency}</span>
                              <span className="font-black text-slate-800">{Number(amount).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {stats.codes?.fees && Object.keys(stats.codes.fees).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t(language, 'adminCodesFees')}</div>
                          {Object.entries(stats.codes.fees).map(([currency, amount]) => (
                            <div key={currency} className="flex justify-between text-sm">
                              <span className="font-bold text-slate-600">{currency}</span>
                              <span className="font-black text-emerald-600">+{Number(amount).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Обмены и транзакции */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-slate-100">
                      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-500" /> {t(language, 'adminExchanges')}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminExchangesTotal')}</div>
                          <div className="text-lg font-black text-slate-800">{stats.exchanges?.total || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'adminExchangesPending')}</div>
                          <div className="text-lg font-black text-amber-600">{stats.exchanges?.pending || 0}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                          message.senderId === selectedDispute.buyerId
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
                className={`flex flex-col items-center gap-2 p-4 rounded-xl font-bold text-sm transition-all ${
                  loading[selectedDispute.id]
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
                className={`flex flex-col items-center gap-2 p-4 rounded-xl font-bold text-sm transition-all ${
                  loading[selectedDispute.id]
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
            {/* Информация о пользователе */}
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
                  {selectedUser.isAdmin && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-lg">ADMIN</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">{t(language, 'adminUSDTBalance')}</div>
                  <div className="text-2xl font-black text-emerald-700">{selectedUser.wallet?.usdtBalance?.toFixed(2) || 0}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-blue-600 uppercase">{t(language, 'adminTMTBalance')}</div>
                  <div className="text-2xl font-black text-blue-700">{selectedUser.wallet?.tmtBalance?.toFixed(2) || 0}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">KYC {t(language, 'kycLabel')}:</span>
                  <span className={`font-bold ${selectedUser.kycStatus === 'verified' ? 'text-emerald-600' : selectedUser.kycStatus === 'pending' ? 'text-amber-600' : selectedUser.kycStatus === 'rejected' ? 'text-red-600' : 'text-slate-400'}`}>
                    {selectedUser.kycStatus || 'none'}
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
              </div>
            </div>

            {/* Операции */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-4">{t(language, 'adminOperations')}</h3>

              {/* Фильтр операций */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {['all', 'crypto', 'exchange', 'codes'].map(type => (
                  <button
                    key={type}
                    onClick={() => fetchUserOperations(selectedUser.id, type)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${
                      type === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
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
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${
                            op.type === 'CRYPTO' ? 'bg-amber-100 text-amber-600' :
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
                        <div className={`text-[10px] font-bold ${
                          op.status === 'COMPLETED' ? 'text-emerald-600' :
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
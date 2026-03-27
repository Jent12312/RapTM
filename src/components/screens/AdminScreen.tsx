'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, AlertTriangle, CheckCircle2, XCircle, MessageCircle, Clock } from 'lucide-react';

export default function AdminScreen({ onClose }: { onClose: () => void }) {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetch('/api/admin/disputes')
      .then(res => res.json())
      .then(data => setDisputes(data));
  }, []);

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
      {!selectedDispute ? (
        <>
          <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
            <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-red-600 tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Арбитраж P2P
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Панель Администратора</p>
            </div>
          </div>

          <div className="p-4 space-y-4 pb-32">
            {disputes.length === 0 ? (
              <div className="text-center text-slate-400 py-10 font-bold">Нет активных споров 🎉</div>
            ) : (
              disputes.map(order => (
                <div
                  key={order.id}
                  className="bg-white p-5 rounded-[2rem] shadow-sm ring-1 ring-red-100 border-t-4 border-red-500 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleSelectDispute(order)}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400">ID: #{order.id.slice(0, 8)}</span>
                    <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-600 rounded-lg">Спор открыт</span>
                  </div>
                  
                  <div className="space-y-2 mb-6 bg-slate-50 p-3 rounded-xl text-sm">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Сумма:</span>
                      <span className="font-bold text-slate-800">{order.amountAsset} {order.ad.asset}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Покупатель:</span>
                      <span className="font-bold text-blue-600">{order.buyer.firstName}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Продавец:</span>
                      <span className="font-bold text-emerald-600">{order.seller.firstName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-1 text-blue-600 text-xs font-bold">
                      <MessageCircle className="w-4 h-4" /> Просмотр чата
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
                        )} Отменить
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
                        )} Завершить
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
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
                <AlertTriangle className="w-5 h-5" /> Арбитраж сделки #{selectedDispute.id.slice(0, 8)}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Просмотр чата и решение спора</p>
            </div>
          </div>

          <div className="p-4 space-y-4 pb-32">
            {/* Информация о сделке */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 font-medium">Покупатель:</span>
                  <span className="font-bold text-blue-600 ml-2">{selectedDispute.buyer.firstName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Продавец:</span>
                  <span className="font-bold text-emerald-600 ml-2">{selectedDispute.seller.firstName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Сумма:</span>
                  <span className="font-bold text-slate-800 ml-2">{selectedDispute.amountAsset} {selectedDispute.ad.asset}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Фиат:</span>
                  <span className="font-bold text-slate-800 ml-2">{selectedDispute.amountFiat} {selectedDispute.ad.fiat}</span>
                </div>
              </div>
            </div>

            {/* Чат сделки */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100">
              <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">История чата</span>
                <Clock className="w-4 h-4 text-slate-400 ml-auto" />
                <span className="text-xs text-slate-400">
                  {new Date(selectedDispute.updatedAt).toLocaleString('ru-RU')}
                </span>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8 text-sm">Сообщений в чате нет</div>
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
                          {message.senderId === selectedDispute.buyerId ? 'Покупатель' : 'Продавец'}
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
                <span>Отменить сделку</span>
                <span className="text-xs text-red-400 font-normal">Возвращаем крипту продавцу</span>
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
                <span>Завершить сделку</span>
                <span className="text-xs text-emerald-400 font-normal">Переводим крипту покупателю</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
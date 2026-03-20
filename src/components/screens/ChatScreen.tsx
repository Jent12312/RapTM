'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';

interface Props {
  orderId: string;
  partnerName: string;
  onClose: () => void;
}

export default function ChatScreen({ orderId, partnerName, onClose }: Props) {
  const { user, language } = useAppStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Реф для автоматического скролла вниз
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Функция загрузки истории чата
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Загружаем сообщения при открытии чата и ставим "таймер" для проверки новых
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Проверяем новые сообщения каждые 3 сек (long-polling)
    return () => clearInterval(interval);
  }, [orderId]);

  // Автоскролл вниз при новом сообщении
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Отправка сообщения
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const textToSend = newMessage;
    setNewMessage(''); // Сразу очищаем инпут для удобства

    // Оптимистичное обновление UI (чтобы сообщение появилось моментально)
    const tempMsg = {
      id: Date.now().toString(),
      senderId: user.id,
      text: textToSend,
      createdAt: new Date().toISOString(),
      sender: { firstName: user.firstName }
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, text: textToSend })
      });
      // После успешной отправки можно не перегружать весь список, т.к. таймер и так сработает
    } catch (error) {
      alert("Ошибка отправки");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Шапка Чата */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 border-b border-slate-100 shadow-sm shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-500">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{partnerName}</h2>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {t(language, 'online')}
          </p>
        </div>
      </div>

      {/* Предупреждение о безопасности (как на биржах) */}
      <div className="bg-amber-50 px-4 py-3 shrink-0 border-b border-amber-100 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider leading-relaxed">
          {t(language, 'securityWarning')}
        </p>
      </div>

      {/* Список сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-slate-400 font-medium text-sm mt-10">{t(language, 'loading')}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-400 font-medium text-sm mt-10">
            {t(language, 'noAds')}<br/>{t(language, 'step1')}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user.id;
            // Форматируем время (например: 14:30)
            const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                  isMe ? 'bg-emerald-500 text-white rounded-br-sm' : 'bg-white text-slate-800 ring-1 ring-slate-100 rounded-bl-sm'
                }`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  <div className={`text-[10px] font-bold mt-1 text-right ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {time}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} /> {/* Пустой див для автоскролла в самый низ */}
      </div>

      {/* Поле ввода */}
      <form onSubmit={handleSendMessage} className="bg-white p-4 shrink-0 border-t border-slate-100 flex gap-2 pb-8">
        <input
          type="text"
          placeholder={t(language, 'chatPlaceholder')}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-slate-50 ring-1 ring-slate-200 rounded-full px-5 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="p-3 bg-blue-500 text-white rounded-full disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-95"
        >
          <Send className="w-5 h-5 -ml-0.5" />
        </button>
      </form>
      
    </div>
  );
}
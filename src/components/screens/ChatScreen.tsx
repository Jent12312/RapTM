'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, ShieldAlert, AlertTriangle, Image as ImageIcon, X } from 'lucide-react';
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
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [partnerId, setPartnerId] = useState<string>('');

  // Объединенная загрузка начальных данных заказа
  useEffect(() => {
    let isMounted = true;
    
    const fetchOrderData = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (!isMounted) return;
        
        setOrderStatus(data.status);
        const pid = data.buyerId === user.id ? data.sellerId : data.buyerId;
        setPartnerId(pid);
      } catch (e) {
        console.error('Order fetch error:', e);
      }
    };

    fetchOrderData();
    return () => { isMounted = false; };
  }, [orderId, user.id]);

  // Обновляем lastSeen при активности в чате
  useEffect(() => {
    if (!user.id) return;
    
    const updateLastSeen = () => {
      fetch('/api/user/last-seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      }).catch(console.error);
    };

    // Обновляем при монтировании и каждые 30 секунд
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Проверяем онлайн-статус партнера
  useEffect(() => {
    if (!partnerId) return;

    const checkPartnerOnline = () => {
      fetch(`/api/user/last-seen?userId=${partnerId}`)
        .then(res => res.json())
        .then(data => setPartnerOnline(data.isOnline))
        .catch(console.error);
    };

    checkPartnerOnline();
    const interval = setInterval(checkPartnerOnline, 5000); // Проверяем каждые 5 секунд
    return () => clearInterval(interval);
  }, [partnerId]);
  
  // Реф для автоматического скролла вниз
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Функция загрузки истории чата
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Улучшенный лонг-поллинг сообщений
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let isFetching = false;
    let isMounted = true;

    const poll = async () => {
      if (isFetching || !isMounted || document.hidden) {
        timer = setTimeout(poll, 3000);
        return;
      }

      isFetching = true;
      try {
        await fetchMessages();
      } finally {
        isFetching = false;
        if (isMounted) {
          timer = setTimeout(poll, 3000);
        }
      }
    };

    poll();
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [orderId]);

  // Автоскролл вниз при новом сообщении
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Отправка сообщения
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    const textToSend = newMessage;
    const imageToSend = selectedImage;
    setNewMessage('');
    setSelectedImage(null);
    setImagePreview(null);

    // Оптимистичное обновление UI
    const tempMsg = {
      id: Date.now().toString(),
      senderId: user.id,
      text: textToSend || null,
      imageUrl: imagePreview,
      createdAt: new Date().toISOString(),
      sender: { firstName: user.firstName }
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      if (imageToSend) {
        // Загрузка изображения + текста
        const formData = new FormData();
        formData.append('image', imageToSend);
        formData.append('senderId', user.id);
        
        // ДОБАВЛЕНО: Прикрепляем текст, чтобы он сохранился вместе с фото
        if (textToSend) {
          formData.append('text', textToSend);
        }

        const res = await fetch(`/api/orders/${orderId}/messages/upload`, {
          method: 'POST',
          body: formData
        });

        if (!res.ok) throw new Error('Image upload failed');
      } else {
        // Отправка только текста
        await fetch(`/api/orders/${orderId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senderId: user.id, text: textToSend })
        });
      }
    } catch (error) {
      alert(t(language, 'chatSendError'));
    }
  };

  // Обработка выбора файла
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(t(language, 'chatSelectImage'));
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Удаление выбранного изображения
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${partnerOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
            <span className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            {partnerOnline ? t(language, 'online') : t(language, 'chatRecently')}
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

      {/* Кнопка АПЕЛЛЯЦИИ */}
      {orderStatus === 'paid' && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">{t(language, 'chatProblems')}</span>
          <button
            onClick={async () => {
              if(confirm(t(language, 'adminDisputes'))) {
                 await fetch(`/api/orders/${orderId}`, {
                   method: 'PATCH',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ isDisputed: true })
                 });
                 // Отправляем системное сообщение
                  await fetch(`/api/orders/${orderId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ senderId: user.id, text: t(language, 'orderSystemDisputeMsg'), isSystem: true })
                  });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> {t(language, 'chatDispute')}
          </button>
        </div>
      )}

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
            const isSystem = msg.isSystem;
            const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSystem ? 'justify-center' : ''}`}>
                <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                  isSystem
                    ? 'bg-red-50 text-red-700 ring-1 ring-red-200 border-2 border-red-300'
                    : isMe
                      ? 'bg-emerald-500 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 ring-1 ring-slate-100 rounded-bl-sm'
                }`}>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Attachment" className="rounded-lg mb-2 max-w-full" />
                  )}
                  {msg.text && (
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  )}
                  <div className={`text-[10px] font-bold mt-1 text-right ${
                    isSystem ? 'text-red-400' : isMe ? 'text-emerald-100' : 'text-slate-400'
                  }`}>
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
      <div className="bg-white p-4 shrink-0 border-t border-slate-100 flex flex-col gap-2 pb-8">
        {/* Превью выбранного изображения */}
        {imagePreview && (
          <div className="relative inline-block self-start">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg ring-1 ring-slate-200" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-all active:scale-95"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder={t(language, 'chatPlaceholder')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-slate-50 ring-1 ring-slate-200 rounded-full px-5 py-3 text-sm font-bold text-slate-800 placeholder-slate-500 placeholder:font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() && !selectedImage}
            onClick={handleSendMessage}
            className="p-3 bg-blue-500 text-white rounded-full disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-95"
          >
            <Send className="w-5 h-5 -ml-0.5" />
          </button>
        </div>
      </div>
      
    </div>
  );
}
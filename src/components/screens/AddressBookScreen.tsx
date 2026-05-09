'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { 
  ChevronLeft, Plus, X, Copy, Trash2, ShieldCheck, 
  Wallet, Globe, Tag, CheckCircle2, Loader2 
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';

interface Props {
  onClose: () => void;
}

export default function AddressBookScreen({ onClose }: Props) {
  const { language, addToast } = useAppStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [network, setNetwork] = useState('TRC20');
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/wallet/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = async () => {
    if (!address) return addToast('Введите адрес', 'error');
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ network, address, label, isDefault })
      });

      if (res.ok) {
        addToast('Адрес добавлен', 'success');
        setIsAdding(false);
        setAddress('');
        setLabel('');
        fetchAddresses();
        WebApp.HapticFeedback.notificationOccurred('success');
      } else {
        const data = await res.json();
        addToast(data.error || 'Ошибка при добавлении', 'error');
      }
    } catch (e) {
      addToast('Ошибка запроса', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Удалить этот адрес?')) return;

    try {
      const res = await fetch(`/api/wallet/addresses?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        addToast('Адрес удален', 'info');
        fetchAddresses();
        WebApp.HapticFeedback.notificationOccurred('warning');
      }
    } catch (e) {
      addToast('Ошибка при удалении', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-3 border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <button onClick={onClose} className="p-2 -ml-2 bg-slate-50 rounded-full">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Адресная книга</h2>
        <button 
          onClick={() => setIsAdding(true)} 
          className="ml-auto p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-100 active:scale-90 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Загрузка адресов...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-slate-100">
              <Wallet className="w-10 h-10 text-slate-200" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">Список пуст</p>
              <p className="text-xs text-slate-400 max-w-[200px]">Добавьте часто используемые адреса для быстрого вывода</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Добавить адрес
            </button>
          </div>
        ) : (
          addresses.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4 group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${
                    item.network === 'TRC20' ? 'bg-red-50 text-red-600' :
                    item.network === 'BEP20' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {item.network.slice(0, 3)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{item.label || 'Без метки'}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.network}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(item.address);
                      addToast('Скопировано', 'info');
                    }}
                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-emerald-500 hover:bg-emerald-50 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteAddress(item.id)}
                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 font-mono text-[11px] text-slate-600 break-all">
                {item.address}
              </div>

              {item.isDefault && (
                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase">
                  <CheckCircle2 className="w-3 h-3" /> По умолчанию
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Address Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-md flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Новый адрес</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 rounded-full active:scale-90 transition-all">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Сеть</label>
                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  {['TRC20', 'BEP20', 'APTOS'].map(n => (
                    <button 
                      key={n} 
                      onClick={() => setNetwork(n)}
                      className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all ${
                        network === n ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Адрес</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Вставьте адрес"
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Метка (Название)</label>
                <input 
                  type="text" 
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Например: Мой Ledger"
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all"
                />
              </div>

              <button 
                onClick={() => setIsDefault(!isDefault)}
                className="flex items-center gap-3 p-2 group"
              >
                <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                  isDefault ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'
                }`}>
                  {isDefault && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-[11px] font-bold text-slate-500 group-active:text-slate-800 transition-colors">Сделать основным для этой сети</span>
              </button>

              <button 
                disabled={isSubmitting}
                onClick={handleAddAddress}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'СОХРАНИТЬ АДРЕС'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { TrendingUp, DollarSign, RefreshCw, Save, Lock, Unlock, Percent, Gift, AlertTriangle, Phone, Wallet } from 'lucide-react';

interface SettingsTabProps {
  sysSettings: Record<string, string>;
  setSysSettings: (settings: Record<string, string>) => void;
  saveSetting: (key: string, value: string) => void;
  savingKey: string | null;
}

export default function SettingsTab({ sysSettings, setSysSettings, saveSetting, savingKey }: SettingsTabProps) {
  return (
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Для автоматических обменов
            </p>
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
              {savingKey === 'EXCHANGE_RATE' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              {sysSettings.RATE_FROZEN === 'true' ? (
                <Lock className="w-5 h-5 text-red-500" />
              ) : (
                <Unlock className="w-5 h-5 text-emerald-500" />
              )}
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
              className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${
                sysSettings.RATE_FROZEN === 'true' ? 'bg-red-500' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform transform shadow-sm ${
                  sysSettings.RATE_FROZEN === 'true' ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Взимается при обменах
            </p>
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
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">TMT</span>
          </div>
          <button
            onClick={() => saveSetting('EXCHANGE_FEE', sysSettings.EXCHANGE_FEE)}
            disabled={savingKey === 'EXCHANGE_FEE'}
            className="bg-emerald-500 hover:bg-emerald-600 text-white w-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
          >
            {savingKey === 'EXCHANGE_FEE' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Номер для приема TMT</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Для ручных переводов</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={sysSettings.RECEIVE_PHONE || ''}
              onChange={(e) => setSysSettings({ ...sysSettings, RECEIVE_PHONE: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 focus:border-blue-400 focus:bg-white rounded-2xl py-4 px-4 text-slate-900 text-lg font-black outline-none transition-all"
              placeholder="+993 65 XX-XX-XX"
            />
          </div>
          <button
            onClick={() => saveSetting('RECEIVE_PHONE', sysSettings.RECEIVE_PHONE)}
            disabled={savingKey === 'RECEIVE_PHONE'}
            className="bg-blue-500 hover:bg-blue-600 text-white w-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
          >
            {savingKey === 'RECEIVE_PHONE' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-slate-900 text-white rounded-2xl">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Кошельки для приема USDT</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Фиксированные адреса</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {['TRC20', 'BEP20', 'APTOS'].map(net => {
            const key = `WALLET_${net}`;
            return (
              <div key={net} className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{net} Address</label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={sysSettings[key] || ''}
                      onChange={(e) => setSysSettings({ ...sysSettings, [key]: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-slate-400 focus:bg-white rounded-2xl py-3 px-4 text-slate-900 text-xs font-mono font-bold outline-none transition-all"
                      placeholder={`Enter ${net} address`}
                    />
                  </div>
                  <button
                    onClick={() => saveSetting(key, sysSettings[key])}
                    disabled={savingKey === key}
                    className="bg-slate-800 hover:bg-slate-900 text-white w-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                  >
                    {savingKey === key ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
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
            {savingKey === 'WELCOME_BONUS' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200/50 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        <p className="text-xs font-bold text-amber-800 leading-relaxed">
          Изменения настроек применяются мгновенно и влияют на все новые операции в системе. Будьте внимательны при
          изменении глобального курса.
        </p>
      </div>
    </div>
  );
}

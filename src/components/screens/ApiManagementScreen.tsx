'use client';

import { ChevronLeft, Code, Lock, Cpu, Globe, Zap, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';

interface Props {
  onClose: () => void;
}

export default function ApiManagementScreen({ onClose }: Props) {
  const { language } = useAppStore();

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full backdrop-blur-md">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-lg font-black text-white tracking-tight">{t(language, 'apiTitle')}</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="relative">
           <div className="absolute inset-0 bg-blue-500 rounded-full blur-[80px] opacity-20 animate-pulse"></div>
           <div className="w-32 h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 border border-white/5">
              <Code className="w-16 h-16 text-blue-400" />
           </div>
        </div>

        <div className="space-y-3 relative z-10">
           <h3 className="text-3xl font-black text-white tracking-tight">{t(language, 'comingSoon')}</h3>
           <p className="text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed">
             {t(language, 'apiDesc')}
           </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
           {[
             { icon: Zap, label: 'WebSocket', desc: 'Realtime updates' },
             { icon: Lock, label: 'Secure Keys', desc: 'Ed25519 Auth' },
             { icon: Cpu, label: 'Auto-Trade', desc: 'Bot friendly' },
             { icon: Globe, label: 'REST API', desc: 'Full control' }
           ].map((feat, i) => (
             <div key={i} className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/5 text-left space-y-2">
                <feat.icon className="w-5 h-5 text-blue-400" />
                <div>
                   <p className="text-[10px] font-black text-white uppercase tracking-tighter">{feat.label}</p>
                   <p className="text-[9px] text-slate-500 font-bold">{feat.desc}</p>
                </div>
             </div>
           ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full max-w-sm py-5 bg-blue-500 text-white rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
        >
          {t(language, 'goBack')} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Footer Branding */}
      <div className="p-8 text-center opacity-20">
         <p className="text-[10px] font-black text-white uppercase tracking-[0.5em]">RAPTM ENGINE v2.0</p>
      </div>
    </div>
  );
}

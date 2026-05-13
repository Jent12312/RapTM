'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/lib/dictionaries';
import { 
  Users, 
  Gift, 
  ChevronLeft, 
  Copy, 
  Share, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowUpRight,
  Info
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';

interface Referral {
  id: string;
  nickname?: string;
  firstName?: string;
  username?: string;
  tradesCount: number;
  createdAt: string;
}

interface ReferralData {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  referrals: Referral[];
}

export default function ReferralScreen({ onClose }: { onClose: () => void }) {
  const { user, language, addToast } = useAppStore();
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferralData = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/user/${user.id}/referrals`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, [user?.id]);

  const referralLink = `https://t.me/rapira_tm_bot/app?startapp=ref_${user?.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    addToast(t(language, 'success'), 'success');
    WebApp.HapticFeedback.notificationOccurred('success');
  };

  const handleShare = () => {
    WebApp.switchInlineQuery(`ref_${user?.id}`, ['users', 'groups', 'channels']);
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in slide-in-from-right duration-300 pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-5 flex items-center gap-4 sticky top-0 z-10 shadow-sm ring-1 ring-slate-100">
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">{t(language, 'referralTitle')}</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(language, 'referralSubtitle')}</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-400 p-6 rounded-[2.5rem] shadow-xl shadow-emerald-100 relative overflow-hidden text-white group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10 space-y-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-black tracking-tight leading-tight">
              {t(language, 'refBonusPerFriend')}
            </h3>
            <p className="text-[11px] font-bold text-white/90 leading-relaxed max-w-[200px]">
              {t(language, 'refBonusDesc')}
            </p>
          </div>
          <div className="absolute bottom-6 right-6 opacity-20">
            <Users className="w-24 h-24" />
          </div>
        </div>

        {/* Link Card */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">
            {t(language, 'referralLink')}
          </label>
          
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-600 truncate flex items-center">
              {referralLink}
            </div>
            <button 
              onClick={handleCopy}
              className="p-3.5 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 active:scale-95 transition-all shadow-lg shadow-slate-100"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={handleShare}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Share className="w-4 h-4" /> {t(language, 'referralShare')}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t(language, 'referralTotal')}</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{data?.totalReferrals || 0}</div>
          </div>

          <div className="bg-white p-5 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t(language, 'referralActive')}</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{data?.activeReferrals || 0}</div>
          </div>

          <div className="bg-white p-5 rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 col-span-2">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-500 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t(language, 'referralEarned')}</span>
                </div>
                <div className="text-2xl font-black text-slate-800">{data?.totalEarned || 0} <span className="text-sm font-bold text-slate-400">USDT</span></div>
             </div>
          </div>
        </div>

        {/* History */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">{t(language, 'referralHistory')}</h3>
          
          <div className="bg-white rounded-[2.5rem] shadow-sm ring-1 ring-slate-100 overflow-hidden">
            {isLoading ? (
              <div className="p-10 flex flex-col items-center justify-center gap-3">
                 <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t(language, 'loading')}</p>
              </div>
            ) : data && Array.isArray(data.referrals) && data.referrals.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {data.referrals.map((ref) => (
                  <div key={ref.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold">
                        {(ref.nickname || ref.firstName || ref.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">
                          {ref.firstName || t(language, 'anonymous')}
                        </p>
                        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(ref.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {ref.tradesCount > 0 ? (
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <span className="text-[10px] font-black uppercase tracking-tighter">{t(language, 'referralStatusActive')}</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span className="text-[10px] font-black uppercase tracking-tighter">{t(language, 'referralStatusPending')}</span>
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-400">{t(language, 'referralNoData')}</p>
                  <p className="text-[10px] font-medium text-slate-300 px-6">{t(language, 'refInviteFriends')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-7 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-white">
          <h3 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            {t(language, 'refRules')}
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                {t(language, 'refRulesDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

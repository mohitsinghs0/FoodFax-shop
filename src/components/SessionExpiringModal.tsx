import React, { useState, useEffect } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { Clock, RefreshCw, LogOut, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { soundService } from '../services/soundService';

export const SessionExpiringModal: React.FC = () => {
  const { 
    isSessionExpiring, 
    sessionRemainingSeconds, 
    extendSession, 
    logout 
  } = useOwnerApp();

  const [isExtending, setIsExtending] = useState<boolean>(false);
  const [extendedSuccess, setExtendedSuccess] = useState<boolean>(false);

  // Play a subtle gentle chime when warning first appears
  useEffect(() => {
    if (isSessionExpiring) {
      try {
        soundService.playNewOrderChime();
      } catch (_) {}
    }
  }, [isSessionExpiring]);

  if (!isSessionExpiring && !extendedSuccess) {
    return null;
  }

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      const ok = await extendSession();
      if (ok) {
        setExtendedSuccess(true);
        try {
          soundService.playSuccessTone();
        } catch (_) {}
        setTimeout(() => {
          setExtendedSuccess(false);
        }, 1500);
      }
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Calculate percentage of 60 seconds remaining
  const percentage = Math.max(0, Math.min(100, (sessionRemainingSeconds / 60) * 100));

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#0B0F19] border-2 border-amber-500/40 rounded-[28px] max-w-sm w-full p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Amber Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />

        {extendedSuccess ? (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-950/50 animate-bounce">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-white">Session Extended!</h3>
            <p className="text-xs text-slate-300 mt-1">
              Your login status has been refreshed for another 60 minutes.
            </p>
          </div>
        ) : (
          <>
            {/* Visual Icon with Progress Ring */}
            <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={sessionRemainingSeconds <= 20 ? 'text-rose-500' : 'text-amber-500'}
                  strokeDasharray={`${percentage}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-xl font-black tabular-nums leading-none ${
                  sessionRemainingSeconds <= 20 ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {sessionRemainingSeconds}s
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                  Left
                </span>
              </div>
            </div>

            {/* Warning Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Session Expiring Soon</span>
            </div>

            <h3 className="text-lg font-black text-white tracking-tight">
              Keep Foodfax Connected?
            </h3>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed px-2">
              For kitchen and payment security, your session will automatically log out in{' '}
              <span className="font-extrabold text-amber-400">{sessionRemainingSeconds} seconds</span>. 
              Click below to stay logged in and continue receiving live orders.
            </p>

            {/* Actions */}
            <div className="mt-6 space-y-2.5">
              <button
                onClick={handleExtend}
                disabled={isExtending}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-orange-950/60 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                <RefreshCw className={`w-4 h-4 ${isExtending ? 'animate-spin' : ''}`} />
                <span>{isExtending ? 'Refreshing Session...' : 'Extend Session (+60 min)'}</span>
              </button>

              <button
                onClick={handleLogout}
                disabled={isExtending}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Now</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

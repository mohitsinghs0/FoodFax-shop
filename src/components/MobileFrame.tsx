import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  isMobileFrame?: boolean;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#050811] text-[#F8FAFC] flex items-center justify-center p-0 sm:p-4 md:p-8">
      {/* Smartphone Chassis - exact match to Android Mobile Device */}
      <div className="relative w-full max-w-[430px] h-screen sm:h-[94vh] sm:max-h-[920px] bg-[#0B0F19] sm:border-[10px] sm:border-[#1E293B] sm:rounded-[48px] shadow-2xl sm:shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col sm:ring-1 sm:ring-slate-700/50">
        {/* Device Status Bar matching the screenshot */}
        <div className="bg-[#0B0F19] px-6 pt-3 pb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#94A3B8] select-none shrink-0 z-40 border-b border-[#131B2E]/40">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">7:20</span>
          </div>

          <div className="flex items-center gap-2 text-[#94A3B8]">
            <span className="text-[10px] text-slate-400">0.37 KB/s</span>
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-0.5 text-emerald-400">
              <span className="text-[10px] font-bold text-slate-300">52%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
        </div>

        {/* Screen Content Container with smooth scrollbar */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative bg-[#0B0F19]">
          {children}
        </div>

        {/* Android Navigation / Home Pill Bar Indicator */}
        <div className="bg-[#0B0F19] py-2 flex justify-center shrink-0 z-40">
          <div className="w-32 h-1 bg-[#334155] rounded-full" />
        </div>
      </div>
    </div>
  );
};

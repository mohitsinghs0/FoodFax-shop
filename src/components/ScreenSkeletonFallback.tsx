import React from 'react';
import { Loader2 } from 'lucide-react';

export const ScreenSkeletonFallback: React.FC = () => {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in duration-150">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 animate-pulse flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-slate-300 tracking-wide uppercase">
          Loading Module...
        </p>
        <p className="text-[11px] text-slate-500 font-mono">
          Dynamic chunk loading via React.lazy()
        </p>
      </div>
    </div>
  );
};

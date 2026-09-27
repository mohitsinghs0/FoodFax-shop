import React from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { Store, Bell } from 'lucide-react';

interface TopAppBarProps {
  onOpenSettings?: () => void;
  onOpenNotifications: () => void;
  onOpenOptimizationDiagnostics?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenNotifications,
}) => {
  const { shop, toggleShopOpen } = useOwnerApp();

  if (!shop) return null;

  return (
    <header className="bg-[#0B0F19] border-b border-[#131B2E] px-4 py-3 sticky top-0 z-30 select-none">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* Shop Avatar & Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-[10px] bg-[#F97316] flex items-center justify-center shrink-0 shadow-sm shadow-orange-950">
            <Store className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-[15px] text-[#F8FAFC] truncate tracking-tight leading-tight">
              {shop.name}
            </h1>
            <p className="text-[11px] text-[#94A3B8] truncate leading-tight mt-0.5">
              {shop.shopType || 'Fast Food & QSR'}
            </p>
          </div>
        </div>

        {/* Action Controls: Live Status Pill & Notifications Bell */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* OFFLINE / ONLINE Toggle Pill */}
          <button
            onClick={() => toggleShopOpen(!shop.isOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider transition-all border ${
              shop.isOpen
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20'
            }`}
            title="Toggle shop online/offline"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                shop.isOpen ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span>{shop.isOpen ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          {/* Bell Icon */}
          <button
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#F8FAFC] hover:bg-[#131B2E] transition relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>
    </header>
  );
};

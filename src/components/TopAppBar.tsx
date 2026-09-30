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
  const { shop, toggleShopOpen, orders } = useOwnerApp();

  if (!shop) return null;

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <header className="sticky top-0 bg-[#0B0F19]/95 backdrop-blur-md border-b border-[#1E293B] px-4 h-14 shrink-0 z-30 select-none flex items-center">
      <div className="flex items-center justify-between gap-3 w-full max-w-[440px] mx-auto">
        {/* Shop Avatar & Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0 shadow-sm shadow-orange-950">
            <Store className="w-4 h-4 text-white stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-[14px] text-[#F8FAFC] truncate tracking-tight leading-tight">
              {shop.name}
            </h1>
            <p className="text-[11px] text-[#94A3B8] truncate leading-none mt-0.5">
              {shop.shopType || 'Thela / Food Stall'}
            </p>
          </div>
        </div>

        {/* Action Controls: Live Status Pill & Notifications Bell */}
        <div className="flex items-center gap-2 shrink-0">
          {/* OFFLINE / ONLINE Toggle Pill */}
          <button
            onClick={() => toggleShopOpen(!shop.isOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider transition-all border cursor-pointer active:scale-95 ${
              shop.isOpen
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20'
            }`}
            title="Toggle shop online/offline"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                shop.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="leading-none">{shop.isOpen ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          {/* Bell Icon with badge */}
          <button
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#F8FAFC] hover:bg-[#131B2E] transition relative cursor-pointer active:scale-95"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5 stroke-[2]" />
            {pendingCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F97316] ring-2 ring-[#0B0F19] animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

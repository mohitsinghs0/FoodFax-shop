import React from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { Store, Bell, Activity, Sparkles } from 'lucide-react';

interface TopAppBarProps {
  onOpenSettings?: () => void;
  onOpenNotifications: () => void;
  onOpenOptimizationDiagnostics?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenNotifications,
  onOpenOptimizationDiagnostics,
}) => {
  const { shop, toggleShopOpen, orders, activeScreen } = useOwnerApp();

  if (!shop) return null;

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  const screenTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard Overview', subtitle: 'Real-time kitchen KPIs and order tracking' },
    orders: { title: 'Live Kitchen Orders', subtitle: 'Accept, prepare, and fulfill incoming orders' },
    menu: { title: 'Menu Catalog', subtitle: 'Manage dishes, categories, pricing, and stock status' },
    shop_qr: { title: 'Store Counter QR Code', subtitle: 'Digital customer ordering standee & table links' },
    sales: { title: 'Sales & Business Analytics', subtitle: 'Settlements, revenue reports & PDF export' },
    profile: { title: 'Store Owner Profile', subtitle: 'Account management & shop configuration' },
  };

  const currentInfo = screenTitles[activeScreen] || {
    title: shop.name,
    subtitle: shop.shopType || 'FoodFax Partner',
  };

  return (
    <header className="sticky top-0 left-0 right-0 bg-[#0B0F19]/95 backdrop-blur-md border-b border-[#1E293B] px-4 lg:px-8 h-14 lg:h-16 shrink-0 z-30 select-none flex items-center pt-[env(safe-area-inset-top,0px)]">
      <div className="flex items-center justify-between gap-3 w-full max-w-[440px] lg:max-w-none mx-auto">
        {/* MOBILE VIEW (Identical to previous phone UI) */}
        <div className="flex items-center gap-2.5 min-w-0 lg:hidden">
          {shop.logoUrl || shop.bannerUrl ? (
            <div className="w-8 h-8 rounded-[10px] overflow-hidden shrink-0 border border-orange-500/50 shadow-sm shadow-orange-950 bg-slate-900">
              <img
                src={shop.logoUrl || shop.bannerUrl}
                alt={shop.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0 shadow-sm shadow-orange-950">
              <Store className="w-4 h-4 text-white stroke-[2.2]" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-extrabold text-[14px] text-[#F8FAFC] truncate tracking-tight leading-tight">
              {shop.name}
            </h1>
            <p className="text-[11px] text-[#94A3B8] truncate leading-none mt-0.5">
              {shop.shopType || 'Food Stall / Food Cart'}
            </p>
          </div>
        </div>

        {/* DESKTOP VIEW (Spacious breadcrumbs & status) */}
        <div className="hidden lg:flex items-center gap-3 min-w-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight leading-tight">
                {currentInfo.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider">
                Store POS
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-none mt-0.5">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls: Live Status Pill & Notifications Bell */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* OFFLINE / ONLINE Toggle Pill */}
          <button
            onClick={() => toggleShopOpen(!shop.isOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all border cursor-pointer active:scale-95 ${
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

          {/* Performance Diagnostics on Desktop */}
          {onOpenOptimizationDiagnostics && (
            <button
              onClick={onOpenOptimizationDiagnostics}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131B2E] border border-[#23304A] text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition"
              title="System Diagnostics"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Diagnostics</span>
            </button>
          )}

          {/* Bell Icon with badge */}
          <button
            onClick={onOpenNotifications}
            className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center text-[#F8FAFC] bg-[#131B2E] border border-[#23304A] hover:border-slate-500 transition relative cursor-pointer active:scale-95"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5 stroke-[2]" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center bg-[#F97316] text-white ring-2 ring-[#0B0F19] animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

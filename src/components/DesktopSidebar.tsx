import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { ActiveScreen } from '../types';
import { 
  LayoutGrid, 
  Receipt, 
  UtensilsCrossed, 
  QrCode, 
  BarChart3, 
  Store, 
  User, 
  Settings, 
  Bell, 
  Volume2, 
  VolumeX, 
  Zap, 
  LogOut, 
  Check, 
  Sliders
} from 'lucide-react';
import { soundService } from '../services/soundService';

interface DesktopSidebarProps {
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenShopProfile: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  onOpenSettings,
  onOpenNotifications,
  onOpenShopProfile,
}) => {
  const { 
    activeScreen, 
    setActiveScreen, 
    shop, 
    toggleShopOpen, 
    toggleRushMode,
    orders, 
    menuItems,
    ownerProfile, 
    logout,
    isSoundEnabled,
    toggleSound
  } = useOwnerApp();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!shop) return null;

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const currentShopPhoto = shop.logoUrl || shop.bannerUrl;

  const navItems: { screen: ActiveScreen; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      screen: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutGrid className="w-5 h-5 stroke-[2]" />,
    },
    {
      screen: 'orders',
      label: 'Live Orders',
      icon: <Receipt className="w-5 h-5 stroke-[2]" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      screen: 'menu',
      label: 'Menu Items',
      icon: <UtensilsCrossed className="w-5 h-5 stroke-[2]" />,
      badge: menuItems.length > 0 ? menuItems.length : undefined,
    },
    {
      screen: 'sales',
      label: 'Sales & Reports',
      icon: <BarChart3 className="w-5 h-5 stroke-[2]" />,
    },
    {
      screen: 'shop_qr',
      label: 'Counter QR Code',
      icon: <QrCode className="w-5 h-5 stroke-[2]" />,
    },
    {
      screen: 'profile',
      label: 'Owner Profile',
      icon: <User className="w-5 h-5 stroke-[2]" />,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#0B0F19] border-r border-[#1E293B] shrink-0 h-screen sticky top-0 select-none z-30 justify-between">
      {/* Top Branding Section */}
      <div className="p-5 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          {currentShopPhoto ? (
            <div className="w-11 h-11 rounded-2xl overflow-hidden shrink-0 border border-orange-500/50 shadow-md shadow-orange-950/40 bg-slate-900">
              <img
                src={currentShopPhoto}
                alt={shop.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-orange-950/40 text-white font-black text-lg">
              {shop.name ? shop.name[0].toUpperCase() : 'S'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-[15px] text-white truncate tracking-tight leading-tight">
              {shop.name}
            </h1>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {shop.shopType || 'FoodFax Partner'}
            </p>
          </div>
        </div>

        {/* Live Store Toggle Button */}
        <div className="mt-3.5">
          <button
            onClick={() => toggleShopOpen(!shop.isOpen)}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer active:scale-[0.98] ${
              shop.isOpen
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  shop.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>{shop.isOpen ? 'STORE IS ONLINE' : 'STORE IS OFFLINE'}</span>
            </span>
            <span className="text-[10px] uppercase font-mono opacity-80">
              {shop.isOpen ? 'Accepting' : 'Paused'}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 mb-2">
          Management
        </p>

        {navItems.map((item) => {
          const isActive = activeScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => setActiveScreen(item.screen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-[#131B2E]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-white text-orange-600'
                      : item.screen === 'orders'
                      ? 'bg-orange-600 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 pb-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 mb-2">
            Store Controls
          </p>

          {/* Rush Mode Button */}
          <button
            onClick={() => toggleRushMode(!shop.isRushMode)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer mb-1 ${
              shop.isRushMode
                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                : 'text-slate-300 hover:text-white hover:bg-[#131B2E]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Zap className={`w-4.5 h-4.5 ${shop.isRushMode ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>Kitchen Rush Mode</span>
            </div>
            <span className={`text-[10px] font-mono ${shop.isRushMode ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
              {shop.isRushMode ? '+15m' : 'Off'}
            </span>
          </button>

          {/* Sound Alarm Toggle */}
          <button
            onClick={() => {
              toggleSound();
              if (!isSoundEnabled) {
                soundService.unlockAudio();
                soundService.playLoudOrderAlarm(2.0);
              }
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer mb-1 ${
              isSoundEnabled
                ? 'text-slate-300 hover:text-white hover:bg-[#131B2E]'
                : 'text-slate-500 hover:text-slate-400 hover:bg-[#131B2E]'
            }`}
          >
            <div className="flex items-center gap-3">
              {isSoundEnabled ? (
                <Volume2 className="w-4.5 h-4.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-4.5 h-4.5 text-slate-500" />
              )}
              <span>Order Audio Chime</span>
            </div>
            <span className={`text-[10px] font-mono ${isSoundEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isSoundEnabled ? 'Active' : 'Muted'}
            </span>
          </button>

          {/* Quick Settings & Notifications */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-300 hover:text-white hover:bg-[#131B2E] transition cursor-pointer mb-1"
          >
            <Settings className="w-4.5 h-4.5 text-cyan-400" />
            <span>Delivery &amp; Kitchen Rules</span>
          </button>

          <button
            onClick={onOpenShopProfile}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-300 hover:text-white hover:bg-[#131B2E] transition cursor-pointer"
          >
            <Store className="w-4.5 h-4.5 text-orange-400" />
            <span>Shop Profile &amp; Location</span>
          </button>
        </div>
      </div>

      {/* Bottom User Profile & Sign Out Card */}
      <div className="p-4 border-t border-[#1E293B] bg-[#080C14]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate capitalize">
              {ownerProfile?.fullName || 'Store Owner'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {ownerProfile?.phone || shop.phone || '+91 93214 44297'}
            </p>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition cursor-pointer shrink-0"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-[#23304A] rounded-[24px] p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">Sign Out?</h3>
            <p className="text-xs text-[#94A3B8] mt-1.5">
              Are you sure you want to sign out from your restaurant dashboard?
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#0B0F19] text-[#94A3B8] font-bold text-xs hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

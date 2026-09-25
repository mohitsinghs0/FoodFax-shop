import React from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { 
  Store, 
  Volume2, 
  VolumeX, 
  Bell, 
  Flame, 
  SlidersHorizontal,
  Zap,
  WifiOff,
  RefreshCw
} from 'lucide-react';

interface TopAppBarProps {
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenOptimizationDiagnostics?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenSettings,
  onOpenNotifications,
  onOpenOptimizationDiagnostics,
}) => {
  const { shop, toggleShopOpen, isSoundEnabled, toggleSound, orders, isOffline, pendingSyncCount, syncOfflineData } = useOwnerApp();

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  if (!shop) return null;

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-3 py-2.5 sm:px-4 sm:py-3 sticky top-0 z-30 shadow-md">
      <div className="flex items-center justify-between gap-2 max-w-6xl mx-auto">
        {/* Shop Name & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center shrink-0 shadow-sm shadow-orange-950">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-slate-100 truncate tracking-tight">
                {shop.name}
              </h1>
              {shop.isRushMode && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">
                  <Flame className="w-3 h-3 text-red-400" />
                  Rush +{shop.rushExtraMinutes}m
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">{shop.shopType || 'Restaurant Partner'}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Offline / Sync Status Indicator */}
          {isOffline && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold"
              title="Working offline with IndexedDB local cache"
            >
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Offline (IndexedDB)</span>
            </div>
          )}

          {!isOffline && pendingSyncCount > 0 && (
            <button
              onClick={() => syncOfflineData()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-300 text-[11px] font-bold hover:bg-blue-500/25 transition"
              title="Click to sync local IndexedDB changes to cloud"
            >
              <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
              <span>Syncing ({pendingSyncCount})</span>
            </button>
          )}

          {/* Optimization Diagnostics Quick Button */}
          {onOpenOptimizationDiagnostics && (
            <button
              onClick={onOpenOptimizationDiagnostics}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold transition"
              title="Open API Latency & Performance Diagnostics"
            >
              <Zap className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
              <span className="hidden md:inline">Perf</span>
            </button>
          )}

          {/* Shop Open / Closed Live Switch */}
          <button
            onClick={() => toggleShopOpen(!shop.isOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              shop.isOpen
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
            }`}
            title="Toggle store open/closed"
          >
            <span
              className={`w-2 h-2 rounded-full ${shop.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}
            />
            <span className="hidden sm:inline">{shop.isOpen ? 'STORE OPEN' : 'STORE CLOSED'}</span>
            <span className="sm:hidden">{shop.isOpen ? 'OPEN' : 'CLOSED'}</span>
          </button>

          {/* Audio Chime Mute/Unmute */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition ${
              isSoundEnabled
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
            title={isSoundEnabled ? 'Kitchen order chime is enabled' : 'Kitchen order chime is muted'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 relative transition"
            title="Order Notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center animate-bounce">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Shop Operations Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            title="Operations Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

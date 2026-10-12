import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { 
  ArrowLeft, 
  Search, 
  Zap, 
  Clock, 
  Inbox, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Phone, 
  Timer, 
  RefreshCw,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  CheckSquare,
  Square,
  Check,
  Layers,
  Loader2,
  AlertTriangle,
  Flame,
  Sparkles
} from 'lucide-react';
import { OrderStatus, OwnerOrder } from '../types';
import { soundService } from '../services/soundService';

export const OrdersScreen: React.FC = () => {
  const { 
    orders, 
    updateOrderStatus, 
    setSelectedOrderId, 
    setActiveScreen,
    refreshOrders,
    shop,
    realtimeStatus,
    isSoundEnabled,
    toggleSound,
    isPushNotificationEnabled,
    togglePushNotifications,
    pushPermission
  } = useOwnerApp();

  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // KDS Overdue Audio Alert State & 10s Ticker
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  const [isOverdueAudioMuted, setIsOverdueAudioMuted] = useState<boolean>(false);
  const lastOverdueAlarmTimeRef = useRef<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Bulk Selection State for kitchen staff
  const [isBulkSelectMode, setIsBulkSelectMode] = useState<boolean>(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState<boolean>(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (shop?.id) {
        await refreshOrders(shop.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper to compute live preparation time metrics for an order
  const getPrepStatus = (order: OwnerOrder) => {
    const isUnfinished = ['pending', 'accepted', 'preparing'].includes(order.status);
    const createdAtMs = new Date(order.createdAt).getTime();
    const elapsedMinutes = Math.max(0, Math.floor((currentTimeMs - (isNaN(createdAtMs) ? currentTimeMs : createdAtMs)) / 60000));
    const targetMinutes = Math.max(5, (order.estimatedPrepMinutes || 15) + (shop?.isRushMode ? (shop?.rushExtraMinutes || 15) : 0));
    const isOverdue = isUnfinished && elapsedMinutes > targetMinutes;
    const overdueMinutes = isOverdue ? elapsedMinutes - targetMinutes : 0;
    const remainingMinutes = Math.max(0, targetMinutes - elapsedMinutes);
    const progressPercent = Math.min(100, Math.round((elapsedMinutes / targetMinutes) * 100));

    return {
      elapsedMinutes,
      targetMinutes,
      isOverdue,
      overdueMinutes,
      remainingMinutes,
      progressPercent,
    };
  };

  // Active non-finalized orders
  const activeOrders = useMemo(() => {
    return orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
  }, [orders]);

  // List of active orders currently exceeding estimated preparation time
  const overdueOrders = useMemo(() => {
    return activeOrders.filter((o) => getPrepStatus(o).isOverdue);
  }, [activeOrders, currentTimeMs, shop?.isRushMode]);

  // Audio Alert Trigger: Automatically sounds distinct alert when overdue orders exist
  useEffect(() => {
    if (viewMode !== 'active' || overdueOrders.length === 0) return;
    if (isOverdueAudioMuted || !isSoundEnabled) return;

    const now = Date.now();
    // Play reminder buzzer every 50 seconds while orders are overdue
    if (now - lastOverdueAlarmTimeRef.current >= 50000) {
      lastOverdueAlarmTimeRef.current = now;
      soundService.unlockAudio();
      soundService.playOverdueOrderAlarm();
    }
  }, [overdueOrders.length, isOverdueAudioMuted, isSoundEnabled, viewMode, currentTimeMs]);

  // Orders eligible to be marked ready (pending, accepted, or preparing)
  const markableOrders = useMemo(() => {
    return activeOrders.filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status));
  }, [activeOrders]);

  // History orders (completed or cancelled)
  const historyOrders = useMemo(() => {
    return orders.filter((o) => ['completed', 'cancelled'].includes(o.status));
  }, [orders]);

  // Status tabs matching KDS workflow with Overdue counter
  const statusTabs = useMemo(() => [
    { id: 'all', label: 'All Active' },
    ...(overdueOrders.length > 0 ? [{ id: 'overdue', label: `⚠️ Overdue (${overdueOrders.length})` }] : []),
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready', label: 'Ready' },
  ], [overdueOrders.length]);

  // Filtered orders based on search & tab
  const displayedOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const source = viewMode === 'active' ? activeOrders : historyOrders;

    return source.filter((o) => {
      if (viewMode === 'active') {
        if (activeTab === 'overdue') {
          return getPrepStatus(o).isOverdue;
        }
        if (activeTab !== 'all' && o.status !== activeTab) {
          return false;
        }
      }
      if (!q) return true;
      return (
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.customerPhone || '').includes(q)
      );
    });
  }, [viewMode, activeOrders, historyOrders, activeTab, searchQuery, currentTimeMs]);

  // Toggle single order selection
  const toggleSelectOrder = (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Select all or deselect all markable displayed orders
  const handleSelectAllDisplayed = () => {
    const targetEligible = displayedOrders.filter((o) => o.status !== 'ready');
    const allSelected = targetEligible.length > 0 && targetEligible.every((o) => selectedOrderIds.has(o.id));

    if (allSelected) {
      // Clear selection
      setSelectedOrderIds(new Set());
    } else {
      // Select all displayed markable orders
      const newSet = new Set(selectedOrderIds);
      targetEligible.forEach((o) => newSet.add(o.id));
      setSelectedOrderIds(newSet);
    }
  };

  // Bulk Mark as 'Ready for Pickup' in a single click
  const handleBulkMarkReady = async () => {
    if (selectedOrderIds.size === 0 || isBulkUpdating) return;

    setIsBulkUpdating(true);
    const orderIdsToUpdate = Array.from(selectedOrderIds);
    let successCount = 0;

    try {
      for (const id of orderIdsToUpdate) {
        const ok = await updateOrderStatus(id, 'ready');
        if (ok) successCount++;
      }

      soundService.playSuccessTone();
      setBulkSuccessMsg(`Marked ${successCount} order${successCount > 1 ? 's' : ''} as Ready for Pickup!`);
      setSelectedOrderIds(new Set());
      setIsBulkSelectMode(false);

      setTimeout(() => {
        setBulkSuccessMsg(null);
      }, 4000);
    } catch (err) {
      console.warn('Error during bulk mark as ready:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="min-h-full bg-[#0B0F19] text-[#F8FAFC] pb-28 select-none">
      {/* Top App Bar matching Photo 2 */}
      <div className="px-4 py-3.5 border-b border-[#131B2E] flex items-center justify-between sticky top-0 bg-[#0B0F19] z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('dashboard')}
            className="p-1 -ml-1 text-white hover:text-[#F97316] transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <h2 className="text-[17px] font-black tracking-tight text-white leading-tight">
              Orders Management
            </h2>
            <p className="text-[10px] text-[#94A3B8] leading-none">
              {shop?.name || 'Restaurant'} &bull; {orders.length} total orders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Selection Toggle Button (Active Orders only) */}
          {viewMode === 'active' && markableOrders.length > 0 && (
            <button
              onClick={() => {
                if (isBulkSelectMode) {
                  setIsBulkSelectMode(false);
                  setSelectedOrderIds(new Set());
                } else {
                  setIsBulkSelectMode(true);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer ${
                isBulkSelectMode
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                  : 'bg-[#131B2E] border-[#23304A] text-slate-300 hover:text-white hover:border-slate-600'
              }`}
              title="Bulk-select orders to mark ready"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isBulkSelectMode ? 'Cancel' : 'Bulk Select'}</span>
            </button>
          )}

          {/* Background Push Notification Toggle Button */}
          <button
            onClick={() => togglePushNotifications()}
            className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${
              isPushNotificationEnabled && pushPermission === 'granted'
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-400 hover:bg-sky-500/25'
                : isPushNotificationEnabled
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-[#131B2E] border-[#23304A] text-slate-400 hover:text-slate-200'
            }`}
            title={
              isPushNotificationEnabled 
                ? `Background Push Alerts: ENABLED (${pushPermission})` 
                : 'Background Push Alerts: DISABLED (Click to enable)'
            }
          >
            {isPushNotificationEnabled ? (
              <Bell className="w-4 h-4 stroke-[2.2]" />
            ) : (
              <BellOff className="w-4 h-4 stroke-[2.2]" />
            )}
          </button>

          {/* Audio & Loud Order Alarm Toggle Button */}
          <button
            onClick={() => {
              toggleSound();
              if (!isSoundEnabled) {
                soundService.unlockAudio();
                soundService.playLoudOrderAlarm(2.0);
              }
            }}
            className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${
              isSoundEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-[#131B2E] border-[#23304A] text-slate-400 hover:text-slate-200'
            }`}
            title={isSoundEnabled ? 'Loud Order Alarm (1-3s) is ACTIVE (Click to mute)' : 'Order Alarm is MUTED (Click to enable)'}
          >
            {isSoundEnabled ? (
              <Volume2 className="w-4 h-4 stroke-[2.2]" />
            ) : (
              <VolumeX className="w-4 h-4 stroke-[2.2]" />
            )}
          </button>

          {/* Manual Refresh / Sync Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#23304A] bg-[#131B2E] hover:border-[#F97316] text-[#F97316] text-xs font-bold transition active:scale-95 cursor-pointer ${
              isRefreshing ? 'opacity-70' : ''
            }`}
            title="Refresh incoming orders now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-3 lg:py-6 space-y-3.5 lg:space-y-5 max-w-md lg:max-w-7xl mx-auto w-full">
        {/* Segmented Top Toggle: Active Orders vs Order History */}
        <div className="bg-[#131B2E] border border-[#23304A] rounded-[14px] p-1 grid grid-cols-2 max-w-md">
          <button
            onClick={() => setViewMode('active')}
            className={`py-2 text-[12px] font-bold rounded-[10px] transition flex items-center justify-center gap-1.5 ${
              viewMode === 'active'
                ? 'bg-[#F97316] text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Active Orders</span>
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`py-2 text-[12px] font-bold rounded-[10px] transition flex items-center justify-center gap-1.5 ${
              viewMode === 'history'
                ? 'bg-[#F97316] text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Order History</span>
          </button>
        </div>

        {/* Search Input matching Photo 2 */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              viewMode === 'active'
                ? 'Search active orders by # or cust...'
                : 'Search completed orders...'
            }
            className="w-full bg-[#131B2E] border border-[#23304A] focus:border-[#F97316] rounded-[14px] pl-10 pr-4 py-3 text-xs text-white placeholder-[#64748B] outline-none font-medium transition"
          />
        </div>

        {/* Bulk Selection Sub-bar (when in Bulk Select mode) */}
        {viewMode === 'active' && isBulkSelectMode && (
          <div className="bg-[#131B2E] border border-orange-500/40 rounded-[14px] p-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllDisplayed}
                className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-orange-400 transition cursor-pointer"
              >
                {displayedOrders.filter((o) => o.status !== 'ready').length > 0 &&
                displayedOrders
                  .filter((o) => o.status !== 'ready')
                  .every((o) => selectedOrderIds.has(o.id)) ? (
                  <CheckSquare className="w-4 h-4 text-orange-500 fill-orange-500/20" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Select All Non-Ready ({displayedOrders.filter((o) => o.status !== 'ready').length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-orange-400">
                {selectedOrderIds.size} Selected
              </span>
              {selectedOrderIds.size > 0 && (
                <button
                  onClick={() => setSelectedOrderIds(new Set())}
                  className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Success toast notification */}
        {bulkSuccessMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bulkSuccessMsg}</span>
          </div>
        )}

        {/* KDS Visual & Audio Overdue Warning Banner */}
        {viewMode === 'active' && overdueOrders.length > 0 && (
          <div className="bg-gradient-to-r from-red-950/80 via-red-900/40 to-red-950/80 border-2 border-red-500/80 rounded-[18px] p-3.5 shadow-xl shadow-red-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-pulse-border">
            <div className="flex items-start md:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/25 border border-red-500/50 flex items-center justify-center shrink-0 text-red-400 shadow-inner">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-400 fill-red-500/20" />
                    KDS Prep Delay Alert: {overdueOrders.length} Order{overdueOrders.length > 1 ? 's' : ''} Overdue!
                  </h4>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500 text-white font-black uppercase tracking-wider animate-pulse">
                    Urgent
                  </span>
                </div>
                <p className="text-[11px] text-red-200/90 font-medium mt-0.5">
                  Orders exceeding estimated kitchen preparation time:{' '}
                  <span className="font-bold text-red-100">
                    {overdueOrders.map((o) => `${o.orderNumber} (+${getPrepStatus(o).overdueMinutes}m)`).join(', ')}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => {
                  soundService.unlockAudio();
                  soundService.playOverdueOrderAlarm();
                }}
                className="px-2.5 py-1.5 rounded-xl border border-red-500/40 bg-red-900/40 text-red-200 hover:bg-red-800/50 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Test kitchen overdue buzzer sound"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Test Buzzer</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOverdueAudioMuted((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isOverdueAudioMuted
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30'
                }`}
                title={isOverdueAudioMuted ? 'Turn Overdue Audio Alert ON' : 'Mute Overdue Audio Alert'}
              >
                {isOverdueAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
                <span>{isOverdueAudioMuted ? 'Alarm Muted' : 'Alarm Active'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('overdue')}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
              >
                <span>Expedite ({overdueOrders.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Horizontal Status Tabs (Only in Active mode) */}
        {viewMode === 'active' && (
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar border-b border-[#23304A]/60 pt-1 pb-2">
            {statusTabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-[13px] font-bold pb-1 whitespace-nowrap transition relative ${
                    isSelected ? 'text-[#F97316]' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isSelected && (
                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#F97316] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Orders List / Empty State */}
        {displayedOrders.length === 0 ? (
          <div className="py-24 text-center select-none flex flex-col items-center justify-center">
            {/* Folder Empty Icon matching Photo 2 */}
            <div className="w-16 h-16 rounded-[20px] bg-[#131B2E] border border-[#23304A] flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-[#64748B]" />
            </div>

            <h3 className="text-[15px] font-bold text-white mb-1">
              No {viewMode === 'active' ? (activeTab === 'all' ? 'All Active' : activeTab) : 'History'} orders found
            </h3>
            <p className="text-[12px] text-[#94A3B8]">
              New incoming orders will appear automatically
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 lg:gap-4 pt-1">
            {displayedOrders.map((order) => {
              const isSelected = selectedOrderIds.has(order.id);
              const isMarkable = order.status !== 'ready' && ['pending', 'accepted', 'preparing'].includes(order.status);
              const prep = getPrepStatus(order);
              const isUnfinished = ['pending', 'accepted', 'preparing'].includes(order.status);

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    if (isBulkSelectMode && isMarkable) {
                      toggleSelectOrder(order.id);
                    }
                  }}
                  className={`border rounded-[18px] p-4 shadow-sm transition-all duration-200 ${
                    isBulkSelectMode && isMarkable ? 'cursor-pointer hover:border-slate-500' : ''
                  } ${
                    prep.isOverdue
                      ? 'border-red-500/80 ring-2 ring-red-500/40 bg-gradient-to-b from-[#1C101A] to-[#131B2E] shadow-xl shadow-red-950/30'
                      : isSelected
                      ? 'border-orange-500 ring-2 ring-orange-500/30 bg-[#162035]'
                      : 'bg-[#131B2E] border-[#23304A]'
                  }`}
                >
                  {/* Header: Order #, Customer & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox when in Bulk Select Mode */}
                      {isBulkSelectMode && (
                        <div className="pt-0.5">
                          {isMarkable ? (
                            <button
                              type="button"
                              onClick={(e) => toggleSelectOrder(order.id, e)}
                              className="text-orange-500 focus:outline-none cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                              )}
                            </button>
                          ) : (
                            <span title="Order is already Ready">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                            </span>
                          )}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[15px] font-black text-white">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                              order.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : order.status === 'accepted'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : order.status === 'preparing'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : order.status === 'ready'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {order.status}
                          </span>

                          {/* Overdue Badge */}
                          {prep.isOverdue && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/50 flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                              +{prep.overdueMinutes}m LATE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                          {order.customerName} &bull; {order.customerPhone}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-black text-white">₹{order.totalAmount}</p>
                      <p className="text-[10px] text-[#94A3B8] font-medium">{order.paymentMethod}</p>
                    </div>
                  </div>

                  {/* KDS Preparation Timer & Overdue Visual Alert Pill */}
                  {isUnfinished && (
                    <div className="mb-2.5">
                      {prep.isOverdue ? (
                        <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 shadow-inner">
                          <div className="flex items-center justify-between text-xs font-black mb-1">
                            <span className="flex items-center gap-1 text-red-400">
                              <AlertTriangle className="w-3.5 h-3.5 animate-bounce shrink-0" />
                              <span>+{prep.overdueMinutes}m OVERDUE</span>
                            </span>
                            <span className="text-[11px] font-bold text-red-200 tabular-nums">
                              {prep.elapsedMinutes}m elapsed / {prep.targetMinutes}m est
                            </span>
                          </div>
                          <div className="w-full bg-red-950 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full animate-pulse" style={{ width: '100%' }} />
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-[#0B0F19] border border-[#23304A] text-slate-300">
                          <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <Timer className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                              <span>Prep Time</span>
                            </span>
                            <span className="tabular-nums">
                              {prep.elapsedMinutes}m / {prep.targetMinutes}m{' '}
                              <span className={prep.progressPercent >= 80 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                                ({prep.remainingMinutes}m left)
                              </span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                prep.progressPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(8, prep.progressPercent))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items List */}
                  <div className="bg-[#0B0F19] rounded-[12px] p-2.5 space-y-1 mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-[#F8FAFC]">
                        <span className="font-semibold">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-[#94A3B8]">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'accepted');
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition cursor-pointer"
                        >
                          Accept Order
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'cancelled', 'Busy');
                          }}
                          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {order.status === 'accepted' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, 'preparing');
                        }}
                        className={`w-full py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer ${
                          prep.isOverdue
                            ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-950/40 animate-pulse'
                            : 'bg-blue-600 hover:bg-blue-500'
                        }`}
                      >
                        {prep.isOverdue ? '⚠️ Overdue - Start Cooking Now!' : 'Start Cooking'}
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, 'ready');
                        }}
                        className={`w-full py-2 rounded-xl text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          prep.isOverdue
                            ? 'bg-gradient-to-r from-red-600 via-orange-600 to-emerald-600 hover:brightness-110 shadow-lg shadow-red-950/40'
                            : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                      >
                        {prep.isOverdue ? (
                          <>
                            <Flame className="w-3.5 h-3.5" />
                            <span>Expedite & Mark Ready</span>
                          </>
                        ) : (
                          <span>Mark as Ready</span>
                        )}
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, 'completed');
                        }}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Handover & Complete
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrderId(order.id);
                      }}
                      className="p-2 rounded-xl bg-[#0B0F19] text-[#94A3B8] hover:text-white cursor-pointer"
                      title="View details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Bulk Action Bar for Kitchen Staff */}
      {viewMode === 'active' && isBulkSelectMode && selectedOrderIds.size > 0 && (
        <div className="fixed bottom-16 lg:bottom-6 left-0 lg:left-auto right-0 lg:right-8 z-40 px-4 py-3 bg-[#0B0F19]/95 backdrop-blur-md border-t lg:border border-[#23304A] lg:rounded-2xl shadow-2xl">
          <div className="max-w-md lg:max-w-xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white">
                {selectedOrderIds.size} Order{selectedOrderIds.size > 1 ? 's' : ''} Selected
              </p>
              <p className="text-[11px] text-slate-400">
                Ready to serve or pack
              </p>
            </div>

            <button
              onClick={handleBulkMarkReady}
              disabled={isBulkUpdating}
              className="flex-1 max-w-[220px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs transition active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {isBulkUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Orders...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Ready for Pickup ({selectedOrderIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

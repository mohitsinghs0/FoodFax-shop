import React, { useMemo, useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { CustomizeLayoutModal } from '../components/CustomizeLayoutModal';
import { 
  Zap, 
  TrendingUp, 
  IndianRupee, 
  Receipt, 
  CookingPot, 
  CheckCircle2, 
  UtensilsCrossed, 
  BookOpen, 
  QrCode, 
  BarChart3,
  Inbox,
  AlertCircle,
  BellRing,
  Sliders,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { 
    shop, 
    orders, 
    toggleRushMode, 
    setActiveScreen, 
    setSelectedOrderId,
    dashboardPreferences,
    updateDashboardLayout
  } = useOwnerApp();

  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);

  const {
    todayOrders,
    todayCompletedOrders,
    todayRevenue,
    pendingOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    activeOrders,
    topSellingItems,
  } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const isToday = (dateString?: string) => {
      if (!dateString) return false;
      const itemDate = new Date(dateString).getTime();
      return itemDate >= todayStart;
    };

    const tOrders = orders.filter((o) => isToday(o.createdAt));
    const tCompleted = tOrders.filter((o) => o.status === 'completed');
    const tRev = tCompleted.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    const pending = orders.filter((o) => o.status === 'pending');
    const preparing = orders.filter((o) => o.status === 'preparing');
    const ready = orders.filter((o) => o.status === 'ready');
    const completed = orders.filter((o) => o.status === 'completed');
    const active = orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));

    // Calculate top selling items today/overall
    const itemMap = new Map<string, { name: string; count: number; revenue: number }>();
    (tCompleted.length > 0 ? tCompleted : completed).forEach((o) => {
      o.items.forEach((item) => {
        const existing = itemMap.get(item.name) || { name: item.name, count: 0, revenue: 0 };
        existing.count += item.quantity;
        existing.revenue += item.price * item.quantity;
        itemMap.set(item.name, existing);
      });
    });
    const topItems = Array.from(itemMap.values()).sort((a, b) => b.count - a.count).slice(0, 3);

    return {
      todayOrders: tOrders,
      todayCompletedOrders: tCompleted,
      todayRevenue: tRev,
      pendingOrders: pending,
      preparingOrders: preparing,
      readyOrders: ready,
      completedOrders: completed,
      activeOrders: active,
      topSellingItems: topItems,
    };
  }, [orders]);

  if (!shop) return null;

  // Active grid items from layout preferences
  const showTodaySales = dashboardPreferences.todaySales;
  const showActiveOrders = dashboardPreferences.activeOrders;
  const showPreparingOrders = dashboardPreferences.preparingOrders;
  const showCompletedOrders = dashboardPreferences.completedOrders;
  const showTopSelling = dashboardPreferences.topSellingItems;
  const showQuickActions = dashboardPreferences.quickActions;
  const showRecentOrders = dashboardPreferences.recentOrders;

  // Count active grid cards in performance block
  const gridCardsCount = [showTodaySales, showActiveOrders, showPreparingOrders, showCompletedOrders].filter(Boolean).length;

  return (
    <div className="space-y-3.5 px-3.5 py-3 max-w-[440px] mx-auto select-none pb-24">
      {/* Top Banner: Status & Customize Layout Control Bar */}
      <div className="flex items-center justify-between bg-[#131B2E] border border-[#1E293B] rounded-[16px] px-3.5 py-2.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-white tracking-tight truncate">Live Counter Active</span>
        </div>

        <button
          onClick={() => setShowCustomizeModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 text-[11px] font-bold transition cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
          title="Customize dashboard cards"
        >
          <Sliders className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Customize</span>
        </button>
      </div>

      {/* Kitchen Rush Mode Card */}
      <div className="bg-[#131B2E] border border-[#1E293B] rounded-[18px] p-3.5 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-[#F97316] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 fill-[#F97316] text-[#F97316]" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-bold text-white leading-tight truncate">
              Kitchen Rush Mode: <span className={shop.isRushMode ? 'text-orange-400' : 'text-slate-400'}>{shop.isRushMode ? 'ON' : 'OFF'}</span>
            </h4>
            <p className="text-[11px] text-[#94A3B8] leading-tight mt-0.5 truncate">
              {shop.isRushMode
                ? `+${shop.rushExtraMinutes || 15}m prep time buffer active`
                : 'Turn ON when counter queue is high'}
            </p>
          </div>
        </div>

        <button
          onClick={() => toggleRushMode(!shop.isRushMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
            shop.isRushMode ? 'bg-[#F97316]' : 'bg-slate-800'
          }`}
          aria-label="Toggle Rush Mode"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              shop.isRushMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Pending Orders Notification Banner */}
      {pendingOrders.length > 0 && (
        <div
          onClick={() => setActiveScreen('orders')}
          className="bg-amber-500/15 border border-amber-500/50 rounded-[16px] p-3 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition shadow-lg gap-2"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-black text-amber-300 truncate">
                  {pendingOrders.length} NEW ORDER{pendingOrders.length > 1 ? 'S' : ''} WAITING
                </p>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-200 font-extrabold flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <BellRing className="w-2.5 h-2.5 animate-bounce" /> ALARM
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80 truncate mt-0.5">Tap to review & accept immediately</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-400 shrink-0 whitespace-nowrap">Review &rarr;</span>
        </div>
      )}

      {/* TODAY'S PERFORMANCE Highlight Orange Card */}
      <div className="bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#D97706] rounded-[20px] p-4 text-white shadow-lg shadow-orange-950/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-black tracking-wider uppercase text-white">
              Today&apos;s Performance
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold text-white shrink-0">
            <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
            <span>Live</span>
          </div>
        </div>

        {/* 2 Inner KPI Boxes - guaranteed uniform height and clean tabular alignment */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-black/25 backdrop-blur-sm rounded-[14px] p-3 flex flex-col justify-between h-20">
            <span className="text-[11px] text-white/80 font-semibold leading-tight truncate">
              Orders Today
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white leading-none tabular-nums">
                {todayOrders.length}
              </span>
              <span className="text-[10px] text-white/75 font-medium whitespace-nowrap">
                ({todayCompletedOrders.length} settled)
              </span>
            </div>
          </div>

          <div className="bg-black/25 backdrop-blur-sm rounded-[14px] p-3 flex flex-col justify-between h-20">
            <span className="text-[11px] text-white/80 font-semibold leading-tight truncate">
              Today&apos;s Revenue
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white leading-none tabular-nums truncate">
                ₹{todayRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-white/75 font-medium whitespace-nowrap">
                settled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customizable Performance Grid Cards (Uniform height h-[96px] to prevent uneven layout) */}
      {gridCardsCount > 0 && (
        <div className={`grid ${gridCardsCount === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5`}>
          {/* Card: Today's Total Sales */}
          {showTodaySales && (
            <div 
              onClick={() => setActiveScreen('sales')}
              className="bg-[#131B2E] border border-[#1E293B] hover:border-[#F97316]/50 rounded-[18px] p-3.5 cursor-pointer transition flex flex-col justify-between h-[96px] active:scale-98"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#94A3B8] font-bold truncate pr-1">Total Sales</span>
                <div className="w-7 h-7 rounded-[10px] bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-white leading-tight truncate tabular-nums">
                  ₹{todayRevenue.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-tight truncate">
                  Completed orders
                </p>
              </div>
            </div>
          )}

          {/* Card: Active Orders Count */}
          {showActiveOrders && (
            <div 
              onClick={() => setActiveScreen('orders')}
              className="bg-[#131B2E] border border-[#1E293B] hover:border-[#F97316]/50 rounded-[18px] p-3.5 cursor-pointer transition flex flex-col justify-between h-[96px] active:scale-98"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#94A3B8] font-bold truncate pr-1">Active Orders</span>
                <div className="w-7 h-7 rounded-[10px] bg-orange-500/15 text-[#F97316] flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4 stroke-[2.2]" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-white leading-tight truncate tabular-nums">
                  {activeOrders.length}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-tight truncate">
                  {pendingOrders.length} pending approval
                </p>
              </div>
            </div>
          )}

          {/* Card: Preparing in Kitchen */}
          {showPreparingOrders && (
            <div 
              onClick={() => setActiveScreen('orders')}
              className="bg-[#131B2E] border border-[#1E293B] hover:border-[#F97316]/50 rounded-[18px] p-3.5 cursor-pointer transition flex flex-col justify-between h-[96px] active:scale-98"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#94A3B8] font-bold truncate pr-1">Kitchen Queue</span>
                <div className="w-7 h-7 rounded-[10px] bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <CookingPot className="w-4 h-4 stroke-[2.2]" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-white leading-tight truncate tabular-nums">
                  {preparingOrders.length}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-tight truncate">
                  {readyOrders.length} ready for pickup
                </p>
              </div>
            </div>
          )}

          {/* Card: Completed Today */}
          {showCompletedOrders && (
            <div 
              onClick={() => setActiveScreen('orders')}
              className="bg-[#131B2E] border border-[#1E293B] hover:border-[#F97316]/50 rounded-[18px] p-3.5 cursor-pointer transition flex flex-col justify-between h-[96px] active:scale-98"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#94A3B8] font-bold truncate pr-1">Completed</span>
                <div className="w-7 h-7 rounded-[10px] bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-white leading-tight truncate tabular-nums">
                  {completedOrders.length}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5 leading-tight truncate">
                  Settled today
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card: Top Selling Items (Customizable) */}
      {showTopSelling && (
        <div className="bg-[#131B2E] border border-[#1E293B] rounded-[20px] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Top Selling Items
              </h3>
            </div>
            <button
              onClick={() => setActiveScreen('sales')}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              <span>Analytics</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {topSellingItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-2 text-center">
              Item ranking appears once orders are completed
            </p>
          ) : (
            <div className="space-y-2">
              {topSellingItems.map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 text-xs font-black flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-purple-400 tabular-nums">{item.count} sold</span>
                    <p className="text-[10px] text-slate-400 tabular-nums">₹{item.revenue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Owner Actions (Customizable, clean 1-line labels) */}
      {showQuickActions && (
        <div className="pt-0.5">
          <h3 className="text-[13px] font-black text-[#F8FAFC] mb-2 px-0.5">
            Quick Actions
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {/* Action 1: Live Orders */}
            <button
              onClick={() => setActiveScreen('orders')}
              className="bg-[#131B2E] border border-[#1E293B] hover:border-[#F97316]/50 rounded-[16px] py-2.5 px-1 flex flex-col items-center justify-center transition group cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 rounded-full bg-orange-500/15 text-[#F97316] flex items-center justify-center mb-1 group-hover:scale-105 transition shrink-0">
                <CookingPot className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-[#F8FAFC] truncate w-full text-center leading-tight">
                Orders
              </span>
            </button>

            {/* Action 2: Manage Menu */}
            <button
              onClick={() => setActiveScreen('menu')}
              className="bg-[#131B2E] border border-[#1E293B] hover:border-blue-500/50 rounded-[16px] py-2.5 px-1 flex flex-col items-center justify-center transition group cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center mb-1 group-hover:scale-105 transition shrink-0">
                <BookOpen className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-[#F8FAFC] truncate w-full text-center leading-tight">
                Menu
              </span>
            </button>

            {/* Action 3: Counter QR */}
            <button
              onClick={() => setActiveScreen('shop_qr')}
              className="bg-[#131B2E] border border-[#1E293B] hover:border-purple-500/50 rounded-[16px] py-2.5 px-1 flex flex-col items-center justify-center transition group cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center mb-1 group-hover:scale-105 transition shrink-0">
                <QrCode className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-[#F8FAFC] truncate w-full text-center leading-tight">
                QR Code
              </span>
            </button>

            {/* Action 4: Analytics */}
            <button
              onClick={() => setActiveScreen('sales')}
              className="bg-[#131B2E] border border-[#1E293B] hover:border-teal-500/50 rounded-[16px] py-2.5 px-1 flex flex-col items-center justify-center transition group cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 rounded-full bg-teal-500/15 text-teal-400 flex items-center justify-center mb-1 group-hover:scale-105 transition shrink-0">
                <BarChart3 className="w-4.5 h-4.5 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-[#F8FAFC] truncate w-full text-center leading-tight">
                Sales
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Orders Section (Customizable) */}
      {showRecentOrders && (
        <div className="pt-0.5">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <h3 className="text-[13px] font-black text-[#F8FAFC]">
              Recent Orders
            </h3>
            <button
              onClick={() => setActiveScreen('orders')}
              className="text-[11px] font-bold text-[#F97316] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-[#131B2E] border border-[#1E293B] rounded-[18px] py-6 px-4 text-center">
              <Inbox className="w-8 h-8 text-[#64748B] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#94A3B8]">No orders yet today</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                New customer orders will appear here in realtime
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="bg-[#131B2E] border border-[#1E293B] hover:border-[#F97316]/50 rounded-[16px] p-3 cursor-pointer transition flex items-center justify-between gap-2 active:scale-98"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{order.orderNumber}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#F97316]/15 text-[#F97316] shrink-0">
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">{order.customerName || 'Walk-in Customer'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-white tabular-nums">₹{order.totalAmount}</p>
                    <p className="text-[10px] text-[#64748B]">{order.items.length} items</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Customize Layout Modal */}
      {showCustomizeModal && (
        <CustomizeLayoutModal
          preferences={dashboardPreferences}
          onSave={updateDashboardLayout}
          onClose={() => setShowCustomizeModal(false)}
        />
      )}
    </div>
  );
};

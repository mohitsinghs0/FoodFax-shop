import React, { useMemo, useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { CustomizeLayoutModal } from '../components/CustomizeLayoutModal';
import { FulfillmentAnalyticsChart } from '../components/FulfillmentAnalyticsChart';
import { 
  Zap, 
  IndianRupee, 
  Receipt, 
  CookingPot, 
  CheckCircle2, 
  BookOpen, 
  QrCode, 
  BarChart3, 
  Inbox, 
  BellRing, 
  Sparkles, 
  ArrowUpRight, 
  Store,
  Activity
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

    const itemMap = new Map<string, { name: string; count: number; revenue: number }>();
    orders.forEach((o) => {
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

  if (!shop) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <Store className="w-12 h-12 text-orange-500 mb-3 animate-pulse" />
        <h3 className="text-base font-bold text-white">Loading Store Dashboard...</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Fetching live orders and kitchen analytics from Supabase
        </p>
      </div>
    );
  }

  const prefs = dashboardPreferences;
  const showTodaySales = prefs.todaySales;
  const showActiveOrders = prefs.activeOrders;
  const showPreparing = prefs.preparingOrders;
  const showCompleted = prefs.completedOrders;
  const showTopSelling = prefs.topSellingItems;
  const showQuickActions = prefs.quickActions;
  const showRecentOrders = prefs.recentOrders;
  const anyKpiVisible = showTodaySales || showActiveOrders || showPreparing || showCompleted;

  return (
    <div className="space-y-4 lg:space-y-6 pb-24 lg:pb-12 p-3.5 lg:p-6 max-w-[440px] lg:max-w-7xl mx-auto select-none">
      
      {/* Rush Hour Emergency Toggle Card */}
      <div className="bg-[#131B2E] border border-[#1E293B] rounded-[20px] p-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              shop.isRushMode ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <Zap className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">
                  Kitchen Rush Mode
                </h4>
                {shop.isRushMode && (
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-[#94A3B8] truncate leading-tight mt-0.5">
                {shop.isRushMode ? '+15m prep delay active' : 'Normal kitchen pacing'}
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleRushMode(!shop.isRushMode, shop.rushExtraMinutes)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all border cursor-pointer active:scale-95 shrink-0 ${
              shop.isRushMode
                ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            {shop.isRushMode ? 'ACTIVE' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Pending Orders Alert Banner */}
      {pendingOrders.length > 0 && (
        <div
          onClick={() => setActiveScreen('orders')}
          className="bg-orange-500/15 border border-orange-500/40 rounded-[20px] p-3.5 flex items-center justify-between cursor-pointer hover:bg-orange-500/20 transition active:scale-98 shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white tracking-wide truncate">
                {pendingOrders.length} New Order{pendingOrders.length > 1 ? 's' : ''} Pending!
              </h4>
              <p className="text-[11px] text-orange-200/90 truncate leading-tight mt-0.5">
                Tap to accept &amp; send to kitchen prep
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-orange-400 bg-orange-500/20 px-2.5 py-1 rounded-full border border-orange-500/30 shrink-0">
            Review
          </span>
        </div>
      )}

      {/* TODAY'S PERFORMANCE (Vibrant Orange Card as requested) */}
      {showTodaySales && (
        <div className="bg-gradient-to-r from-[#F97316] via-[#EA580C] to-[#C2410C] rounded-[24px] p-4 text-white shadow-xl shadow-orange-950/30">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-xs font-black tracking-wider uppercase text-white">
                TODAY&apos;S PERFORMANCE
              </h3>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 shrink-0 backdrop-blur-sm">
              <span className="text-yellow-300">⚡</span>
              <span>Live Supabase</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-black/20 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
              <p className="text-[11px] font-semibold text-white/90">Total Orders Today</p>
              <p className="text-2xl font-black text-white mt-1 tabular-nums">
                {todayOrders.length}
              </p>
              <p className="text-[10px] text-white/80 mt-0.5">
                ({todayCompletedOrders.length} settled)
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
              <p className="text-[11px] font-semibold text-white/90">Today&apos;s Revenue</p>
              <p className="text-2xl font-black text-white mt-1 tabular-nums">
                ₹{todayRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-white/80 mt-0.5">
                settled
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2x2 Performance Grid (Responsive 4-column on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Card 1: Today's Sales */}
        <div
          onClick={() => setActiveScreen('sales')}
          className="bg-[#131B2E] border border-[#1E293B] hover:border-emerald-500/40 rounded-[20px] p-3.5 flex flex-col justify-between h-[102px] cursor-pointer transition active:scale-98 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#94A3B8] truncate">
              Today&apos;s Sales
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-tight truncate tabular-nums">
              ₹{todayRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-[#64748B] mt-0.5 leading-tight truncate">
              From completed orders
            </p>
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div
          onClick={() => setActiveScreen('orders')}
          className="bg-[#131B2E] border border-[#1E293B] hover:border-orange-500/40 rounded-[20px] p-3.5 flex flex-col justify-between h-[102px] cursor-pointer transition active:scale-98 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#94A3B8] truncate">
              Active Orders
            </span>
            <div className="w-7 h-7 rounded-xl bg-orange-500/15 text-[#F97316] flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-tight truncate tabular-nums">
              {activeOrders.length}
            </p>
            <p className="text-[10px] text-[#64748B] mt-0.5 leading-tight truncate">
              {pendingOrders.length} pending acceptance
            </p>
          </div>
        </div>

        {/* Card 3: Preparing in Kitchen */}
        <div
          onClick={() => setActiveScreen('orders')}
          className="bg-[#131B2E] border border-[#1E293B] hover:border-blue-500/40 rounded-[20px] p-3.5 flex flex-col justify-between h-[102px] cursor-pointer transition active:scale-98 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#94A3B8] truncate">
              Preparing in Kitchen
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <CookingPot className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-tight truncate tabular-nums">
              {preparingOrders.length}
            </p>
            <p className="text-[10px] text-[#64748B] mt-0.5 leading-tight truncate">
              {readyOrders.length} ready for pickup
            </p>
          </div>
        </div>

        {/* Card 4: Completed Today */}
        <div
          onClick={() => setActiveScreen('orders')}
          className="bg-[#131B2E] border border-[#1E293B] hover:border-emerald-500/40 rounded-[20px] p-3.5 flex flex-col justify-between h-[102px] cursor-pointer transition active:scale-98 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#94A3B8] truncate">
              Completed Today
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white leading-tight truncate tabular-nums">
              {completedOrders.length}
            </p>
            <p className="text-[10px] text-[#64748B] mt-0.5 leading-tight truncate">
              Full order history
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Layout (Single-column mobile, 2-column wide desktop grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">
        {/* Left Column (2/3 width on desktop): Chart + Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          {/* Average Order Fulfillment Time over Last 7 Days (Recharts) */}
          <FulfillmentAnalyticsChart orders={orders} />

          {/* Recent Orders Section */}
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
                  {orders.slice(0, 4).map((order) => (
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
        </div>

        {/* Right Column (1/3 width on desktop): Top Selling Items + Quick Actions */}
        <div className="space-y-4">
          {/* Top Selling Items (Customizable) */}
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

          {/* Quick Owner Actions */}
          {showQuickActions && (
            <div className="pt-0.5">
              <h3 className="text-[13px] font-black text-[#F8FAFC] mb-2 px-0.5">
                Quick Actions
              </h3>
              <div className="grid grid-cols-4 gap-2">
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
        </div>
      </div>

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

import React, { useMemo } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
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
  AlertCircle
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { shop, orders, toggleRushMode, setActiveScreen, setSelectedOrderId } = useOwnerApp();

  const {
    todayOrders,
    todayCompletedOrders,
    todayRevenue,
    pendingOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    activeOrders,
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

    return {
      todayOrders: tOrders,
      todayCompletedOrders: tCompleted,
      todayRevenue: tRev,
      pendingOrders: pending,
      preparingOrders: preparing,
      readyOrders: ready,
      completedOrders: completed,
      activeOrders: active,
    };
  }, [orders]);

  if (!shop) return null;

  return (
    <div className="space-y-4 px-4 py-4 max-w-md mx-auto select-none">
      {/* Kitchen Rush Mode Card */}
      <div className="bg-[#131B2E] border border-[#23304A] rounded-[18px] p-3.5 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F97316]/15 text-[#F97316] flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-5 h-5 fill-[#F97316] text-[#F97316]" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-white leading-snug">
              Kitchen Rush Mode: {shop.isRushMode ? 'ON' : 'OFF'}
            </h4>
            <p className="text-[11px] text-[#94A3B8] leading-tight mt-0.5 max-w-[210px]">
              Turn ON during heavy rush to add extra prep time to customer estimates
            </p>
          </div>
        </div>

        <button
          onClick={() => toggleRushMode(!shop.isRushMode, 15)}
          className="text-[13px] font-bold text-[#F97316] hover:underline shrink-0 pr-1"
        >
          {shop.isRushMode ? 'Turn OFF' : 'Turn ON'}
        </button>
      </div>

      {/* Pending Orders Notification Pill (if any pending) */}
      {pendingOrders.length > 0 && (
        <div
          onClick={() => setActiveScreen('orders')}
          className="bg-amber-500/15 border-2 border-amber-500 rounded-[14px] p-3 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition animate-pulse"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-amber-300">
                {pendingOrders.length} NEW ORDER{pendingOrders.length > 1 ? 'S' : ''} WAITING!
              </p>
              <p className="text-[11px] text-amber-200/80">Tap to review & accept immediately</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-400">Review &rarr;</span>
        </div>
      )}

      {/* TODAY'S PERFORMANCE Highlight Orange Card */}
      <div className="bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#D97706] rounded-[22px] p-4 text-white shadow-lg shadow-orange-950/20">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-black tracking-wider uppercase text-white">
              Today&apos;s Performance
            </span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">
            <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
            <span>Live</span>
          </div>
        </div>

        {/* 2 Inner KPI Boxes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/20 backdrop-blur-sm rounded-[16px] p-3">
            <span className="text-[11px] text-white/80 font-semibold block leading-tight">
              Total Orders Today
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-2xl font-black text-white leading-none">
                {todayOrders.length}
              </span>
              <span className="text-[10px] text-white/70 font-medium">
                ({todayCompletedOrders.length} settled)
              </span>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-[16px] p-3">
            <span className="text-[11px] text-white/80 font-semibold block leading-tight">
              Today&apos;s Revenue
            </span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-black text-white leading-none">
                ₹{todayRevenue}
              </span>
              <span className="text-[10px] text-white/70 font-medium">
                settled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2x2 Performance Grid Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today's Sales */}
        <div 
          onClick={() => setActiveScreen('sales')}
          className="bg-[#131B2E] border border-[#23304A] rounded-[18px] p-3.5 cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[#94A3B8] font-bold">Today&apos;s Sales</span>
            <div className="w-7 h-7 rounded-[10px] bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl font-black text-white leading-tight">₹{todayRevenue}</p>
          <p className="text-[10px] text-[#94A3B8] mt-1 leading-tight truncate">
            From completed orders
          </p>
        </div>

        {/* Active Orders */}
        <div 
          onClick={() => setActiveScreen('orders')}
          className="bg-[#131B2E] border border-[#23304A] rounded-[18px] p-3.5 cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[#94A3B8] font-bold">Active Orders</span>
            <div className="w-7 h-7 rounded-[10px] bg-orange-500/15 text-[#F97316] flex items-center justify-center">
              <Receipt className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-2xl font-black text-white leading-tight">{activeOrders.length}</p>
          <p className="text-[10px] text-[#94A3B8] mt-1 leading-tight truncate">
            {pendingOrders.length} pending acceptance
          </p>
        </div>

        {/* Preparing in Kitchen */}
        <div 
          onClick={() => setActiveScreen('orders')}
          className="bg-[#131B2E] border border-[#23304A] rounded-[18px] p-3.5 cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[#94A3B8] font-bold truncate">Preparing in Ki...</span>
            <div className="w-7 h-7 rounded-[10px] bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <CookingPot className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-2xl font-black text-white leading-tight">{preparingOrders.length}</p>
          <p className="text-[10px] text-[#94A3B8] mt-1 leading-tight truncate">
            {readyOrders.length} ready for pickup
          </p>
        </div>

        {/* Completed Today */}
        <div 
          onClick={() => setActiveScreen('orders')}
          className="bg-[#131B2E] border border-[#23304A] rounded-[18px] p-3.5 cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[#94A3B8] font-bold truncate">Completed To...</span>
            <div className="w-7 h-7 rounded-[10px] bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-2xl font-black text-white leading-tight">{completedOrders.length}</p>
          <p className="text-[10px] text-[#94A3B8] mt-1 leading-tight truncate">
            Full order history
          </p>
        </div>
      </div>

      {/* Quick Owner Actions */}
      <div className="pt-1">
        <h3 className="text-[15px] font-black text-[#F8FAFC] mb-3">
          Quick Owner Actions
        </h3>
        <div className="grid grid-cols-4 gap-2.5">
          {/* Action 1: Live Orders */}
          <button
            onClick={() => setActiveScreen('orders')}
            className="bg-[#131B2E] border border-[#23304A] hover:border-[#F97316]/50 rounded-[16px] py-3 px-1.5 flex flex-col items-center justify-center transition group"
          >
            <div className="w-10 h-10 rounded-full bg-orange-500/15 text-[#F97316] flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
              <CookingPot className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] font-bold text-[#F8FAFC] truncate w-full text-center">
              Live Orders
            </span>
          </button>

          {/* Action 2: Manage Menu */}
          <button
            onClick={() => setActiveScreen('menu')}
            className="bg-[#131B2E] border border-[#23304A] hover:border-blue-500/50 rounded-[16px] py-3 px-1.5 flex flex-col items-center justify-center transition group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
              <BookOpen className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] font-bold text-[#F8FAFC] truncate w-full text-center">
              Menu
            </span>
          </button>

          {/* Action 3: Counter QR */}
          <button
            onClick={() => setActiveScreen('shop_qr')}
            className="bg-[#131B2E] border border-[#23304A] hover:border-purple-500/50 rounded-[16px] py-3 px-1.5 flex flex-col items-center justify-center transition group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
              <QrCode className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] font-bold text-[#F8FAFC] truncate w-full text-center">
              Shop QR
            </span>
          </button>

          {/* Action 4: Analytics */}
          <button
            onClick={() => setActiveScreen('sales')}
            className="bg-[#131B2E] border border-[#23304A] hover:border-teal-500/50 rounded-[16px] py-3 px-1.5 flex flex-col items-center justify-center transition group"
          >
            <div className="w-10 h-10 rounded-full bg-teal-500/15 text-teal-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
              <BarChart3 className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10px] font-bold text-[#F8FAFC] truncate w-full text-center">
              Analytics
            </span>
          </button>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[15px] font-black text-[#F8FAFC]">
            Recent Orders
          </h3>
          <button
            onClick={() => setActiveScreen('orders')}
            className="text-[12px] font-bold text-[#F97316] hover:underline"
          >
            View All
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-[#131B2E] border border-[#23304A] rounded-[18px] py-8 px-4 text-center">
            <Inbox className="w-10 h-10 text-[#64748B] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#94A3B8]">No orders yet today</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              New customer orders will chime here in realtime
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="bg-[#131B2E] border border-[#23304A] hover:border-[#F97316]/50 rounded-[16px] p-3.5 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{order.orderNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#F97316]/15 text-[#F97316]">
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-1">{order.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">₹{order.totalAmount}</p>
                  <p className="text-[10px] text-[#64748B]">{order.items.length} items</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

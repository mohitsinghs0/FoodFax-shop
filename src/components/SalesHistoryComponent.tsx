import React, { useState, useMemo } from 'react';
import { OwnerOrder } from '../types';
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  FileDown, 
  UtensilsCrossed, 
  Bike, 
  Calendar, 
  ArrowUpRight,
  TrendingUp,
  Receipt,
  User,
  Phone,
  Filter
} from 'lucide-react';

interface SalesHistoryComponentProps {
  orders: OwnerOrder[];
  totalRevenue: number;
  dateRangeLabel?: string;
  onSelectOrder?: (orderId: string) => void;
  onExportPdf?: () => void;
}

export const SalesHistoryComponent: React.FC<SalesHistoryComponentProps> = ({
  orders,
  totalRevenue,
  dateRangeLabel,
  onSelectOrder,
  onExportPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'upi' | 'cash'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dine_in' | 'takeaway' | 'delivery'>('all');

  // Filter completed past orders only
  const completedOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'completed');
  }, [orders]);

  // Apply search query and filter tabs
  const filteredList = useMemo(() => {
    return completedOrders.filter((order) => {
      // Payment filter
      if (paymentFilter === 'upi' && order.paymentMethod !== 'upi') return false;
      if (paymentFilter === 'cash' && order.paymentMethod !== 'cash') return false;

      // Type filter
      if (typeFilter !== 'all' && order.orderType !== typeFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNumber = order.orderNumber.toLowerCase().includes(query);
        const matchesCustomer = order.customerName?.toLowerCase().includes(query) || false;
        const matchesTable = order.tableNumber?.toLowerCase().includes(query) || false;
        const matchesItems = order.items.some((it) => it.name.toLowerCase().includes(query));
        return matchesNumber || matchesCustomer || matchesTable || matchesItems;
      }

      return true;
    });
  }, [completedOrders, paymentFilter, typeFilter, searchQuery]);

  // Revenue of currently filtered subset
  const filteredRevenue = useMemo(() => {
    return filteredList.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [filteredList]);

  // Format completion timestamp
  const formatCompletionTime = (order: OwnerOrder) => {
    // Prefer updatedAt (when status was transitioned to 'completed') or fallback to createdAt
    const dateToUse = order.updatedAt || order.createdAt;
    const dateObj = new Date(dateToUse);

    const timeStr = dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const dateStr = dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return { timeStr, dateStr, fullStr: `${timeStr} • ${dateStr}` };
  };

  return (
    <div className="bg-[#131B2E] border border-[#23304A] rounded-[24px] p-4 sm:p-5 space-y-4 shadow-sm select-none">
      {/* Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#23304A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-[#F97316] flex items-center justify-center border border-orange-500/20">
              <Receipt className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                Sales &amp; Completion History
              </h3>
              <p className="text-[11px] text-slate-400">
                Detailed timeline of fulfilled orders with timestamps &amp; revenue
              </p>
            </div>
          </div>
        </div>

        {/* Export Button & Date Range Badge */}
        <div className="flex items-center gap-2">
          {dateRangeLabel && (
            <span className="text-[11px] font-bold text-slate-300 bg-[#0B0F19] border border-[#23304A] px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              <span>{dateRangeLabel}</span>
            </span>
          )}

          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-950/40 active:scale-95 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#0B0F19] border border-[#23304A] rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Settled Revenue
          </span>
          <span className="text-lg font-black text-orange-400 mt-0.5 block tabular-nums">
            ₹{filteredRevenue.toLocaleString()}
          </span>
        </div>

        <div className="bg-[#0B0F19] border border-[#23304A] rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Completed Orders
          </span>
          <span className="text-lg font-black text-white mt-0.5 block tabular-nums">
            {filteredList.length}
          </span>
        </div>

        <div className="bg-[#0B0F19] border border-[#23304A] rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Average Ticket
          </span>
          <span className="text-lg font-black text-emerald-400 mt-0.5 block tabular-nums">
            ₹{filteredList.length > 0 ? Math.round(filteredRevenue / filteredList.length) : 0}
          </span>
        </div>

        <div className="bg-[#0B0F19] border border-[#23304A] rounded-xl p-3">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Fulfillment Rate
          </span>
          <span className="text-lg font-black text-sky-400 mt-0.5 block tabular-nums">
            {orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 100}%
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer, table, or dish..."
            className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-orange-500 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none font-medium transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Payment Method Pills */}
          <button
            onClick={() => setPaymentFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border ${
              paymentFilter === 'all'
                ? 'bg-orange-500/15 text-orange-400 border-orange-500/40'
                : 'bg-[#0B0F19] text-slate-400 border-[#23304A] hover:text-white'
            }`}
          >
            All Payments
          </button>
          <button
            onClick={() => setPaymentFilter('upi')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border flex items-center gap-1 ${
              paymentFilter === 'upi'
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/40'
                : 'bg-[#0B0F19] text-slate-400 border-[#23304A] hover:text-white'
            }`}
          >
            <CreditCard className="w-3 h-3" />
            <span>UPI Paid</span>
          </button>
          <button
            onClick={() => setPaymentFilter('cash')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border flex items-center gap-1 ${
              paymentFilter === 'cash'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-[#0B0F19] text-slate-400 border-[#23304A] hover:text-white'
            }`}
          >
            <Banknote className="w-3 h-3" />
            <span>Cash / COD</span>
          </button>

          <span className="text-slate-600 px-1">|</span>

          {/* Type Filter Pills */}
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border ${
              typeFilter === 'all'
                ? 'bg-slate-700/60 text-white border-slate-600'
                : 'bg-[#0B0F19] text-slate-400 border-[#23304A] hover:text-white'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setTypeFilter('dine_in')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border flex items-center gap-1 ${
              typeFilter === 'dine_in'
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/40'
                : 'bg-[#0B0F19] text-slate-400 border-[#23304A] hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-3 h-3" />
            <span>Dine-In</span>
          </button>
          <button
            onClick={() => setTypeFilter('takeaway')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border flex items-center gap-1 ${
              typeFilter === 'takeaway'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                : 'bg-[#0B0F19] text-slate-400 border-[#23304A] hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Takeaway</span>
          </button>
          <button
            onClick={() => setTypeFilter('delivery')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer border flex items-center gap-1 ${
              typeFilter === 'delivery'
                ? 'bg-purple-500/15 text-purple-400 border-purple-500/40'
                : 'bg-[#0B0F19] text-slate-400 border-[#23304A] hover:text-white'
            }`}
          >
            <Bike className="w-3 h-3" />
            <span>Delivery</span>
          </button>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center bg-[#0B0F19] border border-[#23304A] rounded-2xl text-xs text-slate-400 space-y-2">
            <ShoppingBag className="w-9 h-9 text-slate-600 mx-auto" />
            <p className="font-bold text-white text-sm">No sales records found</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              {searchQuery || paymentFilter !== 'all' || typeFilter !== 'all'
                ? 'No past orders matched the active filter criteria. Try resetting your search or filter.'
                : 'There are no completed orders recorded for the selected period.'}
            </p>
          </div>
        ) : (
          filteredList.map((order) => {
            const timeInfo = formatCompletionTime(order);
            const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder?.(order.id)}
                className="p-3.5 rounded-2xl bg-[#0B0F19] border border-[#23304A] hover:border-slate-700 hover:bg-[#0e1424] transition-all cursor-pointer space-y-2 group"
              >
                {/* Top Row: Order #, Status & Revenue */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-black text-sm text-white group-hover:text-orange-400 transition">
                      {order.orderNumber}
                    </span>

                    {/* Order Type Badge with Table Label */}
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      order.orderType === 'dine_in'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : order.orderType === 'takeaway'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      {order.orderType === 'dine_in' && <UtensilsCrossed className="w-2.5 h-2.5" />}
                      {order.orderType === 'takeaway' && <ShoppingBag className="w-2.5 h-2.5" />}
                      {order.orderType === 'delivery' && <Bike className="w-2.5 h-2.5" />}
                      <span>
                        {order.orderType === 'dine_in'
                          ? order.tableNumber ? `Table ${order.tableNumber}` : 'Dine-In'
                          : order.orderType}
                      </span>
                    </span>

                    {/* Payment Badge */}
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>{order.paymentMethod.toUpperCase()} PAID</span>
                    </span>
                  </div>

                  {/* Revenue Amount */}
                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-orange-400 tabular-nums">
                      ₹{order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Middle Row: Items summary list */}
                <div className="text-xs text-slate-300">
                  <p className="line-clamp-1 leading-snug">
                    {order.items.map((item, idx) => (
                      <span key={idx}>
                        <span className="font-bold text-white">{item.quantity}x</span> {item.name}
                        {idx < order.items.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                </div>

                {/* Bottom Row: Completion Timestamp & Customer/Items count */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-[#1a253e]">
                  {/* Completion Timestamp */}
                  <div className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Completed at {timeInfo.fullStr}</span>
                  </div>

                  {/* Customer or Items count */}
                  <div className="flex items-center gap-2">
                    {order.customerName && (
                      <span className="text-slate-400 flex items-center gap-1 truncate max-w-[120px]">
                        <User className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{order.customerName}</span>
                      </span>
                    )}
                    <span className="text-slate-500 font-mono">
                      {totalItemsCount} item{totalItemsCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer count indicator */}
      {filteredList.length > 0 && (
        <div className="text-center pt-2 border-t border-[#23304A]">
          <span className="text-[11px] text-slate-400 font-medium">
            Showing {filteredList.length} of {completedOrders.length} settled orders in selected range
          </span>
        </div>
      )}
    </div>
  );
};

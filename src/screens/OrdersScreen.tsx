import React, { useState, useMemo } from 'react';
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
  Timer
} from 'lucide-react';
import { OrderStatus } from '../types';

export const OrdersScreen: React.FC = () => {
  const { 
    orders, 
    updateOrderStatus, 
    setSelectedOrderId, 
    setActiveScreen 
  } = useOwnerApp();

  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Status tabs matching Flutter screen
  const statusTabs = [
    { id: 'all', label: 'All Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready', label: 'Ready' },
  ];

  // Active non-finalized orders
  const activeOrders = useMemo(() => {
    return orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
  }, [orders]);

  // History orders (completed or cancelled)
  const historyOrders = useMemo(() => {
    return orders.filter((o) => ['completed', 'cancelled'].includes(o.status));
  }, [orders]);

  // Filtered orders based on search & tab
  const displayedOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const source = viewMode === 'active' ? activeOrders : historyOrders;

    return source.filter((o) => {
      if (viewMode === 'active' && activeTab !== 'all' && o.status !== activeTab) {
        return false;
      }
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    });
  }, [viewMode, activeOrders, historyOrders, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] pb-20 select-none">
      {/* Top App Bar matching Photo 2 */}
      <div className="px-4 py-3.5 border-b border-[#131B2E] flex items-center gap-3 sticky top-0 bg-[#0B0F19] z-20">
        <button
          onClick={() => setActiveScreen('dashboard')}
          className="p-1 -ml-1 text-white hover:text-[#F97316] transition"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <h2 className="text-[17px] font-black tracking-tight text-white">
          Orders Management
        </h2>
      </div>

      <div className="px-4 py-3 space-y-3.5 max-w-md mx-auto">
        {/* Segmented Top Toggle: Active Orders vs Order History */}
        <div className="bg-[#131B2E] border border-[#23304A] rounded-[14px] p-1 grid grid-cols-2">
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
          <div className="space-y-3 pt-1">
            {displayedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-[#131B2E] border border-[#23304A] rounded-[18px] p-4 shadow-sm"
              >
                {/* Header: Order #, Customer & Status */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
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
                    </div>
                    <p className="text-xs text-[#94A3B8] font-medium mt-0.5">
                      {order.customerName} &bull; {order.customerPhone}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-white">₹{order.totalAmount}</p>
                    <p className="text-[10px] text-[#94A3B8] font-medium">{order.paymentMethod}</p>
                  </div>
                </div>

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
                        onClick={() => updateOrderStatus(order.id, 'accepted')}
                        className="flex-1 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled', 'Busy')}
                        className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {order.status === 'accepted' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                    >
                      Start Cooking
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                    >
                      Mark as Ready
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                    >
                      Handover & Complete
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOrderId(order.id)}
                    className="p-2 rounded-xl bg-[#0B0F19] text-[#94A3B8] hover:text-white"
                    title="View details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

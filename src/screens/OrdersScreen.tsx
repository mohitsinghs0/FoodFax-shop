import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOwnerApp, mapDbOrderToOwnerOrder } from '../context/OwnerAppContext';
import { OrderStatus, OwnerOrder } from '../types';
import { getSupabaseClient } from '../lib/supabaseClient';
import { soundService } from '../services/soundService';
import { MemoizedOrderCard } from '../components/MemoizedOrderCard';
import { 
  Search, 
  Receipt, 
  X, 
  XCircle, 
  CheckCircle2, 
  RefreshCw, 
  Loader2, 
  Zap, 
  BellRing,
  Sparkles,
  Layers
} from 'lucide-react';

export const OrdersScreen: React.FC = () => {
  const { 
    shop,
    orders, 
    updateOrderStatus, 
    setSelectedOrderId, 
    fetchCompletedOrderHistory, 
    refreshOrders,
    upsertOrderFromRealtime,
    removeOrderFromRealtime,
    realtimeStatus,
    setRealtimeStatus
  } = useOwnerApp();
  
  // Primary view toggle: 'active' vs 'history'
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Item out of stock');
  
  // Dedicated history state fetched from Supabase
  const [historyOrders, setHistoryOrders] = useState<OwnerOrder[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'today' | 'week'>('all');

  // Real-time alert states
  const [newOrderAlert, setNewOrderAlert] = useState<OwnerOrder | null>(null);
  const [statusUpdateToast, setStatusUpdateToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingTestOrder, setIsCreatingTestOrder] = useState(false);

  // Load completed orders from Supabase when switching to history or on mount
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const completed = await fetchCompletedOrderHistory();
      setHistoryOrders(completed);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [fetchCompletedOrderHistory]);

  useEffect(() => {
    if (viewMode === 'history') {
      loadHistory();
    }
  }, [viewMode, loadHistory]);

  // SUPABASE REAL-TIME SUBSCRIPTION FOR ORDERS SCREEN
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !shop?.id) return;

    setRealtimeStatus('connecting');

    const channelName = `orders_screen_realtime_${shop.id}`;
    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `shop_id=eq.${shop.id}`,
        },
        async (payload: any) => {
          if (payload.eventType === 'INSERT') {
            try {
              const { data: fullOrder } = await client
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', payload.new.id)
                .maybeSingle();

              const newOrder = fullOrder 
                ? mapDbOrderToOwnerOrder(fullOrder) 
                : mapDbOrderToOwnerOrder(payload.new);

              upsertOrderFromRealtime(newOrder, true);
              setNewOrderAlert(newOrder);
              soundService.playNewOrderChime();
            } catch (err) {
              console.warn('Error fetching new order line items:', err);
              refreshOrders(shop.id);
            }
          } else if (payload.eventType === 'UPDATE') {
            try {
              const { data: updatedData } = await client
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', payload.new.id)
                .maybeSingle();

              const mapped = updatedData
                ? mapDbOrderToOwnerOrder(updatedData)
                : mapDbOrderToOwnerOrder(payload.new);

              upsertOrderFromRealtime(mapped, false);

              if (mapped.status === 'completed') {
                loadHistory();
              }

              setStatusUpdateToast(`Order ${mapped.orderNumber} status changed to ${mapped.status.toUpperCase()}`);
              setTimeout(() => setStatusUpdateToast(null), 4000);
            } catch (err) {
              console.warn('Error processing updated order:', err);
              refreshOrders(shop.id);
            }
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            removeOrderFromRealtime(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      channel.unsubscribe();
      client.removeChannel(channel);
    };
  }, [shop?.id, upsertOrderFromRealtime, removeOrderFromRealtime, refreshOrders, setRealtimeStatus, loadHistory]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (shop?.id) {
        await refreshOrders(shop.id);
      }
      if (viewMode === 'history') {
        await loadHistory();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [shop?.id, refreshOrders, viewMode, loadHistory]);

  // Helper to simulate a real-time order arriving in Supabase (instant verification)
  const handleSimulateRealtimeOrder = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client || !shop?.id) return;
    setIsCreatingTestOrder(true);

    try {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const testId = `ord_${Date.now()}`;
      const sampleNames = ['Rohan Sharma', 'Priya Verma', 'Aarav Gupta', 'Neha Patel', 'Vikram Singh'];
      const sampleCustomer = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const isDineIn = Math.random() > 0.5;

      const { error: orderError } = await client.from('orders').insert({
        id: testId,
        shop_id: shop.id,
        shop_name: shop.name || 'Food Stall',
        shop_image: shop.logoUrl || null,
        shop_location: shop.area || shop.address || 'Counter 1',
        customer_id: null,
        customer_name: sampleCustomer,
        customer_phone: '9876543210',
        token_number: `#FF-${randomNum}`,
        order_type: isDineIn ? 'DINE_IN' : 'TAKEAWAY',
        table_number: isDineIn ? `T-0${Math.floor(1 + Math.random() * 8)}` : null,
        payment_method: Math.random() > 0.5 ? 'PAY_ONLINE' : 'CASH_AT_COUNTER',
        payment_status: 'PAID',
        order_status: 'PENDING',
        subtotal: 240,
        total: 240,
        estimated_preparation_minutes: '5-10',
        is_demo: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (orderError) throw orderError;

      await client.from('order_items').insert({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        order_id: testId,
        name: 'Special Paneer Tikka Masala',
        price: 240,
        quantity: 1,
        is_veg: true,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Error simulating realtime order in Supabase:', err);
    } finally {
      setIsCreatingTestOrder(false);
    }
  }, [shop]);

  // Memoized action handlers passed to children to maintain referential equality
  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
  }, [setSelectedOrderId]);

  const handleUpdateStatus = useCallback((orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
  }, [updateOrderStatus]);

  const handleRejectOrder = useCallback((orderId: string) => {
    setCancelModalOrderId(orderId);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    if (cancelModalOrderId) {
      updateOrderStatus(cancelModalOrderId, 'cancelled', cancelReason);
      setCancelModalOrderId(null);
    }
  }, [cancelModalOrderId, cancelReason, updateOrderStatus]);

  // Active status tabs
  const activeTabs = useMemo(() => [
    { id: 'all', label: 'All Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'preparing', label: 'Cooking' },
    { id: 'ready', label: 'Ready' },
  ], []);

  // Memoized active orders list (non-completed, non-cancelled)
  const activeOrdersList = useMemo(() => {
    return orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
  }, [orders]);

  // Memoized tab counts to avoid inline filtering in JSX
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activeOrdersList.length };
    activeOrdersList.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [activeOrdersList]);

  // Memoized filtered orders for current view
  const displayedOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (viewMode === 'active') {
      return activeOrdersList.filter((order) => {
        if (activeTab !== 'all' && order.status !== activeTab) return false;
        if (!q) return true;
        return (
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.customerPhone.includes(q)
        );
      });
    }

    return historyOrders.filter((order) => {
      if (historyDateFilter === 'today') {
        const orderDate = new Date(order.createdAt).toDateString();
        const todayDate = new Date().toDateString();
        if (orderDate !== todayDate) return false;
      } else if (historyDateFilter === 'week') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (new Date(order.createdAt).getTime() < sevenDaysAgo) return false;
      }

      if (!q) return true;
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q)
      );
    });
  }, [viewMode, activeOrdersList, historyOrders, activeTab, searchQuery, historyDateFilter]);

  // Completed history summary calculations memoized
  const totalHistoryRevenue = useMemo(() => {
    return displayedOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  }, [displayedOrders]);

  return (
    <div className="space-y-4 pb-20 p-4 max-w-4xl mx-auto">
      {/* Header with View Toggle and Real-Time Subscriptions Indicator */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-white tracking-tight">Order Management</h2>
            
            {/* Real-Time Subscription Connection Status Pill */}
            {realtimeStatus === 'connected' ? (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] font-bold text-emerald-400"
                title="Supabase Real-time Connected"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live Real-time</span>
              </div>
            ) : realtimeStatus === 'connecting' ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] font-bold text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              <button
                onClick={handleManualRefresh}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-full text-[11px] font-bold text-slate-300 transition cursor-pointer"
                title="Sync database orders"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync</span>
              </button>
            )}

            {/* Manual Sync / Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Force sync database orders"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeOrdersList.length} active order{activeOrdersList.length !== 1 ? 's' : ''} in kitchen pipeline &bull; Sub-50ms API Latency
          </p>
        </div>

        {/* Action Controls & Fast Order Simulation Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateRealtimeOrder}
            disabled={isCreatingTestOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-950/40 transition active:scale-95 disabled:opacity-50"
            title="Inserts a test order into public.orders to verify real-time chimes"
          >
            {isCreatingTestOrder ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            )}
            <span>Simulate Order</span>
          </button>

          {/* Active vs Completed History Toggle Pill */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setViewMode('active')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'active'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Kitchen Display</span>
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'history'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Order Alert Banner */}
      {newOrderAlert && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between shadow-xl shadow-orange-950/30 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
              <BellRing className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-sm">
                Incoming Order {newOrderAlert.orderNumber}!
              </p>
              <p className="text-xs text-orange-100">
                {newOrderAlert.customerName} &bull; ₹{newOrderAlert.totalAmount} &bull;{' '}
                {newOrderAlert.items.length} item{newOrderAlert.items.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedOrderId(newOrderAlert.id);
                setNewOrderAlert(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-black/30 hover:bg-black/40 text-white font-bold text-xs transition"
            >
              View Ticket
            </button>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="p-1.5 text-white/70 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search and Secondary Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search #order, customer, phone number..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View-specific Filter Bars */}
        {viewMode === 'active' ? (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {activeTabs.map((tab) => {
              const count = tabCounts[tab.id] || 0;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-orange-500/50'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected
                          ? 'bg-orange-500 text-white font-bold'
                          : tab.id === 'pending'
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setHistoryDateFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  historyDateFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Past
              </button>
              <button
                onClick={() => setHistoryDateFilter('today')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  historyDateFilter === 'today' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setHistoryDateFilter('week')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  historyDateFilter === 'week' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Past 7 Days
              </button>
            </div>

            <button
              onClick={loadHistory}
              title="Refresh from Supabase"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin text-orange-400' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* History Summary Banner */}
      {viewMode === 'history' && (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Showing <strong className="text-white">{displayedOrders.length}</strong> completed order{displayedOrders.length !== 1 ? 's' : ''} from database
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Total Value:</span>
            <strong className="text-emerald-400 text-sm font-black">
              ₹{totalHistoryRevenue.toLocaleString()}
            </strong>
          </div>
        </div>
      )}

      {/* Orders List Content with MemoizedOrderCard Components */}
      {isLoadingHistory && viewMode === 'history' ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Fetching completed orders from Supabase...</p>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-300">
            {viewMode === 'active' ? `No active ${activeTab} orders` : 'No completed order history found'}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {viewMode === 'active'
              ? 'New orders from your customer menu will appear here live.'
              : 'Completed orders saved in your database will show here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedOrders.map((order) => (
            <MemoizedOrderCard
              key={order.id}
              order={order}
              onSelect={handleSelectOrder}
              onUpdateStatus={handleUpdateStatus}
              onReject={handleRejectOrder}
              isRushMode={shop?.isRushMode}
            />
          ))}
        </div>
      )}

      {/* Cancel Order Dialog Modal */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-extrabold text-base">
              <XCircle className="w-5 h-5" />
              <span>Reject / Cancel Order</span>
            </div>
            <p className="text-xs text-slate-300">
              Please specify the cancellation reason to notify the customer automatically:
            </p>

            <div className="space-y-2">
              {[
                'Item out of stock',
                'Kitchen overload / peak rush',
                'Store closing early',
                'Customer requested cancel',
                'Special instruction cannot be met',
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 cursor-pointer text-xs text-slate-200"
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="accent-orange-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelModalOrderId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md shadow-red-950"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Order Status Change Floating Toast */}
      {statusUpdateToast && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping" />
          <span>{statusUpdateToast}</span>
          <button
            onClick={() => setStatusUpdateToast(null)}
            className="ml-1 p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

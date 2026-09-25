import React, { memo } from 'react';
import { OwnerOrder, OrderStatus } from '../types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  CookingPot,
  BellRing,
  Phone,
  Store,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface MemoizedOrderCardProps {
  order: OwnerOrder;
  onSelect: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onReject: (orderId: string) => void;
  isRushMode?: boolean;
}

const areOrderPropsEqual = (
  prevProps: MemoizedOrderCardProps,
  nextProps: MemoizedOrderCardProps
): boolean => {
  return (
    prevProps.order.id === nextProps.order.id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.order.paymentStatus === nextProps.order.paymentStatus &&
    prevProps.order.totalAmount === nextProps.order.totalAmount &&
    prevProps.order.updatedAt === nextProps.order.updatedAt &&
    prevProps.isRushMode === nextProps.isRushMode &&
    prevProps.order.cancellationReason === nextProps.order.cancellationReason
  );
};

export const MemoizedOrderCard = memo<MemoizedOrderCardProps>(
  ({ order, onSelect, onUpdateStatus, onReject, isRushMode }) => {
    const formattedTime = new Date(order.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const isPending = order.status === 'pending';
    const isAccepted = order.status === 'accepted';
    const isPreparing = order.status === 'preparing';
    const isReady = order.status === 'ready';
    const isCompleted = order.status === 'completed';
    const isCancelled = order.status === 'cancelled';

    return (
      <div
        className={`rounded-2xl border p-4 transition-all duration-200 ${
          isPending
            ? 'bg-orange-950/20 border-orange-500/40 shadow-lg shadow-orange-950/20 animate-pulse-border'
            : isPreparing
            ? 'bg-blue-950/20 border-blue-500/30'
            : isReady
            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-950/10'
            : isCompleted
            ? 'bg-slate-900/60 border-slate-800 opacity-90'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Header: Token, Customer, Order Type & Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-wider uppercase ${
                isPending
                  ? 'bg-orange-500 text-white animate-bounce'
                  : isPreparing
                  ? 'bg-blue-500 text-white'
                  : isReady
                  ? 'bg-emerald-500 text-white'
                  : isCompleted
                  ? 'bg-slate-700 text-slate-200'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {order.orderNumber}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white">{order.customerName}</span>
                {order.customerPhone && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                    <Phone className="w-2.5 h-2.5" />
                    {order.customerPhone.slice(-4)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {formattedTime}
                </span>
                <span>•</span>
                <span className="capitalize font-medium text-slate-300">
                  {order.orderType === 'dine_in' ? `Table ${order.tableNumber || '-'}` : 'Takeaway'}
                </span>
                {isRushMode && (
                  <span className="inline-flex items-center gap-0.5 text-amber-400 font-semibold text-[10px]">
                    <Sparkles className="w-2.5 h-2.5" /> Rush +15m
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-base font-extrabold text-white">₹{order.totalAmount}</div>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                order.paymentStatus === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {order.paymentStatus === 'paid' ? 'PAID' : 'COD / DUE'}
            </span>
          </div>
        </div>

        {/* Order Items Breakdown */}
        <div className="bg-slate-950/60 rounded-xl p-2.5 space-y-1.5 border border-slate-800/80 mb-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3.5 h-3.5 flex items-center justify-center rounded-sm text-[8px] font-bold border ${
                    item.isVeg
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-red-500 text-red-400'
                  }`}
                >
                  ●
                </span>
                <span className="text-slate-200 font-medium">
                  {item.quantity} × {item.name}
                </span>
                {item.notes && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 italic">
                    "{item.notes}"
                  </span>
                )}
              </div>
              <span className="text-slate-400 font-semibold">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Cancellation Reason if cancelled */}
        {order.cancellationReason && (
          <div className="mb-3 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
            <span>Reason: {order.cancellationReason}</span>
          </div>
        )}

        {/* Action Controls & KDS State Transitions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelect(order.id)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition flex items-center gap-1"
            >
              <span>Ticket</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            {!isCompleted && !isCancelled && (
              <button
                onClick={() => onReject(order.id)}
                className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition"
              >
                Reject
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isPending && (
              <button
                onClick={() => onUpdateStatus(order.id, 'accepted')}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-orange-950 transition flex items-center gap-1"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Accept</span>
              </button>
            )}

            {isAccepted && (
              <button
                onClick={() => onUpdateStatus(order.id, 'preparing')}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950 transition"
              >
                <CookingPot className="w-3.5 h-3.5" />
                <span>Kitchen</span>
              </button>
            )}

            {isPreparing && (
              <button
                onClick={() => onUpdateStatus(order.id, 'ready')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready</span>
              </button>
            )}

            {isReady && (
              <button
                onClick={() => onUpdateStatus(order.id, 'completed')}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-teal-950 transition flex items-center gap-1.5"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Handover</span>
              </button>
            )}

            {isCompleted && (
              <span className="text-xs font-semibold text-teal-400 flex items-center gap-1 px-2 py-1 bg-teal-500/10 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Settled</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
  areOrderPropsEqual
);

MemoizedOrderCard.displayName = 'MemoizedOrderCard';

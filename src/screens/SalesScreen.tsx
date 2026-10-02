import React, { useState, useMemo } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { generateSalesSummaryPdf } from '../services/pdfReportService';
import { SalesHistoryComponent } from '../components/SalesHistoryComponent';
import { 
  TrendingUp, 
  CreditCard, 
  Banknote, 
  Calendar as CalendarIcon, 
  FileDown, 
  CheckCircle2, 
  ShoppingBag, 
  Clock, 
  ArrowUpRight,
  ArrowLeft,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

type PresetFilter = 'today' | 'yesterday' | 'last_4_days' | 'last_7_days' | 'custom';

export const SalesScreen: React.FC = () => {
  const { orders, shop, setActiveScreen } = useOwnerApp();

  // Selected date range state: 'YYYY-MM-DD' strings
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [startDateStr, setStartDateStr] = useState<string>(getTodayStr());
  const [endDateStr, setEndDateStr] = useState<string>(getTodayStr());
  const [activePreset, setActivePreset] = useState<PresetFilter>('today');
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Helper to adjust presets
  const applyPreset = (preset: PresetFilter) => {
    setActivePreset(preset);
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDateStr(todayISO);
      setEndDateStr(todayISO);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(today.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDateStr(yStr);
      setEndDateStr(yStr);
    } else if (preset === 'last_4_days') {
      // 1 to 4 days range
      const past = new Date();
      past.setDate(today.getDate() - 3);
      setStartDateStr(past.toISOString().split('T')[0]);
      setEndDateStr(todayISO);
    } else if (preset === 'last_7_days') {
      const past = new Date();
      past.setDate(today.getDate() - 6);
      setStartDateStr(past.toISOString().split('T')[0]);
      setEndDateStr(todayISO);
    }
  };

  // Filter orders strictly based on selected calendar start and end date
  const filteredOrders = useMemo(() => {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, startDateStr, endDateStr]);

  // Aggregated analytics metrics
  const completedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'completed'),
    [filteredOrders]
  );
  const cancelledOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'cancelled'),
    [filteredOrders]
  );

  const totalRevenue = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    [completedOrders]
  );

  const upiOrders = useMemo(
    () => completedOrders.filter((o) => o.paymentMethod === 'upi'),
    [completedOrders]
  );
  const cashOrders = useMemo(
    () => completedOrders.filter((o) => o.paymentMethod === 'cash'),
    [completedOrders]
  );

  const upiRevenue = useMemo(
    () => upiOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    [upiOrders]
  );
  const cashRevenue = useMemo(
    () => cashOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    [cashOrders]
  );

  const aov = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  // Most popular items sold in this period
  const itemCounts = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    completedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const existing = map.get(item.name) || { name: item.name, count: 0, revenue: 0 };
        existing.count += item.quantity;
        existing.revenue += item.price * item.quantity;
        map.set(item.name, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [completedOrders]);

  // Date Range Human Label
  const dateRangeLabel = useMemo(() => {
    if (startDateStr === endDateStr) {
      const d = new Date(startDateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const d1 = new Date(startDateStr);
    const d2 = new Date(endDateStr);
    return `${d1.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${d2.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }, [startDateStr, endDateStr]);

  // Calculate day difference
  const rangeDayCount = useMemo(() => {
    const d1 = new Date(startDateStr);
    const d2 = new Date(endDateStr);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [startDateStr, endDateStr]);

  // Handle PDF Export
  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    try {
      generateSalesSummaryPdf({
        shop,
        orders: completedOrders,
        dateRangeLabel: `${dateRangeLabel} (${rangeDayCount} Day${rangeDayCount > 1 ? 's' : ''})`,
        startDate: startDateStr,
        endDate: endDateStr,
        totalRevenue,
        totalOrders: filteredOrders.length,
        completedOrdersCount: completedOrders.length,
        cancelledOrdersCount: cancelledOrders.length,
        upiAmount: upiRevenue,
        cashAmount: cashRevenue,
        upiOrdersCount: upiOrders.length,
        cashOrdersCount: cashOrders.length,
        averageOrderValue: aov,
      });
    } catch (err) {
      console.error('Failed to generate sales PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-24 lg:pb-12 p-3.5 lg:p-8 max-w-[440px] lg:max-w-7xl mx-auto select-none">
      {/* Page Header with Direct PDF Download Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveScreen('dashboard')}
              className="p-1 -ml-1 text-white hover:text-[#F97316] transition cursor-pointer lg:hidden"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h2 className="text-lg lg:text-xl font-black text-white tracking-tight truncate">Sales &amp; Analytics</h2>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-[10px] font-black uppercase tracking-wider border border-orange-500/30 shrink-0">
              Live POS
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Real-time revenue reports, payment settlements &amp; sales
          </p>
        </div>

        {/* PDF Download Button */}
        <button
          onClick={handleDownloadPdf}
          disabled={isExportingPdf}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-orange-950/40 transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          title="Download sales summary in PDF format"
        >
          <FileDown className="w-4 h-4 stroke-[2.2]" />
          <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
        </button>
      </div>

      {/* Date Range Selection & Interactive Calendar Filter Bar */}
      <div className="bg-[#131B2E] border border-[#23304A] rounded-2xl p-3.5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <CalendarIcon className="w-4 h-4 text-orange-400" />
            <span>Reporting Period:</span>
            <span className="text-orange-400 font-black">{dateRangeLabel}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
              {rangeDayCount} {rangeDayCount === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          <button
            onClick={() => setShowDatePickerModal(true)}
            className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Change Calendar Date</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Preset Range Tabs: Today, 1 to 4 Days, 7 Days, Custom */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => applyPreset('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activePreset === 'today'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Today (1 Day)
          </button>

          <button
            onClick={() => applyPreset('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activePreset === 'yesterday'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Yesterday
          </button>

          <button
            onClick={() => applyPreset('last_4_days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activePreset === 'last_4_days'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            1 to 4 Days Range
          </button>

          <button
            onClick={() => applyPreset('last_7_days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activePreset === 'last_7_days'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Last 7 Days (1 Week)
          </button>

          <button
            onClick={() => setShowDatePickerModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'custom'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Select Specific Dates</span>
          </button>
        </div>
      </div>

      {/* KPI & Payment Split Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-stretch">
        {/* Main KPI Revenue Card */}
        <div className="p-5 sm:p-6 rounded-[24px] bg-gradient-to-tr from-[#EA580C] via-[#F97316] to-[#D97706] text-white shadow-xl shadow-orange-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-100 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Settled Net Revenue ({dateRangeLabel})
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-black/20 rounded-full text-white">
                {completedOrders.length} Paid Orders
              </span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">₹{totalRevenue.toLocaleString()}</h3>
          </div>

          {/* 3 Metric Sub-pills */}
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
              <p className="text-[10px] text-orange-200 uppercase font-bold">Total Orders</p>
              <p className="text-base font-black text-white mt-0.5">{filteredOrders.length}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
              <p className="text-[10px] text-orange-200 uppercase font-bold">Avg Order Value</p>
              <p className="text-base font-black text-white mt-0.5">₹{aov}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
              <p className="text-[10px] text-orange-200 uppercase font-bold">Cancelled / Void</p>
              <p className="text-base font-black text-white mt-0.5">{cancelledOrders.length}</p>
            </div>
          </div>
        </div>

        {/* Payment Splits: UPI vs Counter Cash */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
          {/* UPI Direct Settlement */}
          <div className="p-4 rounded-2xl bg-[#131B2E] border border-[#23304A] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs text-white font-bold block leading-tight">UPI QR Payouts</span>
                    <span className="text-[10px] text-slate-400">Direct to Owner Bank</span>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-black text-white">₹{upiRevenue.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span>{upiOrders.length} orders</span>
              <span className="text-blue-400 font-bold">
                {totalRevenue > 0 ? Math.round((upiRevenue / totalRevenue) * 100) : 0}% of sales
              </span>
            </div>
          </div>

          {/* Counter Cash */}
          <div className="p-4 rounded-2xl bg-[#131B2E] border border-[#23304A] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <Banknote className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs text-white font-bold block leading-tight">Cash on Delivery</span>
                    <span className="text-[10px] text-slate-400">Direct Register Cash</span>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-black text-white">₹{cashRevenue.toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span>{cashOrders.length} orders</span>
              <span className="text-emerald-400 font-bold">
                {totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0}% of sales
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Items in this Date Range */}
      {itemCounts.length > 0 && (
        <div className="bg-[#131B2E] border border-[#23304A] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Best Selling Items in Selected Period
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-bold">{dateRangeLabel}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {itemCounts.map((item, idx) => (
              <div
                key={item.name}
                className="p-2.5 rounded-xl bg-[#0B0F19] border border-slate-800/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-orange-500/20 text-orange-400 text-xs font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-white truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-orange-400">{item.count} sold</span>
                  <p className="text-[10px] text-slate-400">₹{item.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Sales History & Completion Logs Component */}
      <SalesHistoryComponent
        orders={filteredOrders}
        totalRevenue={totalRevenue}
        dateRangeLabel={dateRangeLabel}
        onExportPdf={handleDownloadPdf}
      />

      {/* Date Picker Range Modal */}
      {showDatePickerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-[#23304A] rounded-[24px] p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#23304A] pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-black text-white">Select Sales Date Range</h3>
              </div>
              <button
                onClick={() => setShowDatePickerModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Pick single date or a multi-day range (e.g. 1 to 4 days, 1 week, or custom dates):
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                  Start Date:
                </label>
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDateStr(newStart);
                    if (newStart > endDateStr) {
                      setEndDateStr(newStart);
                    }
                    setActivePreset('custom');
                  }}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                  End Date:
                </label>
                <input
                  type="date"
                  value={endDateStr}
                  min={startDateStr}
                  onChange={(e) => {
                    setEndDateStr(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick date shortcuts inside modal */}
            <div className="pt-2 border-t border-[#23304A]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Quick Shortcuts:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    applyPreset('today');
                    setShowDatePickerModal(false);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 text-left border border-slate-800"
                >
                  Today (1 Day)
                </button>
                <button
                  onClick={() => {
                    applyPreset('last_4_days');
                    setShowDatePickerModal(false);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 text-left border border-slate-800"
                >
                  Last 4 Days
                </button>
                <button
                  onClick={() => {
                    applyPreset('last_7_days');
                    setShowDatePickerModal(false);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 text-left border border-slate-800"
                >
                  Last 7 Days (1 Wk)
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const past30 = new Date();
                    past30.setDate(today.getDate() - 29);
                    setStartDateStr(past30.toISOString().split('T')[0]);
                    setEndDateStr(today.toISOString().split('T')[0]);
                    setActivePreset('custom');
                    setShowDatePickerModal(false);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 text-left border border-slate-800"
                >
                  Last 30 Days (1 Mo)
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowDatePickerModal(false)}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Apply Filter ({dateRangeLabel})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { DashboardCardPreferences } from '../types';
import { 
  Sliders, 
  X, 
  Check, 
  IndianRupee, 
  Receipt, 
  CookingPot, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Inbox,
  RotateCcw
} from 'lucide-react';

interface CustomizeLayoutModalProps {
  preferences: DashboardCardPreferences;
  onSave: (newPrefs: Partial<DashboardCardPreferences>) => Promise<boolean>;
  onClose: () => void;
}

export const CustomizeLayoutModal: React.FC<CustomizeLayoutModalProps> = ({
  preferences,
  onSave,
  onClose,
}) => {
  const [localPrefs, setLocalPrefs] = useState<DashboardCardPreferences>({ ...preferences });
  const [isSaving, setIsSaving] = useState(false);

  const toggleCard = (key: keyof DashboardCardPreferences) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleReset = () => {
    setLocalPrefs({
      todaySales: true,
      activeOrders: true,
      preparingOrders: true,
      completedOrders: true,
      topSellingItems: true,
      quickActions: true,
      recentOrders: true,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localPrefs);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const cardItems: {
    key: keyof DashboardCardPreferences;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'todaySales',
      title: "Today's Total Sales",
      description: "Live revenue settled from today's completed food orders",
      icon: <IndianRupee className="w-4 h-4" />,
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      key: 'activeOrders',
      title: 'Active Orders Count',
      description: 'Incoming and in-progress orders waiting on counter/kitchen',
      icon: <Receipt className="w-4 h-4" />,
      color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    },
    {
      key: 'topSellingItems',
      title: 'Top Selling Items',
      description: 'Best-performing food & beverage items ranked by volume',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    },
    {
      key: 'preparingOrders',
      title: 'Kitchen Cooking / Preparing',
      description: 'Orders currently being cooked and packed by chefs',
      icon: <CookingPot className="w-4 h-4" />,
      color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    },
    {
      key: 'completedOrders',
      title: 'Completed Orders Today',
      description: 'Total settled meals and tickets served today',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      key: 'quickActions',
      title: 'Quick Owner Actions Bar',
      description: 'Direct shortcuts for Live Orders, Menu, Shop QR, and Analytics',
      icon: <Zap className="w-4 h-4" />,
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      key: 'recentOrders',
      title: 'Recent Orders Feed',
      description: 'Preview list of recent incoming orders with quick details',
      icon: <Inbox className="w-4 h-4" />,
      color: 'bg-slate-700/40 text-slate-300 border-slate-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#131B2E] border border-[#23304A] rounded-[24px] max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#23304A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
              <Sliders className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Customize Dashboard Layout</h3>
              <p className="text-[11px] text-slate-400">Add or remove cards to tailor your screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Toggles List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Dashboard Cards ({Object.values(localPrefs).filter(Boolean).length} Active)
            </span>
            <button
              onClick={handleReset}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>

          {cardItems.map((item) => {
            const isEnabled = localPrefs[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggleCard(item.key)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isEnabled
                    ? 'bg-[#0B0F19] border-orange-500/40 shadow-sm'
                    : 'bg-[#0B0F19]/50 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <div
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${
                    isEnabled ? 'bg-orange-600 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center">
                    {isEnabled ? (
                      <Check className="w-3 h-3 text-orange-600 stroke-[3]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#23304A] bg-[#0E1524] flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-950 transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save & Persist Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

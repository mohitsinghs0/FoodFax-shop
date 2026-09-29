import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { CustomizeLayoutModal } from '../components/CustomizeLayoutModal';
import { 
  ArrowLeft, 
  Store, 
  Settings, 
  QrCode, 
  Bell, 
  ChevronRight,
  LogOut,
  BarChart3,
  Sliders
} from 'lucide-react';

interface ProfileScreenProps {
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenShopProfile: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenSettings,
  onOpenNotifications,
  onOpenShopProfile,
}) => {
  const { ownerProfile, shop, logout, setActiveScreen, dashboardPreferences, updateDashboardLayout } = useOwnerApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);

  const initial = (ownerProfile?.fullName || shop?.name || 'M')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] pb-24 select-none">
      {/* Top App Bar matching Photo 5 */}
      <div className="px-4 py-3.5 border-b border-[#131B2E] flex items-center gap-3 sticky top-0 bg-[#0B0F19] z-20">
        <button
          onClick={() => setActiveScreen('dashboard')}
          className="p-1 -ml-1 text-white hover:text-[#F97316] transition"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <h2 className="text-[17px] font-black tracking-tight text-white">
          Store Owner Profile
        </h2>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {/* Top Profile Card matching Photo 5 */}
        <div className="bg-[#131B2E] border border-[#23304A] rounded-[22px] p-5 flex items-center gap-4">
          {/* Big Orange Round Avatar */}
          <div className="w-16 h-16 rounded-full bg-[#F97316] text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md shadow-orange-950/40">
            {initial}
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-bold text-white leading-tight capitalize truncate">
              {ownerProfile?.fullName || shop?.name?.split(' ')[0] || 'meena'}
            </h3>
            <p className="text-xs text-[#94A3B8] font-medium mt-1 truncate">
              {ownerProfile?.phone || '+919321444296'}
            </p>
            <p className="text-xs font-bold text-[#F97316] mt-1 truncate">
              {shop?.name || 'Meena bajar'}
            </p>
          </div>
        </div>

        {/* Menu Navigation Card matching Photo 5 */}
        <div className="bg-[#131B2E] border border-[#23304A] rounded-[22px] overflow-hidden divide-y divide-[#23304A]/60">
          {/* Item 1: Shop Profile & Address */}
          <button
            onClick={onOpenShopProfile}
            className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Store className="w-5 h-5 text-[#F97316] stroke-[2]" />
              <span className="text-[13px] font-bold text-white">
                Shop Profile &amp; Address
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#64748B]" />
          </button>

          {/* Item 2: Kitchen & Fulfillment Settings */}
          <button
            onClick={onOpenSettings}
            className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left"
          >
            <div className="flex items-center gap-3.5">
              <Settings className="w-5 h-5 text-cyan-400 stroke-[2]" />
              <span className="text-[13px] font-bold text-white">
                Kitchen &amp; Fulfillment Settings
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#64748B]" />
          </button>

          {/* Item 3: Store Counter QR Code */}
          <button
            onClick={() => setActiveScreen('shop_qr')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left"
          >
            <div className="flex items-center gap-3.5">
              <QrCode className="w-5 h-5 text-purple-400 stroke-[2]" />
              <span className="text-[13px] font-bold text-white">
                Store Counter QR Code
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#64748B]" />
          </button>

          {/* Item 4: Sales & Business Analytics */}
          <button
            onClick={() => setActiveScreen('sales')}
            className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <BarChart3 className="w-5 h-5 text-teal-400 stroke-[2]" />
              <div>
                <span className="text-[13px] font-bold text-white block">
                  Sales Reports &amp; PDF Export
                </span>
                <span className="text-[11px] text-slate-400">
                  Custom calendar dates, 1-4 day filters, and summaries
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#64748B]" />
          </button>

          {/* Item 5: Customize Dashboard Layout */}
          <button
            onClick={() => setShowLayoutModal(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Sliders className="w-5 h-5 text-orange-400 stroke-[2]" />
              <div>
                <span className="text-[13px] font-bold text-white block">
                  Customize Dashboard Cards
                </span>
                <span className="text-[11px] text-slate-400">
                  Add or remove Total Sales, Active Orders, Top Items cards
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#64748B]" />
          </button>

          {/* Item 6: Chime & Sound Alerts */}
          <button
            onClick={onOpenNotifications}
            className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left"
          >
            <div className="flex items-center gap-3.5">
              <Bell className="w-5 h-5 text-yellow-400 stroke-[2]" />
              <span className="text-[13px] font-bold text-white">
                Chime &amp; Sound Alerts
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#64748B]" />
          </button>
        </div>

        {/* Red Outlined Sign Out Button matching Photo 5 */}
        <div className="pt-4">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3.5 rounded-[16px] border border-rose-500/80 bg-transparent text-rose-400 hover:bg-rose-500/10 font-bold text-sm text-center transition active:scale-[0.99]"
          >
            Sign Out from Store
          </button>
        </div>
      </div>

      {/* Customize Dashboard Layout Modal */}
      {showLayoutModal && (
        <CustomizeLayoutModal
          preferences={dashboardPreferences}
          onSave={updateDashboardLayout}
          onClose={() => setShowLayoutModal(false)}
        />
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-[#23304A] rounded-[24px] p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">Sign Out?</h3>
            <p className="text-xs text-[#94A3B8] mt-1.5">
              Are you sure you want to sign out from your restaurant dashboard?
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#0B0F19] text-[#94A3B8] font-bold text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const { 
    ownerProfile, 
    shop, 
    logout, 
    setActiveScreen, 
    dashboardPreferences, 
    updateDashboardLayout 
  } = useOwnerApp();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);

  const initial = (ownerProfile?.fullName || shop?.name || 'M')[0].toUpperCase();
  const currentShopPhoto = shop?.logoUrl || shop?.bannerUrl;

  return (
    <div className="text-[#F8FAFC] min-h-full pb-28 lg:pb-12 select-none">
      {/* In-page Screen Header with Back to Dashboard */}
      <div className="px-4 py-3 border-b border-[#131B2E] flex items-center gap-3 bg-[#0B0F19]">
        <button
          onClick={() => setActiveScreen('dashboard')}
          className="p-1.5 -ml-1 text-slate-300 hover:text-[#F97316] transition cursor-pointer rounded-lg hover:bg-[#131B2E]"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <div>
          <h2 className="text-[16px] font-black tracking-tight text-white leading-tight">
            Store Owner Profile
          </h2>
          <p className="text-[11px] text-slate-400">
            Account settings &amp; store configuration
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-4 lg:py-8 max-w-md lg:max-w-5xl mx-auto">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start space-y-4 lg:space-y-0">
          
          {/* Left Column: Top Profile Card & Sign Out (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Top Profile Card */}
            <div className="bg-[#131B2E] border border-[#23304A] rounded-[22px] p-4.5 flex items-center gap-4 relative overflow-hidden shadow-sm">
              {currentShopPhoto ? (
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-[#F97316] shadow-md shadow-orange-950/40 bg-slate-900">
                  <img 
                    src={currentShopPhoto} 
                    alt={shop?.name || 'Shop'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#F97316] text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md shadow-orange-950/40">
                  {initial}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white leading-tight capitalize truncate">
                    {ownerProfile?.fullName || shop?.name?.split(' ')[0] || 'Store Owner'}
                  </h3>
                  {currentShopPhoto && (
                    <span className="shrink-0 text-[10px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#94A3B8] font-medium mt-1 truncate">
                  {ownerProfile?.phone || shop?.phone || '+91 93214 44297'}
                </p>
                <p className="text-xs font-bold text-[#F97316] mt-1 truncate flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  <span>{shop?.name || 'My FoodFax Outlet'}</span>
                </p>
              </div>
            </div>

            {/* Sign Out Button - shown under profile on desktop */}
            <div className="hidden lg:block pt-2">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-3.5 rounded-[16px] border border-rose-500/80 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 font-bold text-sm text-center transition active:scale-[0.99] cursor-pointer"
              >
                Sign Out from Store
              </button>
            </div>
          </div>

          {/* Right Column: Menu Navigation Card (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Menu Navigation Card */}
            <div className="bg-[#131B2E] border border-[#23304A] rounded-[22px] overflow-hidden divide-y divide-[#23304A]/60 shadow-md">
              {/* Item 1: Shop Profile, Photo & Address */}
              <button
                onClick={onOpenShopProfile}
                className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-[#F97316] shrink-0">
                    <Store className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-white block">
                      Shop Profile &amp; Location
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Update name, photo, address, hours, UPI ID and map pin
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </button>

              {/* Item 2: Kitchen & Delivery Settings */}
              <button
                onClick={onOpenSettings}
                className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Settings className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-white block">
                      Kitchen &amp; Delivery Settings
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Dine-in, Takeaway, Shop Delivery radius &amp; fees
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </button>

              {/* Item 3: Store Counter QR Code */}
              <button
                onClick={() => setActiveScreen('shop_qr')}
                className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <QrCode className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-white block">
                      Store Counter QR Code
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Print digital menu QR code for tables &amp; billing counter
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </button>

              {/* Item 4: Sales & Business Analytics */}
              <button
                onClick={() => setActiveScreen('sales')}
                className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                    <BarChart3 className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-white block">
                      Sales Reports &amp; PDF Export
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Custom calendar dates, filters, and business summaries
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
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Sliders className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-white block">
                      Customize Dashboard Cards
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Add or remove Total Sales, Active Orders, Top Items
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </button>

              {/* Item 6: Chime & Sound Alerts */}
              <button
                onClick={onOpenNotifications}
                className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
                    <Bell className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[13px] font-bold text-white block">
                      Chime &amp; Sound Alerts
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Order ring tones and background sound preferences
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            {/* Mobile Sign Out Button */}
            <div className="pt-2 lg:hidden">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-3.5 rounded-[16px] border border-rose-500/80 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 font-bold text-sm text-center transition active:scale-[0.99] cursor-pointer"
              >
                Sign Out from Store
              </button>
            </div>
          </div>
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
                className="flex-1 py-2.5 rounded-xl bg-[#0B0F19] text-[#94A3B8] font-bold text-xs hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
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

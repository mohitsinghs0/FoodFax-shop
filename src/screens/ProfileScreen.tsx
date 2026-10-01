import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { CustomizeLayoutModal } from '../components/CustomizeLayoutModal';
import { ShopLocationPickerModal } from '../components/ShopLocationPickerModal';
import { GoogleMapsLocationPicker } from '../components/GoogleMapsLocationPicker';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { formatLocationRelativeTime } from '../utils/locationUtils';
import { 
  ArrowLeft, 
  Store, 
  Settings, 
  QrCode, 
  Bell, 
  ChevronRight, 
  LogOut, 
  BarChart3, 
  Sliders,
  MapPin,
  Navigation,
  Loader2,
  Building2,
  Truck,
  Compass,
  Check,
  Radio,
  Info,
  Globe,
  RadioTower,
  HelpCircle
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
    saveShop,
    logout, 
    setActiveScreen, 
    dashboardPreferences, 
    updateDashboardLayout, 
    toggleShopOpen 
  } = useOwnerApp();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);

  const initial = (ownerProfile?.fullName || shop?.name || 'M')[0].toUpperCase();

  // Map spot broadcast toggle handler
  const handleToggleMapSpot = async () => {
    if (!shop) return;
    const nextState = !(shop.isMapSpotActive ?? true);
    await saveShop({
      isMapSpotActive: nextState,
    });
    setLocationSuccessMsg(nextState ? 'Shop spot is now live on Customer Discovery Map!' : 'Shop spot hidden from customer discovery map.');
    setTimeout(() => setLocationSuccessMsg(null), 3000);
  };

  // Tracking mode configuration handler
  const handleSetTrackingMode = async (isMobile: boolean) => {
    if (!shop) return;
    await saveShop({
      isMobileStall: isMobile,
    });
    setLocationSuccessMsg(isMobile ? 'Configured as Mobile Food Stall (Dynamic Spot Mode)' : 'Configured as Permanent Restaurant / Cafe (Fixed Address)');
    setTimeout(() => setLocationSuccessMsg(null), 3000);
  };

  // On-demand GPS update for mobile stalls
  const handleUpdateCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);
        const timestamp = new Date().toISOString();

        await saveShop({
          latitude: lat,
          longitude: lng,
          locationAccuracyMeters: acc,
          lastLocationUpdatedAt: timestamp,
          isMobileStall: true,
        });

        setLocating(false);
        setLocationSuccessMsg('Current stall location updated via GPS!');
        setTimeout(() => setLocationSuccessMsg(null), 3000);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocating(false);
        alert('Could not retrieve current GPS coordinates. Please use Edit Location on Map.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleMapConfirm = async (loc: {
    latitude: number;
    longitude: number;
    address?: string;
    area?: string;
    accuracy?: number;
  }) => {
    await saveShop({
      latitude: loc.latitude,
      longitude: loc.longitude,
      locationAccuracyMeters: loc.accuracy,
      lastLocationUpdatedAt: new Date().toISOString(),
      address: loc.address || shop?.address,
      area: loc.area || shop?.area,
    });
    setLocationSuccessMsg('Exact coordinates saved!');
    setTimeout(() => setLocationSuccessMsg(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] pb-24 select-none">
      {/* Top App Bar */}
      <div className="px-4 py-3.5 border-b border-[#131B2E] flex items-center gap-3 sticky top-0 bg-[#0B0F19] z-20">
        <button
          onClick={() => setActiveScreen('dashboard')}
          className="p-1 -ml-1 text-white hover:text-[#F97316] transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <h2 className="text-[17px] font-black tracking-tight text-white">
          Store Owner Profile
        </h2>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {/* Top Profile Card */}
        <div className="bg-[#131B2E] border border-[#23304A] rounded-[22px] p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#F97316] text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md shadow-orange-950/40">
            {initial}
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-bold text-white leading-tight capitalize truncate">
              {ownerProfile?.fullName || shop?.name?.split(' ')[0] || 'Store Owner'}
            </h3>
            <p className="text-xs text-[#94A3B8] font-medium mt-1 truncate">
              {ownerProfile?.phone || shop?.phone || '+91 93214 44297'}
            </p>
            <p className="text-xs font-bold text-[#F97316] mt-1 truncate">
              {shop?.name || 'My FoodFax Outlet'}
            </p>
          </div>
        </div>

        {locationSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{locationSuccessMsg}</span>
          </div>
        )}

        {/* LOCATION SETTINGS SECTION (Dedicated Stall Status, Map Spot Switch & True Google Maps Picker) */}
        {shop && (
          <div className="bg-[#131B2E] border border-[#23304A] rounded-[22px] p-4.5 space-y-4 shadow-sm">
            
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-[#F97316] flex items-center justify-center border border-orange-500/20">
                  <RadioTower className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-[13px] font-black uppercase tracking-wider text-white">
                    Location Settings
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Live stall status, discovery radar &amp; Google Maps spot
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                shop.isOpen
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  shop.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`} />
                {shop.isOpen ? 'Store Online' : 'Store Paused'}
              </span>
            </div>

            {/* 1. Stall / Counter Live Status Toggle (Moved here from dashboard/top) */}
            <div className="p-3.5 bg-[#0B0F19] rounded-xl border border-[#23304A] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  shop.isOpen ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                }`}>
                  <Store className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-xs font-bold text-white leading-tight truncate">
                      {shop.isOpen ? 'Live Stall / Counter: ACTIVE' : 'Live Stall / Counter: PAUSED'}
                    </h5>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-tight mt-0.5 truncate">
                    {shop.isOpen ? 'Open for customer walk-in, dine-in & takeaway' : 'Temporarily paused for incoming orders'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleShopOpen(!shop.isOpen)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all border cursor-pointer active:scale-95 shrink-0 ${
                  shop.isOpen
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20'
                }`}
              >
                {shop.isOpen ? 'ONLINE' : 'OFFLINE'}
              </button>
            </div>

            {/* 2. Map Spot Discovery Switch (Broadcast on Customer Discovery Map) */}
            <div className="p-3.5 bg-[#0B0F19] rounded-xl border border-[#23304A] flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Radio className={`w-4 h-4 ${
                    (shop.isMapSpotActive ?? true) ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                  }`} />
                  <span className="text-xs font-black text-white">
                    Broadcast Spot on Customer Map
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {(shop.isMapSpotActive ?? true)
                    ? 'Your shop is visible on nearby customers’ discovery radar and interactive food map.'
                    : 'Shop spot is temporarily hidden from customer food discovery and distance radar.'}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleMapSpot}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  (shop.isMapSpotActive ?? true) ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    (shop.isMapSpotActive ?? true) ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 3. Location Tracking Mode & Business Type */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Location Tracking Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetTrackingMode(false)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    !shop.isMobileStall
                      ? 'bg-blue-500/10 border-blue-500/50 text-white shadow-sm'
                      : 'bg-[#0B0F19] border-[#23304A] text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Building2 className={`w-4 h-4 ${!shop.isMobileStall ? 'text-blue-400' : 'text-slate-500'}`} />
                    {!shop.isMobileStall && (
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Permanent Restaurant</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Fixed address &amp; entrance pin</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTrackingMode(true)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    shop.isMobileStall
                      ? 'bg-purple-500/10 border-purple-500/50 text-white shadow-sm'
                      : 'bg-[#0B0F19] border-[#23304A] text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Truck className={`w-4 h-4 ${shop.isMobileStall ? 'text-purple-400' : 'text-slate-500'}`} />
                    {shop.isMobileStall && (
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Mobile Food Stall</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Dynamic spot &amp; thela tracking</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 4. TRUE GOOGLE MAPS INTERACTIVE LOCATION PICKER (Powered by @vis.gl/react-google-maps) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span>Google Maps Exact Location</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Google Maps SDK Active
                </span>
              </div>

              {/* Embedded True Google Maps Picker */}
              <GoogleMapsLocationPicker
                initialLat={shop.latitude || 19.0760}
                initialLng={shop.longitude || 72.8777}
                initialAddress={shop.address}
                initialArea={shop.area}
                isMobileStall={shop.isMobileStall}
                onSaveLocation={handleMapConfirm}
                height="320px"
                showSaveButton={true}
              />
            </div>

            {/* 5. Customer Delivery Radius & Fulfillment Summary */}
            <div className="p-3 bg-[#0B0F19] rounded-xl border border-[#23304A] flex items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Customer Delivery Radius:</span>
                <span className="text-white font-black text-xs">
                  {shop.deliveryRadiusKm || 3} km ({shop.deliveryFeeType === 'fixed' ? `₹${shop.deliveryFeeAmount || 0} fee` : 'Free Delivery'})
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-[11px] font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
              >
                Change Radius
              </button>
            </div>

          </div>
        )}

        {/* Menu Navigation Card */}
        <div className="bg-[#131B2E] border border-[#23304A] rounded-[22px] overflow-hidden divide-y divide-[#23304A]/60">
          {/* Item 1: Shop Profile & Address */}
          <button
            onClick={onOpenShopProfile}
            className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Store className="w-5 h-5 text-[#F97316] stroke-[2]" />
              <div>
                <span className="text-[13px] font-bold text-white block">
                  Shop Profile &amp; Location
                </span>
                <span className="text-[11px] text-slate-400">
                  Update name, address, hours, UPI ID and map pin
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
              <Settings className="w-5 h-5 text-cyan-400 stroke-[2]" />
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
            className="w-full p-4 flex items-center justify-between hover:bg-[#1a253e] transition text-left cursor-pointer"
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

        {/* Sign Out Button */}
        <div className="pt-2">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3.5 rounded-[16px] border border-rose-500/80 bg-transparent text-rose-400 hover:bg-rose-500/10 font-bold text-sm text-center transition active:scale-[0.99] cursor-pointer"
          >
            Sign Out from Store
          </button>
        </div>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <ShopLocationPickerModal
          initialLat={shop?.latitude || 19.0760}
          initialLng={shop?.longitude || 72.8777}
          initialAddress={shop?.address}
          initialArea={shop?.area}
          isMobileStall={shop?.isMobileStall}
          onConfirm={handleMapConfirm}
          onClose={() => setShowLocationModal(false)}
        />
      )}

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

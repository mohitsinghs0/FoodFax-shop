import React, { useState, useEffect } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  LogOut, 
  Store, 
  MapPin, 
  Phone, 
  Calendar,
  Sparkles,
  ArrowRight,
  Edit3
} from 'lucide-react';

export const KycStatusScreen: React.FC = () => {
  const { shop, ownerProfile, logout, setActiveScreen, checkKycStatus, getSupabaseClient } = useOwnerApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Derive verification state from shop data
  const isApproved = Boolean(
    shop && (shop.is_active === true || shop.kyc_status === 'approved' || shop.kycStatus === 'approved' || shop.isVerified === true)
  );
  const isRejected = Boolean(
    !isApproved && (
      shop?.kyc_status === 'rejected' ||
      shop?.kycStatus === 'rejected' ||
      shop?.rejection_reason ||
      shop?.kycRejectionReason ||
      (typeof shop?.featured_item === 'string' && shop.featured_item.startsWith('KYC_REJECTED:'))
    )
  );
  const rejectionReason =
    shop?.rejection_reason ||
    shop?.kycRejectionReason ||
    (typeof shop?.featured_item === 'string' && shop.featured_item.startsWith('KYC_REJECTED:')
      ? shop.featured_item.replace('KYC_REJECTED:', '').trim()
      : null);

  const handleManualCheck = async () => {
    setIsRefreshing(true);
    setStatusMessage(null);
    try {
      if (checkKycStatus) {
        const updated = await checkKycStatus();
        if (updated?.isVerified || updated?.is_active) {
          setStatusMessage('Shop approved by Admin! Redirecting to Dashboard...');
          setTimeout(() => setActiveScreen('dashboard'), 1000);
        } else if (updated?.kycStatus === 'rejected') {
          setStatusMessage('Application reviewed: Verification update received.');
        } else {
          setStatusMessage('Status: Under Review by FoodFax Admin.');
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Live Realtime listener on Supabase shops table for instant approval notification
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !shop?.id) return;

    const channel = client
      .channel(`shop_kyc_${shop.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'shops', filter: `id=eq.${shop.id}` },
        (payload: any) => {
          if (payload.new) {
            if (payload.new.is_active === true || payload.new.kyc_status === 'approved') {
              if (checkKycStatus) checkKycStatus();
              setStatusMessage('Congratulations! Admin has approved your shop.');
            } else if (payload.new.kyc_status === 'rejected') {
              if (checkKycStatus) checkKycStatus();
            }
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [shop?.id, getSupabaseClient, checkKycStatus]);

  const initial = (shop?.name || ownerProfile?.fullName || 'S')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 max-w-xl mx-auto select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-[#F97316]">
            <Store className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-tight">
              FoodFax Partner
            </h1>
            <p className="text-[11px] text-slate-400">Shop Verification Portal</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-xs font-bold transition cursor-pointer"
          title="Sign out of store"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Status Area */}
      <div className="my-auto py-6 space-y-5">
        
        {/* State 1: APPROVED */}
        {isApproved && (
          <div className="bg-gradient-to-b from-emerald-500/15 via-[#131B2E] to-[#131B2E] border-2 border-emerald-500/50 rounded-[28px] p-6 text-center shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                Verified &amp; Live
              </span>
              <h2 className="text-xl font-black text-white mt-2">
                KYC Verification Approved!
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                Your shop application has been reviewed and approved by FoodFax Admin. You can now start accepting customer orders!
              </p>
            </div>

            <button
              onClick={() => setActiveScreen('dashboard')}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <span>Enter Store Dashboard</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* State 2: REJECTED */}
        {!isApproved && isRejected && (
          <div className="bg-gradient-to-b from-rose-500/15 via-[#131B2E] to-[#131B2E] border-2 border-rose-500/50 rounded-[28px] p-6 text-center shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border-2 border-rose-500/40 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/40">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-500/30">
                Application Needs Revision
              </span>
              <h2 className="text-xl font-black text-white mt-2">
                KYC Verification Rejected
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                The FoodFax Admin reviewed your shop application and requested updates. Please review the reason below and update your shop details.
              </p>
            </div>

            {/* Rejection Reason Card */}
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-4 text-left space-y-1.5">
              <p className="text-[11px] font-black text-rose-400 uppercase tracking-wide">
                Admin Rejection Reason:
              </p>
              <p className="text-xs font-semibold text-rose-200 leading-relaxed">
                {rejectionReason || 'Shop storefront photo or address details need clarification. Please re-check and resubmit.'}
              </p>
            </div>

            <button
              onClick={() => setActiveScreen('shop_setup')}
              className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-sm shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 stroke-[2.5]" />
              <span>Edit Shop Details &amp; Try Again</span>
            </button>
          </div>
        )}

        {/* State 3: PENDING / IN PROGRESS */}
        {!isApproved && !isRejected && (
          <div className="bg-gradient-to-b from-amber-500/15 via-[#131B2E] to-[#131B2E] border-2 border-amber-500/40 rounded-[28px] p-6 text-center shadow-xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border-2 border-amber-500/40 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/40 animate-pulse">
              <Clock className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                Verification in Progress
              </span>
              <h2 className="text-xl font-black text-white mt-2">
                Waiting for KYC Verification
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Your restaurant details have been securely recorded. Our admin team verifies all partner shops before customer ordering is enabled.
              </p>
            </div>

            {/* Status Steps timeline */}
            <div className="bg-[#0B0F19] border border-[#23304A] rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">1. Registration Completed</p>
                  <p className="text-[10px] text-slate-400">Account and phone number verified</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">2. Shop Profile Submitted</p>
                  <p className="text-[10px] text-slate-400">Address, UPI ID &amp; storefront photo saved</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-300 leading-tight">3. Admin KYC Verification</p>
                  <p className="text-[10px] text-slate-400">Admin panel review in progress</p>
                </div>
              </div>
            </div>

            {statusMessage && (
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-bold">
                {statusMessage}
              </div>
            )}

            <button
              onClick={handleManualCheck}
              disabled={isRefreshing}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking Supabase...' : 'Refresh Verification Status'}</span>
            </button>
          </div>
        )}

        {/* Shop Submitted Details Card */}
        {shop && (
          <div className="bg-[#131B2E] border border-[#23304A] rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center gap-3">
              {shop.logoUrl || shop.bannerUrl ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-orange-500/40 bg-slate-900">
                  <img
                    src={shop.logoUrl || shop.bannerUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                  {initial}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate">{shop.name}</h3>
                <p className="text-xs text-orange-400 font-semibold truncate">{shop.shopType || 'Food Outlet'}</p>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{shop.phone || ownerProfile?.phone}</span>
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="flex items-start gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                <span className="truncate">{shop.address || shop.area || 'Address submitted'} {shop.city ? `• ${shop.city}` : ''}</span>
              </p>
              {shop.upiId && (
                <p className="font-mono text-slate-300">
                  Settlement UPI: <span className="text-orange-400">{shop.upiId}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-500 pt-3">
        FoodFax Smart Partner System &bull; Secure Authentication
      </div>
    </div>
  );
};

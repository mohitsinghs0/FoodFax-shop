import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { ShopLocationPickerModal } from '../components/ShopLocationPickerModal';
import { 
  Store, 
  MapPin, 
  Clock, 
  CreditCard, 
  Navigation, 
  Loader2, 
  Building2, 
  Truck, 
  CheckCircle2,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

export const ShopSetupScreen: React.FC = () => {
  const { ownerProfile, saveShop, isLoading, setActiveScreen } = useOwnerApp();

  // Business Type Selection (Permanent Restaurant vs Mobile Food Stall)
  const [isMobileStall, setIsMobileStall] = useState<boolean>(false);
  const [shopType, setShopType] = useState('Restaurant / Cafe');

  // Form Fields
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(ownerProfile?.phone || '');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [openingTime, setOpeningTime] = useState('10:00 AM');
  const [closingTime, setClosingTime] = useState('11:00 PM');
  const [upiId, setUpiId] = useState('');

  // Geospatial Fields
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locationAccuracy, setLocationAccuracy] = useState<number | undefined>();
  const [lastLocationUpdated, setLastLocationUpdated] = useState<string | undefined>();
  
  // UI States
  const [locating, setLocating] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick stall categories
  const stallCategories = [
    'Food Stall / Thela / Food Cart',
    'Chaat & Street Food Cart',
    'Chai & Snack Thela',
    'Momo & Fast Food Stall',
    'Juice & Beverage Stall',
    'South Indian Tiffin Cart',
  ];

  // Quick restaurant categories
  const restaurantCategories = [
    'Restaurant / Cafe',
    'Fast Food & QSR',
    'Bakery & Desserts',
    'Fine Dine & Bistro',
    'Cloud Kitchen / Delivery Outlet',
    'Dhaba & Family Restaurant',
  ];

  // Handle on-demand GPS for mobile stalls (Explicit action only - no background tracking)
  const handleFetchStallLocation = () => {
    setFormError(null);
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser. Please use the map picker.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);
        const timestamp = new Date().toISOString();

        setLatitude(lat);
        setLongitude(lng);
        setLocationAccuracy(acc);
        setLastLocationUpdated(timestamp);
        setLocating(false);
      },
      (err) => {
        console.warn('GPS location retrieval error:', err);
        setLocating(false);
        setFormError('Could not retrieve device GPS. Please ensure location permissions are enabled or pick on map.');
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  const handleMapConfirm = (loc: {
    latitude: number;
    longitude: number;
    address?: string;
    area?: string;
    accuracy?: number;
  }) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    if (loc.accuracy) setLocationAccuracy(loc.accuracy);
    setLastLocationUpdated(new Date().toISOString());

    if (loc.address && !address) {
      setAddress(loc.address);
    }
    if (loc.area && !area) {
      setArea(loc.area);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!shopName.trim()) {
      setFormError('Please enter your business/shop name.');
      return;
    }

    const success = await saveShop({
      name: shopName.trim(),
      shopType,
      isMobileStall,
      description: description.trim(),
      phone: phone.trim(),
      address: address.trim(),
      area: area.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      latitude,
      longitude,
      locationAccuracyMeters: locationAccuracy,
      lastLocationUpdatedAt: lastLocationUpdated || (latitude && longitude ? new Date().toISOString() : undefined),
      openingTime,
      closingTime,
      upiId: upiId.trim(),
      isOpen: true,
      isRushMode: false,
      rushExtraMinutes: 15,
      acceptsDineIn: !isMobileStall,
      acceptsTakeaway: true,
      acceptsDelivery: false,
      deliveryRadiusKm: 3,
    });

    if (success) {
      setActiveScreen('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 max-w-xl mx-auto select-none">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-600/30">
          <Store className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Configure Your FoodFax Shop</h2>
        <p className="text-slate-400 text-xs mt-1">
          Welcome, {ownerProfile?.fullName || 'Partner'}! Select your business model to configure exact GPS &amp; ordering setup.
        </p>
      </div>

      {formError && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
        
        {/* SECTION 1: BUSINESS TYPE SELECTION */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 border-b border-slate-800 pb-2 mb-3">
            1. Business Model &amp; Shop Type
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Option A: Permanent Restaurant / Cafe */}
            <button
              type="button"
              onClick={() => {
                setIsMobileStall(false);
                setShopType('Restaurant / Cafe');
              }}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                !isMobileStall
                  ? 'bg-orange-600/15 border-orange-500 text-white ring-2 ring-orange-500/30 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  !isMobileStall ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                {!isMobileStall && <CheckCircle2 className="w-4 h-4 text-orange-400" />}
              </div>
              <div>
                <p className="text-xs font-black text-white">Permanent Restaurant / Cafe</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Fixed physical store with address &amp; entrance pin
                </p>
              </div>
            </button>

            {/* Option B: Mobile Food Stall / Thela / Food Cart */}
            <button
              type="button"
              onClick={() => {
                setIsMobileStall(true);
                setShopType('Food Stall / Thela / Food Cart');
              }}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                isMobileStall
                  ? 'bg-orange-600/15 border-orange-500 text-white ring-2 ring-orange-500/30 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isMobileStall ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                {isMobileStall && <CheckCircle2 className="w-4 h-4 text-orange-400" />}
              </div>
              <div>
                <p className="text-xs font-black text-white">Mobile Food Stall / Thela</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Street cart/thela that updates spot on-demand
                </p>
              </div>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isMobileStall ? 'Stall / Brand Name *' : 'Restaurant / Outlet Name *'}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={isMobileStall ? 'e.g. Ramesh Vada Pav & Chai' : 'e.g. Spice Garden Bistro'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subcategory</label>
              <select
                value={shopType}
                onChange={(e) => setShopType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none"
              >
                {(isMobileStall ? stallCategories : restaurantCategories).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Specialties &amp; Tagline</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Butter Pav Bhaji, Cutting Chai & Masala Chaat"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: LOCATION SYSTEM (Tailored for Permanent vs Mobile) */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
              2. {isMobileStall ? 'Mobile Stall Location Management' : 'Permanent Restaurant Location'}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {isMobileStall ? 'ON-DEMAND GPS' : 'MAP PIN'}
            </span>
          </div>

          {/* PERMANENT RESTAURANT LOCATION FLOW */}
          {!isMobileStall && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Provide your street address and select your exact entrance pin on the map. Customers discover your store based on this fixed coordinate.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop #14, Ground Floor, 100 Feet Road"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Koramangala 5th Block"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="560034"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* Map Picker CTA for Permanent Restaurant */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-white">Exact Map Pin Coordinates</span>
                  </div>
                  {latitude && longitude ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Confirmed
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400">Needs Pinning</span>
                  )}
                </div>

                {latitude && longitude ? (
                  <p className="text-[11px] text-slate-400 font-mono">
                    Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Search address and drag marker to confirm your exact outlet entry point.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>{latitude ? 'Adjust Location on Map' : 'Select Location on Map'}</span>
                </button>
              </div>
            </div>
          )}

          {/* MOBILE FOOD STALL LOCATION FLOW */}
          {isMobileStall && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[11px]">
                💡 <strong>Notice:</strong> Mobile stalls may change street spots or corners throughout the day. FoodFax does <em>not</em> continuously track your device; you update coordinates on-demand whenever parked at a new spot.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Current Street Spot / Landmark (Optional)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Metro Pillar 104, 100ft Road"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Locality / Market Area</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Indiranagar Market"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* On-Demand GPS Location Button */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Stall GPS Coordinates</p>
                    <p className="text-[11px] text-slate-400">
                      {latitude && longitude
                        ? `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
                        : 'Tap button to acquire current street spot coordinates'}
                    </p>
                  </div>
                  {locationAccuracy && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                      &plusmn;{locationAccuracy}m
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleFetchStallLocation}
                    disabled={locating}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-orange-950 cursor-pointer"
                  >
                    {locating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                    <span>
                      {latitude ? 'Update Current Location' : 'Set Current Stall Location'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                    title="Fine-tune on map"
                  >
                    <MapPin className="w-4 h-4 text-orange-400" />
                    <span>Map</span>
                  </button>
                </div>

                {lastLocationUpdated && (
                  <p className="text-[10px] text-slate-500 text-center">
                    Last updated: {new Date(lastLocationUpdated).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: HOURS & UPI PAYMENTS */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 border-b border-slate-800 pb-2 mb-3">
            3. Operating Hours &amp; Direct UPI Payouts
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Opening Time
              </label>
              <input
                type="text"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Closing Time
              </label>
              <input
                type="text"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                placeholder="11:00 PM"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              Direct UPI ID for Customer Payouts
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. foodfaxpartner@okaxis or 9845012345@paytm"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Payments from QR orders will settle instantly directly to this UPI address.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving store settings...</span>
            </>
          ) : (
            <span>Launch FoodFax Owner Dashboard</span>
          )}
        </button>
      </form>

      {/* Map Picker Modal */}
      {showMapModal && (
        <ShopLocationPickerModal
          initialLat={latitude || 19.0760}
          initialLng={longitude || 72.8777}
          initialAddress={address}
          initialArea={area}
          isMobileStall={isMobileStall}
          onConfirm={handleMapConfirm}
          onClose={() => setShowMapModal(false)}
        />
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { ShopLocationPickerModal } from '../components/ShopLocationPickerModal';
import { formatLocationRelativeTime } from '../utils/locationUtils';
import { 
  X, 
  Store, 
  MapPin, 
  Navigation, 
  Loader2, 
  Building2, 
  Truck, 
  Clock, 
  Check, 
  Compass,
  CreditCard,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

interface ShopProfileModalProps {
  onClose: () => void;
}

export const ShopProfileModal: React.FC<ShopProfileModalProps> = ({ onClose }) => {
  const { shop, saveShop } = useOwnerApp();

  const [name, setName] = useState(shop?.name || '');
  const [shopType, setShopType] = useState(shop?.shopType || 'Restaurant / Cafe');
  const [isMobileStall, setIsMobileStall] = useState<boolean>(shop?.isMobileStall ?? false);
  const [photoUrl, setPhotoUrl] = useState(shop?.logoUrl || shop?.bannerUrl || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [description, setDescription] = useState(shop?.description || '');
  const [phone, setPhone] = useState(shop?.phone || '');
  const [address, setAddress] = useState(shop?.address || '');
  const [area, setArea] = useState(shop?.area || '');
  const [city, setCity] = useState(shop?.city || '');
  const [pincode, setPincode] = useState(shop?.pincode || '');
  const [openingTime, setOpeningTime] = useState(shop?.openingTime || '10:00 AM');
  const [closingTime, setClosingTime] = useState(shop?.closingTime || '11:00 PM');
  const [upiId, setUpiId] = useState(shop?.upiId || '');

  // Geospatial states
  const [latitude, setLatitude] = useState<number | undefined>(shop?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(shop?.longitude);
  const [locationAccuracy, setLocationAccuracy] = useState<number | undefined>(shop?.locationAccuracyMeters);
  const [lastLocationUpdated, setLastLocationUpdated] = useState<string | undefined>(shop?.lastLocationUpdatedAt);

  const [locating, setLocating] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const photoFileInputRef = useRef<HTMLInputElement>(null);

  // Client-side photo compression and upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(compressed);
        } else {
          setPhotoUrl(event.target?.result as string);
        }
        setIsUploadingPhoto(false);
      };
      img.onerror = () => {
        setIsUploadingPhoto(false);
        alert('Failed to process image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      alert('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  // Update Current Stall Location (On-demand GPS, explicit click only)
  const handleUpdateCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));
        const newAcc = Math.round(pos.coords.accuracy);
        const timestamp = new Date().toISOString();

        setLatitude(newLat);
        setLongitude(newLng);
        setLocationAccuracy(newAcc);
        setLastLocationUpdated(timestamp);
        setLocating(false);

        // Immediate persistence for mobile stalls
        await saveShop({
          latitude: newLat,
          longitude: newLng,
          locationAccuracyMeters: newAcc,
          lastLocationUpdatedAt: timestamp,
          isMobileStall: true,
        });

        setSaveSuccessMsg('Current stall location updated via GPS!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
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
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    if (loc.accuracy) setLocationAccuracy(loc.accuracy);
    const timestamp = new Date().toISOString();
    setLastLocationUpdated(timestamp);

    if (loc.address) setAddress(loc.address);
    if (loc.area) setArea(loc.area);

    await saveShop({
      latitude: loc.latitude,
      longitude: loc.longitude,
      locationAccuracyMeters: loc.accuracy,
      lastLocationUpdatedAt: timestamp,
      address: loc.address || address,
      area: loc.area || area,
    });

    setSaveSuccessMsg('Location coordinates saved successfully!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveShop({
      name: name.trim(),
      shopType,
      isMobileStall,
      description: description.trim(),
      phone: phone.trim(),
      address: address.trim(),
      area: area.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      openingTime,
      closingTime,
      upiId: upiId.trim(),
      latitude,
      longitude,
      locationAccuracyMeters: locationAccuracy,
      lastLocationUpdatedAt: lastLocationUpdated,
      logoUrl: photoUrl,
      bannerUrl: photoUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
      <div className="bg-[#0B0F19] border border-[#1E293B] rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#F97316]" />
            <h3 className="text-base font-black text-white">Shop Profile &amp; Location</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Business Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Business / Shop Model</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileStall(false);
                  if (shopType.includes('Stall')) setShopType('Restaurant / Cafe');
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  !isMobileStall
                    ? 'bg-orange-600/15 border-orange-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4 text-orange-400" />
                <span>Permanent Restaurant</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileStall(true);
                  if (!shopType.includes('Stall')) setShopType('Food Stall / Food Cart');
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isMobileStall
                    ? 'bg-orange-600/15 border-orange-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Truck className="w-4 h-4 text-orange-400" />
                <span>Mobile Food Stall</span>
              </button>
            </div>
          </div>

          {/* Basic Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isMobileStall ? 'Stall / Cart Name' : 'Restaurant Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Cuisine / Shop Type</label>
            <input
              type="text"
              value={shopType}
              onChange={(e) => setShopType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
            />
          </div>

          {/* SHOP STOREFRONT PHOTO UPLOAD SECTION */}
          <div className="p-4 rounded-2xl bg-[#131B2E] border border-[#1E293B] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Shop Photo / Storefront
                </h4>
              </div>
              {photoUrl && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-300">
                  Added
                </span>
              )}
            </div>

            <input
              ref={photoFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {photoUrl ? (
              <div className="space-y-2.5">
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#23304A] bg-[#0B0F19]">
                  <img
                    src={photoUrl}
                    alt="Shop preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-[11px] font-bold text-white truncate">
                      {name || 'Storefront Image'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    onClick={() => photoFileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                    <span>Change Photo</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    onClick={() => setPhotoUrl('')}
                    className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isUploadingPhoto && photoFileInputRef.current?.click()}
                className="w-full p-4 rounded-xl border border-dashed border-orange-500/40 hover:border-orange-500 bg-orange-500/5 hover:bg-orange-500/10 flex flex-col items-center justify-center text-center cursor-pointer transition group"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center text-[#F97316] mb-1.5 group-hover:scale-105 transition">
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </div>
                <p className="text-xs font-bold text-white">
                  {isUploadingPhoto ? 'Processing photo...' : 'Click to Upload Shop / Stall Photo'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  JPG, PNG, WebP • Auto-optimized for customer app display
                </p>
              </div>
            )}
          </div>

          {/* DEDICATED LOCATION SECTION (Section 2 Requirements) */}
          <div className="p-4 rounded-2xl bg-[#131B2E] border border-[#1E293B] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Location Information
                </h4>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isMobileStall ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                {isMobileStall ? 'Mobile Stall' : 'Permanent Outlet'}
              </span>
            </div>

            {/* Latitude / Longitude & Accuracy */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#0B0F19] rounded-xl border border-[#23304A]">
              <div>
                <p className="text-[10px] text-slate-400">Current Coordinates</p>
                <p className="text-xs font-bold text-white font-mono mt-0.5">
                  {latitude && longitude
                    ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                    : 'Not pinned yet'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">Accuracy &amp; GPS</p>
                <p className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                  {locationAccuracy ? `±${locationAccuracy} meters` : 'Standard'}
                </p>
              </div>
            </div>

            {/* Status / Last Updated String */}
            <div className="text-xs text-slate-300 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Last Location Updated:</span>
              <span className="text-[11px] font-bold text-orange-400">
                {isMobileStall
                  ? `Current stall location ${formatLocationRelativeTime(lastLocationUpdated).toLowerCase()}`
                  : formatLocationRelativeTime(lastLocationUpdated)}
              </span>
            </div>

            {/* Location Action Buttons based on Stall vs Restaurant */}
            <div className="pt-1">
              {isMobileStall ? (
                /* Mobile Stall: "Update Current Location" button */
                <button
                  type="button"
                  onClick={handleUpdateCurrentLocation}
                  disabled={locating}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-orange-950 cursor-pointer"
                >
                  {locating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  <span>Update Current Location</span>
                </button>
              ) : (
                /* Permanent Restaurant: "Edit Location" button */
                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Edit Location on Map</span>
                </button>
              )}
            </div>

            {/* Map Preview Snapshot */}
            <div 
              onClick={() => setShowMapModal(true)}
              className="relative h-28 rounded-xl bg-[#070b14] border border-[#23304A] overflow-hidden cursor-pointer group"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.1) 0%, transparent 70%),
                  linear-gradient(to right, rgba(30, 41, 59, 0.4) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(30, 41, 59, 0.4) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 20px 20px, 20px 20px'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg border border-white">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold text-white bg-slate-900/90 px-1.5 py-0.5 rounded shadow mt-1">
                    {name || 'Shop Location'}
                  </span>
                </div>
              </div>
              <div className="absolute right-2 bottom-2 text-[9px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800 group-hover:text-orange-400 transition">
                Tap to expand map
              </div>
            </div>
          </div>

          {/* Address Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isMobileStall ? 'Current Street Spot / Landmark' : 'Street Address'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Shop #14, Ground Floor, 100ft Road"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Area / Locality</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Bandra West"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="e.g. 400050"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
            />
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                Opens At
              </label>
              <input
                type="text"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                Closes At
              </label>
              <input
                type="text"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          {/* Direct UPI ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-slate-500" />
              Settlement UPI ID
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. foodfax@okaxis"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950 transition cursor-pointer"
          >
            Save All Changes
          </button>
        </form>
      </div>

      {/* Map Modal */}
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

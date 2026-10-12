import React, { useState, useRef, useEffect } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { ShopLocationPickerModal } from '../components/ShopLocationPickerModal';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';
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
  Compass,
  Camera,
  Upload,
  Trash2,
  ShieldCheck,
  FileText,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  X
} from 'lucide-react';

export const ShopSetupScreen: React.FC = () => {
  const { ownerProfile, saveShop, isLoading, setActiveScreen, shop, errorMessage } = useOwnerApp();

  // 2-Part Form Navigation: Part 1 (Shop Details) & Part 2 (Document Verification)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Business Type Selection (Permanent Restaurant vs Mobile Food Stall)
  const [isMobileStall, setIsMobileStall] = useState<boolean>(shop?.isMobileStall ?? false);
  const [shopType, setShopType] = useState(shop?.shopType || 'Restaurant / Cafe');

  // Form Fields - Part 1 (All Mandatory)
  const [shopName, setShopName] = useState(shop?.name || '');
  const [photoUrl, setPhotoUrl] = useState(shop?.logoUrl || shop?.bannerUrl || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [description, setDescription] = useState(shop?.description || '');
  const [phone, setPhone] = useState(shop?.phone || ownerProfile?.phone || '');
  const [address, setAddress] = useState(shop?.address || '');
  const [area, setArea] = useState(shop?.area || '');
  const [city, setCity] = useState(shop?.city && shop.city !== 'Bengaluru' ? shop.city : '');
  const [state, setState] = useState(shop?.state && shop.state !== 'Karnataka' ? shop.state : '');
  const [pincode, setPincode] = useState(shop?.pincode || '');
  const [openingTime, setOpeningTime] = useState(shop?.openingTime || '10:00 AM');
  const [closingTime, setClosingTime] = useState(shop?.closingTime || '11:00 PM');
  const [upiId, setUpiId] = useState(shop?.upiId || '');

  // Documents & KYC Fields - Part 2 (All Mandatory)
  // 1. FSSAI Food Safety License / Registration
  const [fssaiNumber, setFssaiNumber] = useState<string>(shop?.fssaiNumber || '');
  const [fssaiDocUrl, setFssaiDocUrl] = useState<string>(shop?.fssaiDocUrl || '');
  const [fssaiDocName, setFssaiDocName] = useState<string>(shop?.fssaiDocName || '');
  const [isUploadingFssai, setIsUploadingFssai] = useState<boolean>(false);
  const fssaiFileInputRef = useRef<HTMLInputElement>(null);

  // 2. Owner Identity Proof (Aadhaar / PAN)
  const [ownerIdType, setOwnerIdType] = useState<'aadhaar' | 'pan'>(shop?.ownerIdType || 'aadhaar');
  const [ownerIdNumber, setOwnerIdNumber] = useState<string>(shop?.ownerIdNumber || '');
  const [ownerIdDocUrl, setOwnerIdDocUrl] = useState<string>(shop?.ownerIdDocUrl || '');
  const [ownerIdDocName, setOwnerIdDocName] = useState<string>(shop?.ownerIdDocName || '');
  const [isUploadingOwnerId, setIsUploadingOwnerId] = useState<boolean>(false);
  const ownerIdFileInputRef = useRef<HTMLInputElement>(null);

  // 3. Address Verification Document (Shop Physical Location)
  const [addressProofType, setAddressProofType] = useState<string>(
    shop?.addressProofType || 'Electricity Bill (Recent 3 Months)'
  );
  const [addressProofDocUrl, setAddressProofDocUrl] = useState<string>(shop?.addressProofDocUrl || '');
  const [addressProofDocName, setAddressProofDocName] = useState<string>(shop?.addressProofDocName || '');
  const [isUploadingAddressProof, setIsUploadingAddressProof] = useState<boolean>(false);
  const addressProofFileInputRef = useRef<HTMLInputElement>(null);

  // 4. Municipal Street Food Cart Trade Permit / Local Authority License
  const [tradePermitType, setTradePermitType] = useState<string>(
    shop?.tradePermitType || (shop?.isMobileStall ? 'Street Food Vending Certificate (TVC ID)' : 'Municipal Health Trade License')
  );
  const [tradePermitNumber, setTradePermitNumber] = useState<string>(shop?.tradePermitNumber || '');
  const [tradePermitDocUrl, setTradePermitDocUrl] = useState<string>(shop?.tradePermitDocUrl || '');
  const [tradePermitDocName, setTradePermitDocName] = useState<string>(shop?.tradePermitDocName || '');
  const [isUploadingTradePermit, setIsUploadingTradePermit] = useState<boolean>(false);
  const tradePermitFileInputRef = useRef<HTMLInputElement>(null);

  const photoFileInputRef = useRef<HTMLInputElement>(null);

  // Geospatial Fields
  const [latitude, setLatitude] = useState<number | undefined>(shop?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(shop?.longitude);
  const [locationAccuracy, setLocationAccuracy] = useState<number | undefined>(shop?.locationAccuracyMeters);
  const [lastLocationUpdated, setLastLocationUpdated] = useState<string | undefined>(shop?.lastLocationUpdatedAt);
  
  // UI & Validation States
  const [locating, setLocating] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [missingFieldId, setMissingFieldId] = useState<string | null>(null);
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);

  // Categories
  const stallCategories = [
    'Food Stall & Food Cart',
    'Chaat & Street Food Cart',
    'Chai & Snack Cart',
    'Momo & Fast Food Stall',
    'Juice & Beverage Stall',
    'South Indian Tiffin Cart',
  ];

  const restaurantCategories = [
    'Restaurant / Cafe',
    'Fast Food & QSR',
    'Bakery & Desserts',
    'Fine Dine & Bistro',
    'Cloud Kitchen / Delivery Outlet',
    'Dhaba & Family Restaurant',
  ];

  // Storefront Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerFieldAlert('field-photo', 'Please select a valid image file (JPG, PNG).', 1);
      return;
    }

    setIsUploadingPhoto(true);
    setFormError(null);
    setMissingFieldId(null);

    // Try Supabase Storage 'shop-assets' bucket first to eliminate DB egress bloat
    try {
      const shopIdentifier = shop?.id || ownerProfile?.id || 'shop_' + Math.random().toString(36).substring(2, 8);
      const res = await storageService.uploadShopAsset(file, shopIdentifier, 'logo');
      if (res.isStorageUrl && res.url) {
        setPhotoUrl(res.url);
        setIsUploadingPhoto(false);
        soundService.playSuccessTone();
        return;
      }
    } catch (_) {}

    // Fallback: compact compression (max 800px, 0.70 quality) to protect bandwidth
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
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
          setPhotoUrl(canvas.toDataURL('image/jpeg', 0.70));
        } else {
          setPhotoUrl(event.target?.result as string);
        }
        setIsUploadingPhoto(false);
        soundService.playSuccessTone();
      };
      img.onerror = () => {
        setIsUploadingPhoto(false);
        triggerFieldAlert('field-photo', 'Failed to process image file.', 1);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      triggerFieldAlert('field-photo', 'Failed to read image file.', 1);
    };
    reader.readAsDataURL(file);
  };

  // Normal file processor for documents (PDF & Images)
  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setUrl: (url: string) => void,
    setName: (name: string) => void,
    setUploading: (loading: boolean) => void,
    fieldId: string,
    docType: string = 'kyc_doc'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      triggerFieldAlert(fieldId, 'File size exceeds 10MB limit. Please upload a smaller file.', 2);
      return;
    }

    setUploading(true);
    setFormError(null);
    setMissingFieldId(null);

    // 1. First attempt to upload to Supabase Storage CDN (Zero DB storage, Zero egress bloat)
    try {
      const shopIdentifier = shop?.id || ownerProfile?.id || 'shop_' + Math.random().toString(36).substring(2, 8);
      const storageRes = await storageService.uploadKycDoc(file, shopIdentifier, docType);
      if (storageRes.isStorageUrl && storageRes.url) {
        setUrl(storageRes.url);
        setName(file.name);
        setUploading(false);
        soundService.playSuccessTone();
        return;
      }
    } catch (_) {}

    // 2. Safe Fallback: Compress image to compact dimensions so base64 string is minimal
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800; // compact dimension to prevent excessive egress
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
            setUrl(canvas.toDataURL('image/jpeg', 0.65)); // 65% quality ~40-60KB
          } else {
            setUrl(dataUrl);
          }
          setName(file.name);
          setUploading(false);
          soundService.playSuccessTone();
        };
        img.onerror = () => {
          setUrl(dataUrl);
          setName(file.name);
          setUploading(false);
        };
        img.src = dataUrl;
      } else {
        setUrl(dataUrl);
        setName(file.name);
        setUploading(false);
        soundService.playSuccessTone();
      }
    };
    reader.onerror = () => {
      setUploading(false);
      triggerFieldAlert(fieldId, 'Failed to read file. Please try again.', 2);
    };
    reader.readAsDataURL(file);
  };

  // On-demand GPS fetch for mobile stalls
  const handleFetchStallLocation = () => {
    setFormError(null);
    if (!navigator.geolocation) {
      triggerFieldAlert('field-location', 'Geolocation not supported. Please select location on map.', 1);
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
        setMissingFieldId(null);
        soundService.playSuccessTone();
      },
      (err) => {
        console.warn('GPS error:', err);
        setLocating(false);
        triggerFieldAlert('field-location', 'Could not fetch GPS. Please select spot using map picker.', 1);
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  const handleMapConfirm = (loc: {
    latitude: number;
    longitude: number;
    address?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    accuracy?: number;
  }) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    if (loc.accuracy) setLocationAccuracy(loc.accuracy);
    setLastLocationUpdated(new Date().toISOString());

    if (loc.address) setAddress(loc.address);
    if (loc.area) setArea(loc.area);
    if (loc.city) setCity(loc.city);
    if (loc.state) setState(loc.state);
    if (loc.pincode) setPincode(loc.pincode);

    setMissingFieldId(null);
    soundService.playSuccessTone();
  };

  /**
   * Triggers an alert popup, sets form error, switches to the target step,
   * highlights the missing field and scrolls smoothly right to it!
   */
  const triggerFieldAlert = (fieldId: string, errorMessage: string, targetStep: 1 | 2) => {
    try {
      soundService.playAlertTone();
    } catch (_) {}

    setFormError(errorMessage);
    setMissingFieldId(fieldId);
    setShowAlertModal(true);

    if (currentStep !== targetStep) {
      setCurrentStep(targetStep);
    }

    // Direct smooth scroll and focus to the missing field
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const focusable = el.querySelector('input, select, textarea, button') as HTMLElement | null;
        if (focusable && typeof focusable.focus === 'function') {
          focusable.focus();
        }
      }
    }, 120);
  };

  // Validate Part 1 mandatory fields
  const validatePart1 = (): boolean => {
    if (!shopName.trim()) {
      triggerFieldAlert('field-shopName', 'Please enter your Shop / Business Name.', 1);
      return false;
    }
    if (!shopType.trim()) {
      triggerFieldAlert('field-shopType', 'Please select a Food Category.', 1);
      return false;
    }
    if (!description.trim()) {
      triggerFieldAlert('field-description', 'Please enter Specialties or Tagline for your shop.', 1);
      return false;
    }
    if (!photoUrl.trim()) {
      triggerFieldAlert('field-photo', 'Please upload a Storefront / Shop Photo.', 1);
      return false;
    }
    if (!address.trim()) {
      triggerFieldAlert(
        'field-address',
        isMobileStall ? 'Please enter your street spot / landmark.' : 'Please enter your street address.',
        1
      );
      return false;
    }
    if (!area.trim()) {
      triggerFieldAlert('field-area', 'Please enter your Area or Locality.', 1);
      return false;
    }
    if (!city.trim()) {
      triggerFieldAlert('field-city', 'Please enter your City.', 1);
      return false;
    }
    if (!state.trim()) {
      triggerFieldAlert('field-state', 'Please enter your State.', 1);
      return false;
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      triggerFieldAlert('field-pincode', 'Please enter a valid 6-digit Pincode.', 1);
      return false;
    }
    if (!latitude || !longitude) {
      triggerFieldAlert('field-location', 'Please confirm exact Shop Location coordinates on Map or GPS.', 1);
      return false;
    }
    if (!openingTime.trim()) {
      triggerFieldAlert('field-openingTime', 'Please enter Shop Opening Time.', 1);
      return false;
    }
    if (!closingTime.trim()) {
      triggerFieldAlert('field-closingTime', 'Please enter Shop Closing Time.', 1);
      return false;
    }
    if (!upiId.trim() || !upiId.includes('@')) {
      triggerFieldAlert('field-upiId', 'Please enter a valid UPI ID (e.g. name@okaxis) for direct QR payments.', 1);
      return false;
    }
    return true;
  };

  // Validate Part 2 mandatory fields
  const validatePart2 = (): boolean => {
    // 1. FSSAI Number & Document
    if (!fssaiNumber.trim() || fssaiNumber.trim().length !== 14) {
      triggerFieldAlert('field-fssaiNumber', 'Please enter a valid 14-digit FSSAI Registration / License Number.', 2);
      return false;
    }
    if (!fssaiDocUrl.trim()) {
      triggerFieldAlert('field-fssaiDoc', 'Please upload your FSSAI Certificate document (PDF / Image).', 2);
      return false;
    }

    // 2. Owner ID Number & Document
    if (ownerIdType === 'aadhaar') {
      if (!ownerIdNumber.trim() || ownerIdNumber.trim().length !== 12) {
        triggerFieldAlert('field-ownerIdNumber', 'Please enter a valid 12-digit Aadhaar Number.', 2);
        return false;
      }
    } else {
      if (!ownerIdNumber.trim() || ownerIdNumber.trim().length !== 10) {
        triggerFieldAlert('field-ownerIdNumber', 'Please enter a valid 10-character PAN Number.', 2);
        return false;
      }
    }
    if (!ownerIdDocUrl.trim()) {
      triggerFieldAlert(
        'field-ownerIdDoc',
        `Please upload your ${ownerIdType === 'aadhaar' ? 'Aadhaar' : 'PAN'} Card Document (PDF / Image).`,
        2
      );
      return false;
    }

    // 3. Address Verification Document
    if (!addressProofDocUrl.trim()) {
      triggerFieldAlert(
        'field-addressProofDoc',
        'Please upload an Address Verification Document (Electricity bill, Rent agreement, Gumasta, etc.).',
        2
      );
      return false;
    }

    // 4. Municipal Trade Permit / License Number & Document
    if (!tradePermitNumber.trim()) {
      triggerFieldAlert(
        'field-tradePermitNumber',
        'Please enter your Municipal Trade Permit / Street Vending License Number.',
        2
      );
      return false;
    }
    if (!tradePermitDocUrl.trim()) {
      triggerFieldAlert(
        'field-tradePermitDoc',
        'Please upload your Municipal Trade Permit / Street Vending License Document (PDF / Image).',
        2
      );
      return false;
    }

    return true;
  };

  // Switch to Part 2 with validation
  const goToPart2 = () => {
    setFormError(null);
    setMissingFieldId(null);
    if (!validatePart1()) {
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    soundService.playSuccessTone();
  };

  // Return to Part 1
  const goToPart1 = () => {
    setFormError(null);
    setMissingFieldId(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setMissingFieldId(null);

    // Strict validation of both Part 1 and Part 2
    if (!validatePart1()) return;
    if (!validatePart2()) return;

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
      logoUrl: photoUrl || undefined,
      bannerUrl: photoUrl || undefined,

      // KYC Verification Documents
      fssaiNumber: fssaiNumber.trim(),
      fssaiDocUrl: fssaiDocUrl.trim(),
      fssaiDocName: fssaiDocName.trim(),

      ownerIdType,
      ownerIdNumber: ownerIdNumber.trim(),
      ownerIdDocUrl: ownerIdDocUrl.trim(),
      ownerIdDocName: ownerIdDocName.trim(),

      addressProofType,
      addressProofDocUrl: addressProofDocUrl.trim(),
      addressProofDocName: addressProofDocName.trim(),

      tradePermitType,
      tradePermitNumber: tradePermitNumber.trim(),
      tradePermitDocUrl: tradePermitDocUrl.trim(),
      tradePermitDocName: tradePermitDocName.trim(),

      kycDocuments: {
        fssaiNumber: fssaiNumber.trim(),
        fssaiDocUrl: fssaiDocUrl.trim(),
        fssaiDocName: fssaiDocName.trim(),
        ownerIdType,
        ownerIdNumber: ownerIdNumber.trim(),
        ownerIdDocUrl: ownerIdDocUrl.trim(),
        ownerIdDocName: ownerIdDocName.trim(),
        addressProofType,
        addressProofDocUrl: addressProofDocUrl.trim(),
        addressProofDocName: addressProofDocName.trim(),
        tradePermitType,
        tradePermitNumber: tradePermitNumber.trim(),
        tradePermitDocUrl: tradePermitDocUrl.trim(),
        tradePermitDocName: tradePermitDocName.trim(),
        submittedAt: new Date().toISOString(),
      },
    });

    if (success) {
      soundService.playSuccessTone();
      setActiveScreen('kyc_status');
    } else {
      setShowAlertModal(true);
      setFormError(errorMessage || 'Failed to save restaurant details to the database. Please verify your Supabase database connection and service quota.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-3.5 sm:px-5 py-6 sm:py-8 max-w-xl mx-auto select-none">
      
      {/* Top Brand Header */}
      <div className="text-center mb-5 sm:mb-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center mx-auto mb-2.5 shadow-md shadow-orange-600/30">
          <Store className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
          Configure Your FoodFax Shop
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-sm mx-auto leading-normal">
          Welcome, {ownerProfile?.fullName || 'Partner'}! Please fill all mandatory details in 2 steps.
        </p>
      </div>

      {/* Responsive & Balanced 2-Tab Progress Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 mb-5 grid grid-cols-2 gap-1.5 shadow-sm">
        <button
          type="button"
          onClick={goToPart1}
          className={`h-13 sm:h-14 rounded-xl flex items-center justify-center gap-2.5 px-3 transition cursor-pointer text-left ${
            currentStep === 1
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            currentStep === 1 ? 'bg-white text-orange-600' : 'bg-slate-800 text-slate-400'
          }`}>
            1
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate leading-tight">1. Shop Details</p>
            <p className={`text-[10px] truncate leading-tight mt-0.5 ${currentStep === 1 ? 'text-orange-100' : 'text-slate-500'}`}>
              Profile &amp; Hours
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={goToPart2}
          className={`h-13 sm:h-14 rounded-xl flex items-center justify-center gap-2.5 px-3 transition cursor-pointer text-left ${
            currentStep === 2
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            currentStep === 2 ? 'bg-white text-orange-600' : 'bg-slate-800 text-slate-400'
          }`}>
            2
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate leading-tight">2. Documents</p>
            <p className={`text-[10px] truncate leading-tight mt-0.5 ${currentStep === 2 ? 'text-orange-100' : 'text-slate-500'}`}>
              KYC Verification
            </p>
          </div>
        </button>
      </div>

      {/* Alert Modal for Missing / Incomplete Fields */}
      {showAlertModal && formError && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-11 h-11 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center mb-3 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white text-center">
              {missingFieldId ? 'Missing Required Detail' : 'Database Submission Error'}
            </h3>
            <p className="text-xs text-red-300 text-center mt-1.5 leading-relaxed bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
              {formError}
            </p>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              {missingFieldId
                ? 'All details are mandatory to submit your shop for verification.'
                : 'Please verify database connectivity and billing limits before proceeding.'}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAlertModal(false);
                  if (missingFieldId) {
                    const el = document.getElementById(missingFieldId);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      const focusable = el.querySelector('input, select, textarea, button') as HTMLElement | null;
                      if (focusable && typeof focusable.focus === 'function') focusable.focus();
                    }
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Go Fill Field (यहाँ भरें)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Notification Banner */}
      {formError && !showAlertModal && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="leading-snug">{formError}</span>
          </div>
          <button 
            type="button" 
            onClick={() => { setFormError(null); setMissingFieldId(null); }} 
            className="text-red-400 hover:text-white cursor-pointer ml-2 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================
          PART 1: SHOP & LOCATION DETAILS
      ======================================================== */}
      {currentStep === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Section Header */}
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Part 1: Store &amp; Location Details</span>
              <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full">
                All Fields Required *
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 leading-normal">
              Enter your shop profile, exact coordinates and business operating hours.
            </p>
          </div>

          {/* Business Model Selection */}
          <div id="field-businessType">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Business Model <span className="text-red-400 font-bold">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsMobileStall(false);
                  setShopType('Restaurant / Cafe');
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between h-full min-h-[105px] ${
                  !isMobileStall
                    ? 'bg-orange-500/10 border-orange-500 text-white ring-1 ring-orange-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <Building2 className={`w-5 h-5 ${!isMobileStall ? 'text-orange-400' : 'text-slate-500'}`} />
                  {!isMobileStall && <CheckCircle2 className="w-4 h-4 text-orange-400" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Restaurant / Cafe</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Fixed outlet with door pin</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileStall(true);
                  setShopType('Food Stall & Food Cart');
                }}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between h-full min-h-[105px] ${
                  isMobileStall
                    ? 'bg-orange-500/10 border-orange-500 text-white ring-1 ring-orange-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <Truck className={`w-5 h-5 ${isMobileStall ? 'text-orange-400' : 'text-slate-500'}`} />
                  {isMobileStall && <CheckCircle2 className="w-4 h-4 text-orange-400" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Food Stall / Cart</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Street cart with GPS spot</p>
                </div>
              </button>
            </div>
          </div>

          {/* Shop Name */}
          <div id="field-shopName">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isMobileStall ? 'Stall / Cart Brand Name' : 'Restaurant / Outlet Name'} <span className="text-red-400 font-bold">*</span>
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => {
                setShopName(e.target.value);
                if (missingFieldId === 'field-shopName') setMissingFieldId(null);
              }}
              placeholder={isMobileStall ? 'e.g. Ramesh Vada Pav Center' : 'e.g. Royal Spice Bistro'}
              className={`h-11 w-full bg-slate-950 border rounded-xl px-3.5 text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition ${
                missingFieldId === 'field-shopName'
                  ? 'border-red-500 ring-2 ring-red-500/30'
                  : 'border-slate-800 focus:border-orange-500'
              }`}
            />
            {missingFieldId === 'field-shopName' && (
              <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Please enter your shop / brand name.
              </p>
            )}
          </div>

          {/* Food Category */}
          <div id="field-shopType">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Food Category <span className="text-red-400 font-bold">*</span>
            </label>
            <select
              value={shopType}
              onChange={(e) => {
                setShopType(e.target.value);
                if (missingFieldId === 'field-shopType') setMissingFieldId(null);
              }}
              className={`h-11 w-full bg-slate-950 border rounded-xl px-3.5 text-xs sm:text-sm text-white outline-none cursor-pointer transition ${
                missingFieldId === 'field-shopType'
                  ? 'border-red-500 ring-2 ring-red-500/30'
                  : 'border-slate-800 focus:border-orange-500'
              }`}
            >
              {(isMobileStall ? stallCategories : restaurantCategories).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Tagline / Specialties */}
          <div id="field-description">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Specialties &amp; Tagline <span className="text-red-400 font-bold">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (missingFieldId === 'field-description') setMissingFieldId(null);
              }}
              placeholder="e.g. Special Masala Dosa, Filter Coffee, Vada"
              className={`h-11 w-full bg-slate-950 border rounded-xl px-3.5 text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition ${
                missingFieldId === 'field-description'
                  ? 'border-red-500 ring-2 ring-red-500/30'
                  : 'border-slate-800 focus:border-orange-500'
              }`}
            />
            {missingFieldId === 'field-description' && (
              <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Please specify your specialties or menu tagline.
              </p>
            )}
          </div>

          {/* Storefront Photo Upload */}
          <div id="field-photo">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>
                Storefront Photo <span className="text-red-400 font-bold">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">JPG / PNG Photo</span>
            </label>

            <input
              ref={photoFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {photoUrl ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <img
                  src={photoUrl}
                  alt="Shop"
                  className="w-14 h-14 rounded-lg object-cover border border-slate-800 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">Storefront Photo Uploaded</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">Ready for customer discovery</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                    title="Change photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => !isUploadingPhoto && photoFileInputRef.current?.click()}
                className={`h-11 sm:h-12 w-full px-3 rounded-xl border bg-slate-950 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition ${
                  missingFieldId === 'field-photo'
                    ? 'border-red-500 ring-2 ring-red-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                    <span>Processing photo...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-orange-400" />
                    <span>Upload Storefront / Shop Photo *</span>
                  </>
                )}
              </button>
            )}
            {missingFieldId === 'field-photo' && (
              <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Storefront photo is mandatory.
              </p>
            )}
          </div>

          {/* Location & Address Section */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>Location &amp; Address</span>
            </h3>

            {isMobileStall && (
              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[11px] leading-relaxed">
                💡 Street stall coordinates can be updated whenever you park at a new corner. FoodFax does not track in background.
              </div>
            )}

            <div id="field-address">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isMobileStall ? 'Street Spot / Landmark' : 'Street Address'} <span className="text-red-400 font-bold">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (missingFieldId === 'field-address') setMissingFieldId(null);
                }}
                placeholder={isMobileStall ? 'e.g. Near Metro Gate 2 / Chowpatty Corner' : 'e.g. Shop #4, Ground Floor, MG Road'}
                className={`h-11 w-full bg-slate-950 border rounded-xl px-3.5 text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition ${
                  missingFieldId === 'field-address'
                    ? 'border-red-500 ring-2 ring-red-500/30'
                    : 'border-slate-800 focus:border-orange-500'
                }`}
              />
              {missingFieldId === 'field-address' && (
                <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Address / street spot is mandatory.
                </p>
              )}
            </div>

            {/* Area & City (Stacked on small screens, 2-cols on tablet/desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div id="field-area">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Area / Locality <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    if (missingFieldId === 'field-area') setMissingFieldId(null);
                  }}
                  placeholder="e.g. Indiranagar or Bandra West"
                  className={`h-11 w-full bg-slate-950 border rounded-xl px-3.5 text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition ${
                    missingFieldId === 'field-area'
                      ? 'border-red-500 ring-2 ring-red-500/30'
                      : 'border-slate-800 focus:border-orange-500'
                  }`}
                />
                {missingFieldId === 'field-area' && (
                  <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Area is required.
                  </p>
                )}
              </div>

              <div id="field-city">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  City <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (missingFieldId === 'field-city') setMissingFieldId(null);
                  }}
                  placeholder="e.g. Bengaluru or Mumbai"
                  className={`h-11 w-full bg-slate-950 border rounded-xl px-3.5 text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition ${
                    missingFieldId === 'field-city'
                      ? 'border-red-500 ring-2 ring-red-500/30'
                      : 'border-slate-800 focus:border-orange-500'
                  }`}
                />
                {missingFieldId === 'field-city' && (
                  <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> City is required.
                  </p>
                )}
              </div>
            </div>

            {/* State & Pincode (Stacked on small screens, 2-cols on tablet/desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div id="field-state">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  State <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    if (missingFieldId === 'field-state') setMissingFieldId(null);
                  }}
                  placeholder="e.g. Karnataka or Maharashtra"
                  className={`h-11 w-full bg-slate-950 border rounded-xl px-3.5 text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition ${
                    missingFieldId === 'field-state'
                      ? 'border-red-500 ring-2 ring-red-500/30'
                      : 'border-slate-800 focus:border-orange-500'
                  }`}
                />
                {missingFieldId === 'field-state' && (
                  <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> State is required.
                  </p>
                )}
              </div>

              <div id="field-pincode">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pincode (6 Digits) <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={pincode}
                  maxLength={6}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (missingFieldId === 'field-pincode') setMissingFieldId(null);
                  }}
                  placeholder="e.g. 560038"
                  className={`h-11 w-full bg-slate-950 border rounded-xl px-3.5 text-xs sm:text-sm text-white placeholder-slate-600 outline-none font-mono transition ${
                    missingFieldId === 'field-pincode'
                      ? 'border-red-500 ring-2 ring-red-500/30'
                      : 'border-slate-800 focus:border-orange-500'
                  }`}
                />
                {missingFieldId === 'field-pincode' && (
                  <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> 6-digit Pincode is required.
                  </p>
                )}
              </div>
            </div>

            {/* Map / GPS Pinning */}
            <div id="field-location" className="pt-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Exact Map Coordinates <span className="text-red-400 font-bold">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                {isMobileStall && (
                  <button
                    type="button"
                    onClick={handleFetchStallLocation}
                    disabled={locating}
                    className="h-11 flex-1 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition"
                  >
                    {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-orange-400" />}
                    <span>{latitude ? 'Update Stall GPS Spot' : 'Set GPS Location'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className={`h-11 ${isMobileStall ? 'flex-1' : 'w-full'} px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition ${
                    missingFieldId === 'field-location' ? 'border-red-500 ring-2 ring-red-500/30' : ''
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-orange-400" />
                  <span>{latitude ? 'Location Confirmed on Map' : 'Select Location on Map *'}</span>
                </button>
              </div>

              {latitude && longitude ? (
                <p className="text-[11px] text-emerald-400 font-mono text-center mt-1.5">
                  ✓ Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
              ) : (
                missingFieldId === 'field-location' && (
                  <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Please pin exact outlet spot on the map.
                  </p>
                )
              )}
            </div>
          </div>

          {/* Operating Hours & UPI */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Timings &amp; Direct UPI Payouts</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div id="field-openingTime">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Opening Time <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={openingTime}
                  onChange={(e) => {
                    setOpeningTime(e.target.value);
                    if (missingFieldId === 'field-openingTime') setMissingFieldId(null);
                  }}
                  placeholder="10:00 AM"
                  className={`h-11 w-full bg-slate-950 border rounded-xl px-3.5 text-xs sm:text-sm text-white outline-none transition ${
                    missingFieldId === 'field-openingTime'
                      ? 'border-red-500 ring-2 ring-red-500/30'
                      : 'border-slate-800 focus:border-orange-500'
                  }`}
                />
                {missingFieldId === 'field-openingTime' && (
                  <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Opening time required.
                  </p>
                )}
              </div>

              <div id="field-closingTime">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Closing Time <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={closingTime}
                  onChange={(e) => {
                    setClosingTime(e.target.value);
                    if (missingFieldId === 'field-closingTime') setMissingFieldId(null);
                  }}
                  placeholder="11:00 PM"
                  className={`h-11 w-full bg-slate-950 border rounded-xl px-3.5 text-xs sm:text-sm text-white outline-none transition ${
                    missingFieldId === 'field-closingTime'
                      ? 'border-red-500 ring-2 ring-red-500/30'
                      : 'border-slate-800 focus:border-orange-500'
                  }`}
                />
                {missingFieldId === 'field-closingTime' && (
                  <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Closing time required.
                  </p>
                )}
              </div>
            </div>

            <div id="field-upiId">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>UPI ID for QR Order Payments</span>
                  <span className="text-red-400 font-bold">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">e.g. shop@okaxis</span>
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  if (missingFieldId === 'field-upiId') setMissingFieldId(null);
                }}
                placeholder="e.g. foodfaxmerchant@okaxis or 9845012345@paytm"
                className={`h-11 w-full bg-slate-950 border rounded-xl px-3.5 text-xs sm:text-sm text-white placeholder-slate-600 outline-none transition ${
                  missingFieldId === 'field-upiId'
                    ? 'border-red-500 ring-2 ring-red-500/30'
                    : 'border-slate-800 focus:border-orange-500'
                }`}
              />
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                Customer QR payments will settle directly to this UPI address instantly.
              </p>
              {missingFieldId === 'field-upiId' && (
                <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Valid UPI ID (with @) is required.
                </p>
              )}
            </div>
          </div>

          {/* Next Button */}
          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={goToPart2}
              className="h-12 w-full rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 transition cursor-pointer"
            >
              <span>Next: Upload KYC Documents</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          PART 2: DOCUMENTS UPLOAD & VERIFICATION (ALL MANDATORY)
      ======================================================== */}
      {currentStep === 2 && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Header */}
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Part 2: Documents Verification</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Upload verification documents for <strong className="text-white">{shopName || 'your shop'}</strong>.
                </p>
              </div>
              <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-semibold shrink-0">
                Mandatory *
              </span>
            </div>
          </div>

          {/* 1. FSSAI License */}
          <div 
            id="field-fssaiSection"
            className={`bg-slate-950 border rounded-xl p-3.5 space-y-2.5 transition ${
              missingFieldId === 'field-fssaiNumber' || missingFieldId === 'field-fssaiDoc'
                ? 'border-red-500 ring-2 ring-red-500/20'
                : 'border-slate-800/80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  1. FSSAI Food Safety License / Registration <span className="text-red-400 font-bold">*</span>
                </label>
                <span className="text-[10px] text-red-400 font-medium">Required *</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                Enter your 14-digit FSSAI number and attach certificate.
              </p>
            </div>

            <div id="field-fssaiNumber">
              <input
                type="text"
                value={fssaiNumber}
                maxLength={14}
                onChange={(e) => {
                  setFssaiNumber(e.target.value.replace(/\D/g, '').slice(0, 14));
                  if (missingFieldId === 'field-fssaiNumber') setMissingFieldId(null);
                }}
                placeholder="14-digit FSSAI number (e.g. 11523998000123)"
                className={`h-11 w-full bg-slate-900 border rounded-lg px-3 text-xs sm:text-sm text-white placeholder-slate-600 outline-none font-mono transition ${
                  missingFieldId === 'field-fssaiNumber' ? 'border-red-500' : 'border-slate-800 focus:border-orange-500'
                }`}
              />
              {missingFieldId === 'field-fssaiNumber' && (
                <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> 14-digit FSSAI license number is required.
                </p>
              )}
            </div>

            <input
              ref={fssaiFileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleDocUpload(e, setFssaiDocUrl, setFssaiDocName, setIsUploadingFssai, 'field-fssaiDoc', 'fssai')}
            />

            <div id="field-fssaiDoc">
              {fssaiDocUrl ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-200 truncate">{fssaiDocName || 'FSSAI_Certificate'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fssaiFileInputRef.current?.click()}
                      className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer font-medium"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFssaiDocUrl(''); setFssaiDocName(''); }}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fssaiFileInputRef.current?.click()}
                  className={`h-11 w-full px-3 rounded-lg border bg-slate-900 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition ${
                    missingFieldId === 'field-fssaiDoc' ? 'border-red-500 ring-2 ring-red-500/30' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isUploadingFssai ? 'Uploading...' : 'Upload FSSAI Document (PDF / Image) *'}</span>
                </button>
              )}
              {missingFieldId === 'field-fssaiDoc' && (
                <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> FSSAI certificate document is required.
                </p>
              )}
            </div>
          </div>

          {/* 2. Owner Identity Proof */}
          <div 
            id="field-ownerIdSection"
            className={`bg-slate-950 border rounded-xl p-3.5 space-y-2.5 transition ${
              missingFieldId === 'field-ownerIdNumber' || missingFieldId === 'field-ownerIdDoc'
                ? 'border-red-500 ring-2 ring-red-500/20'
                : 'border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">
                2. Owner Identity Proof (Aadhaar / PAN) <span className="text-red-400 font-bold">*</span>
              </label>
              <span className="text-[10px] text-red-400 font-medium">Required *</span>
            </div>

            {/* Equal height Aadhaar / PAN toggle buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOwnerIdType('aadhaar')}
                className={`h-10 px-3 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center justify-center ${
                  ownerIdType === 'aadhaar'
                    ? 'bg-orange-500/10 border-orange-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Aadhaar (12 Digits)
              </button>
              <button
                type="button"
                onClick={() => setOwnerIdType('pan')}
                className={`h-10 px-3 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center justify-center ${
                  ownerIdType === 'pan'
                    ? 'bg-orange-500/10 border-orange-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                PAN (10 Characters)
              </button>
            </div>

            <div id="field-ownerIdNumber">
              <input
                type="text"
                value={ownerIdNumber}
                maxLength={ownerIdType === 'aadhaar' ? 12 : 10}
                onChange={(e) => {
                  if (ownerIdType === 'aadhaar') {
                    setOwnerIdNumber(e.target.value.replace(/\D/g, '').slice(0, 12));
                  } else {
                    setOwnerIdNumber(e.target.value.toUpperCase().slice(0, 10));
                  }
                  if (missingFieldId === 'field-ownerIdNumber') setMissingFieldId(null);
                }}
                placeholder={ownerIdType === 'aadhaar' ? 'Enter 12-digit Aadhaar Number' : 'Enter 10-character PAN Number (e.g. ABCDE1234F)'}
                className={`h-11 w-full bg-slate-900 border rounded-lg px-3 text-xs sm:text-sm text-white placeholder-slate-600 outline-none font-mono uppercase transition ${
                  missingFieldId === 'field-ownerIdNumber' ? 'border-red-500' : 'border-slate-800 focus:border-orange-500'
                }`}
              />
              {missingFieldId === 'field-ownerIdNumber' && (
                <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Valid {ownerIdType === 'aadhaar' ? '12-digit Aadhaar' : '10-character PAN'} number is required.
                </p>
              )}
            </div>

            <input
              ref={ownerIdFileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleDocUpload(e, setOwnerIdDocUrl, setOwnerIdDocName, setIsUploadingOwnerId, 'field-ownerIdDoc', 'owner_id')}
            />

            <div id="field-ownerIdDoc">
              {ownerIdDocUrl ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-200 truncate">{ownerIdDocName || `${ownerIdType.toUpperCase()}_Document`}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => ownerIdFileInputRef.current?.click()}
                      className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer font-medium"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOwnerIdDocUrl(''); setOwnerIdDocName(''); }}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => ownerIdFileInputRef.current?.click()}
                  className={`h-11 w-full px-3 rounded-lg border bg-slate-900 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition ${
                    missingFieldId === 'field-ownerIdDoc' ? 'border-red-500 ring-2 ring-red-500/30' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isUploadingOwnerId ? 'Uploading...' : `Upload ${ownerIdType === 'aadhaar' ? 'Aadhaar' : 'PAN'} File (PDF / Image) *`}</span>
                </button>
              )}
              {missingFieldId === 'field-ownerIdDoc' && (
                <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {ownerIdType === 'aadhaar' ? 'Aadhaar' : 'PAN'} card document is required.
                </p>
              )}
            </div>
          </div>

          {/* 3. Address Verification Document */}
          <div 
            id="field-addressProofSection"
            className={`bg-slate-950 border rounded-xl p-3.5 space-y-2.5 transition ${
              missingFieldId === 'field-addressProofDoc' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">
                3. Address Verification Document <span className="text-red-400 font-bold">*</span>
              </label>
              <span className="text-[10px] text-red-400 font-medium">Required *</span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-normal">
              Upload electricity bill, rent agreement, Gumasta, or municipal depot receipt to confirm shop physical location.
            </p>

            <select
              value={addressProofType}
              onChange={(e) => setAddressProofType(e.target.value)}
              className="h-11 w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-lg px-3 text-xs sm:text-sm text-white outline-none cursor-pointer"
            >
              <option value="Electricity Bill (Recent 3 Months)">Electricity Bill (Recent 3 Months)</option>
              <option value="Commercial Rent / Lease Agreement">Commercial Rent / Lease Agreement</option>
              <option value="Shop & Establishment Act (Gumasta)">Shop &amp; Establishment Act (Gumasta)</option>
              <option value="Municipal Property Tax / Water Bill">Municipal Property Tax / Water Bill</option>
              <option value="GSTIN Registration Certificate">GSTIN Registration Certificate</option>
              <option value="Mobile Cart Parking / Depot Receipt">Mobile Cart Parking / Depot Receipt</option>
              <option value="Other Location Document">Other Location Document</option>
            </select>

            <input
              ref={addressProofFileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleDocUpload(e, setAddressProofDocUrl, setAddressProofDocName, setIsUploadingAddressProof, 'field-addressProofDoc', 'address_proof')}
            />

            <div id="field-addressProofDoc">
              {addressProofDocUrl ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-200 truncate">{addressProofDocName || 'Address_Proof'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => addressProofFileInputRef.current?.click()}
                      className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer font-medium"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddressProofDocUrl(''); setAddressProofDocName(''); }}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => addressProofFileInputRef.current?.click()}
                  className={`h-11 w-full px-3 rounded-lg border bg-slate-900 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition ${
                    missingFieldId === 'field-addressProofDoc' ? 'border-red-500 ring-2 ring-red-500/30' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isUploadingAddressProof ? 'Uploading...' : 'Upload Address Proof Document (PDF / Image) *'}</span>
                </button>
              )}
              {missingFieldId === 'field-addressProofDoc' && (
                <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Address verification document is required.
                </p>
              )}
            </div>
          </div>

          {/* 4. Municipal Street Food Permit / Trade License */}
          <div 
            id="field-tradePermitSection"
            className={`bg-slate-950 border rounded-xl p-3.5 space-y-2.5 transition ${
              missingFieldId === 'field-tradePermitNumber' || missingFieldId === 'field-tradePermitDoc'
                ? 'border-red-500 ring-2 ring-red-500/20'
                : 'border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">
                4. Municipal Street Food Cart Trade Permit / Local License <span className="text-red-400 font-bold">*</span>
              </label>
              <span className="text-[10px] text-red-400 font-medium">Required *</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={tradePermitType}
                onChange={(e) => setTradePermitType(e.target.value)}
                className="h-11 w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-lg px-3 text-xs sm:text-sm text-white outline-none cursor-pointer"
              >
                {isMobileStall ? (
                  <>
                    <option value="Street Food Vending Certificate (TVC ID)">Street Vending Certificate (TVC ID)</option>
                    <option value="Municipal Tehbazari / Hawker Permit">Municipal Tehbazari / Hawker Permit</option>
                    <option value="Nagar Nigam Street Cart Trade License">Nagar Nigam Street Cart License</option>
                    <option value="Local Municipal Corporation NOC / Challan">Local Corporation NOC / Challan</option>
                    <option value="Other Street Vending Permit">Other Street Vending Permit</option>
                  </>
                ) : (
                  <>
                    <option value="Municipal Health Trade License">Municipal Health Trade License</option>
                    <option value="Eating House Registration Certificate">Eating House Registration</option>
                    <option value="Shops & Commercial Establishment License">Shops &amp; Commercial License</option>
                    <option value="Nagar Palika / Panchayat Eatery Permit">Nagar Palika / Panchayat Permit</option>
                    <option value="Other Trade Permit / Authority NOC">Other Trade Permit / NOC</option>
                  </>
                )}
              </select>

              <div id="field-tradePermitNumber">
                <input
                  type="text"
                  value={tradePermitNumber}
                  onChange={(e) => {
                    setTradePermitNumber(e.target.value);
                    if (missingFieldId === 'field-tradePermitNumber') setMissingFieldId(null);
                  }}
                  placeholder="Permit / License number *"
                  className={`h-11 w-full bg-slate-900 border rounded-lg px-3 text-xs sm:text-sm text-white placeholder-slate-600 outline-none font-mono transition ${
                    missingFieldId === 'field-tradePermitNumber' ? 'border-red-500' : 'border-slate-800 focus:border-orange-500'
                  }`}
                />
              </div>
            </div>

            {missingFieldId === 'field-tradePermitNumber' && (
              <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Municipal Permit / License number is required.
              </p>
            )}

            <input
              ref={tradePermitFileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleDocUpload(e, setTradePermitDocUrl, setTradePermitDocName, setIsUploadingTradePermit, 'field-tradePermitDoc', 'trade_permit')}
            />

            <div id="field-tradePermitDoc">
              {tradePermitDocUrl ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-200 truncate">{tradePermitDocName || 'Trade_Permit'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => tradePermitFileInputRef.current?.click()}
                      className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer font-medium"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTradePermitDocUrl(''); setTradePermitDocName(''); }}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => tradePermitFileInputRef.current?.click()}
                  className={`h-11 w-full px-3 rounded-lg border bg-slate-900 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition ${
                    missingFieldId === 'field-tradePermitDoc' ? 'border-red-500 ring-2 ring-red-500/30' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isUploadingTradePermit ? 'Uploading...' : 'Upload Trade Permit File (PDF / Image) *'}</span>
                </button>
              )}
              {missingFieldId === 'field-tradePermitDoc' && (
                <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Trade Permit / Vending license document is required.
                </p>
              )}
            </div>
          </div>

          {/* Bottom Actions: Back to Step 1 & Submit Form */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={goToPart1}
              className="h-12 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 flex-1 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Store...</span>
                </>
              ) : (
                <>
                  <span>Submit Store for Verification</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Location Map Picker Modal */}
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

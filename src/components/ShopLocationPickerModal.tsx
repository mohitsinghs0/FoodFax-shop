import React from 'react';
import { GoogleMapsLocationPicker } from './GoogleMapsLocationPicker';
import { X, Store } from 'lucide-react';

interface ShopLocationPickerModalProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  initialArea?: string;
  isMobileStall?: boolean;
  onConfirm: (loc: {
    latitude: number;
    longitude: number;
    address?: string;
    area?: string;
    accuracy?: number;
  }) => void;
  onClose: () => void;
}

export const ShopLocationPickerModal: React.FC<ShopLocationPickerModalProps> = ({
  initialLat = 19.0760,
  initialLng = 72.8777,
  initialAddress = '',
  initialArea = '',
  isMobileStall = false,
  onConfirm,
  onClose,
}) => {
  const handleSaveLocation = (loc: {
    latitude: number;
    longitude: number;
    address?: string;
    area?: string;
    accuracy?: number;
  }) => {
    onConfirm(loc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 select-none">
      <div className="bg-[#0f172a] border border-[#1e293b] sm:rounded-[24px] rounded-t-[24px] w-full max-w-xl flex flex-col overflow-hidden shadow-2xl relative max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#131b2e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-[#f97316] flex items-center justify-center border border-orange-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Set Exact Location</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  Google Maps
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isMobileStall
                  ? 'Pinpoint your stall on interactive Google Maps'
                  : 'Pin your restaurant entrance for nearby customer discovery'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google Maps Location Picker Body */}
        <div className="p-3 overflow-y-auto">
          <GoogleMapsLocationPicker
            initialLat={initialLat}
            initialLng={initialLng}
            initialAddress={initialAddress}
            initialArea={initialArea}
            isMobileStall={isMobileStall}
            onSaveLocation={handleSaveLocation}
            height="440px"
            showSaveButton={true}
          />
        </div>
      </div>
    </div>
  );
};

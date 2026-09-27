import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { ArrowLeft, Copy, Check } from 'lucide-react';

export const ShopQrScreen: React.FC = () => {
  const { shop, setActiveScreen } = useOwnerApp();
  const [copied, setCopied] = useState(false);

  if (!shop) return null;

  const shopSlug = shop.id ? `shop_${shop.id.replace(/-/g, '').slice(0, 8)}` : 'shop_0vn16c2t';
  const orderUrl = `https://foodfax.in/shop/${shopSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] pb-20 select-none">
      {/* Top App Bar matching Photo 4 */}
      <div className="px-4 py-3.5 border-b border-[#131B2E] flex items-center gap-3 sticky top-0 bg-[#0B0F19] z-20">
        <button
          onClick={() => setActiveScreen('dashboard')}
          className="p-1 -ml-1 text-white hover:text-[#F97316] transition"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <h2 className="text-[17px] font-black tracking-tight text-white">
          Store Counter QR Code
        </h2>
      </div>

      <div className="px-5 py-6 max-w-sm mx-auto flex flex-col items-center">
        {/* White QR Standee Card matching Photo 4 */}
        <div className="w-full bg-white rounded-[32px] p-6 text-center text-slate-900 shadow-2xl">
          {/* Shop Name in Bold Caps */}
          <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">
            {shop.name}
          </h3>

          <p className="text-xs text-slate-500 font-medium mt-1 mb-5">
            Scan to View Digital Menu &amp; Order
          </p>

          {/* QR Code Container */}
          <div className="p-2 border border-slate-100 rounded-2xl inline-block bg-white shadow-sm mb-5">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                orderUrl
              )}`}
              alt={`${shop.name} QR Code`}
              className="w-56 h-56 mx-auto object-contain"
            />
          </div>

          {/* URL Pill Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-[14px] px-3 py-2 text-[11px] font-medium text-slate-600 truncate max-w-full">
            {orderUrl}
          </div>
        </div>

        {/* Descriptive Text below card matching Photo 4 */}
        <p className="text-xs text-[#94A3B8] text-center leading-relaxed mt-6 px-2">
          Print this QR code and paste it on your shop counter or dining tables so walk-in customers can order directly.
        </p>

        {/* Copy Store Menu Link Button matching Photo 4 */}
        <button
          onClick={handleCopy}
          className="w-full mt-6 py-3.5 rounded-[16px] bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 transition active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Store Menu Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Settings2, 
  QrCode, 
  Store,
  Table as TableIcon,
  Sparkles
} from 'lucide-react';

export const ShopQrScreen: React.FC = () => {
  const { shop, setActiveScreen } = useOwnerApp();
  const [copied, setCopied] = useState(false);
  const [urlType, setUrlType] = useState<'slug' | 'id'>('slug');
  const [selectedTable, setSelectedTable] = useState<string>('counter');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  
  // Configurable customer website base domain
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    return localStorage.getItem('foodfax_customer_base_url') || 'https://foodfax.in';
  });

  if (!shop) return null;

  // Real slug from database or clean slugified name
  const cleanSlug = shop.slug || shop.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || shop.id;
  const cleanId = shop.id;

  // Target identifier based on chosen format
  const activeIdentifier = urlType === 'slug' ? cleanSlug : cleanId;

  // Clean trailing slashes from base URL
  const sanitizedBaseUrl = baseUrl.trim().replace(/\/+$/, '') || 'https://foodfax.in';

  // Construct precise ordering URL
  let orderUrl = `${sanitizedBaseUrl}/shop/${encodeURIComponent(activeIdentifier)}`;
  if (selectedTable && selectedTable !== 'counter') {
    orderUrl += `?table=${encodeURIComponent(selectedTable)}`;
  }

  const handleBaseUrlChange = (newUrl: string) => {
    setBaseUrl(newUrl);
    localStorage.setItem('foodfax_customer_base_url', newUrl);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(orderUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    orderUrl
  )}&margin=10`;

  const diningTables = shop.diningTables && shop.diningTables.length > 0
    ? shop.diningTables
    : ['Table 1', 'Table 2', 'Table 3', 'Table 4'];

  return (
    <div className="text-[#F8FAFC] pb-10 select-none">
      {/* Screen Title & Back Button */}
      <div className="px-4 py-3 border-b border-[#131B2E] flex items-center justify-between bg-[#0B0F19]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('dashboard')}
            className="p-1.5 -ml-1 text-slate-300 hover:text-[#F97316] transition cursor-pointer rounded-lg hover:bg-[#131B2E]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <h2 className="text-[16px] font-black tracking-tight text-white leading-tight">
              Store Counter QR Code
            </h2>
            <p className="text-[11px] text-slate-400">
              Customer digital ordering link &amp; standee
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            showConfig 
              ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
              : 'bg-[#131B2E] border-[#23304A] text-slate-300 hover:text-white'
          }`}
          title="Configure customer website URL"
        >
          <Settings2 className="w-4 h-4" />
          <span className="text-[11px]">URL Settings</span>
        </button>
      </div>

      <div className="px-4 lg:px-8 py-4 lg:py-8 max-w-sm lg:max-w-5xl mx-auto">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start space-y-4 lg:space-y-0">
          
          {/* Left Column: QR Code Standee Card (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            {/* White QR Standee Card matching Photo 4 */}
            <div className="w-full bg-white rounded-[32px] p-6 text-center text-slate-900 shadow-2xl relative overflow-hidden border border-slate-200">
              {/* Top Brand Banner */}
              <div className="mb-4">
                <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight truncate">
                  {shop.name}
                </h3>
                <p className="text-xs text-orange-600 font-bold mt-0.5">
                  {selectedTable === 'counter' ? 'Counter & Walk-in Menu' : `${selectedTable} Dine-in QR`}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Scan with phone camera to view digital menu &amp; order
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-3 border-2 border-slate-100 rounded-3xl inline-block bg-white shadow-sm mb-4">
                <img
                  src={qrImageUrl}
                  alt={`${shop.name} QR Code`}
                  className="w-56 h-56 mx-auto object-contain rounded-xl"
                />
              </div>

              {/* URL Pill Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-700 break-all select-all">
                {orderUrl}
              </div>
            </div>

            {/* Descriptive Text below card */}
            <p className="text-xs text-[#94A3B8] text-center lg:text-left leading-relaxed px-2">
              Print this QR code and paste it on your stall counter or dining tables so customers can order directly without waiting.
            </p>
          </div>

          {/* Right Column: Actions & Configuration (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            {/* QR URL Configuration Drawer */}
            {(showConfig || true) && (
              <div className={`p-4 rounded-2xl bg-[#131B2E] border border-orange-500/40 space-y-3.5 shadow-sm ${!showConfig ? 'hidden lg:block' : 'block'}`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      <span>Customer Website Base Domain:</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                    placeholder="https://foodfax.in"
                    className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    If your customer web app runs on a custom domain or local port (e.g. <code className="text-orange-300">http://localhost:5173</code>), set it here.
                  </p>
                </div>

                {/* Quick Domain Presets */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleBaseUrlChange('https://foodfax.in')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                      baseUrl === 'https://foodfax.in'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                        : 'bg-[#0B0F19] border-[#23304A] text-slate-400 hover:text-white'
                    }`}
                  >
                    foodfax.in (Production)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBaseUrlChange('http://localhost:5173')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                      baseUrl === 'http://localhost:5173'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                        : 'bg-[#0B0F19] border-[#23304A] text-slate-400 hover:text-white'
                    }`}
                  >
                    localhost:5173 (Dev)
                  </button>
                </div>

                {/* URL Format Switcher: Slug vs ID */}
                <div className="pt-1">
                  <label className="text-xs font-bold text-white block mb-1.5">
                    Shop Identifier Format:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUrlType('slug')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition ${
                        urlType === 'slug'
                          ? 'bg-orange-600/20 border-orange-500 text-white'
                          : 'bg-[#0B0F19] border-[#23304A] text-slate-400 hover:text-white'
                      }`}
                    >
                      By Slug ({cleanSlug})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrlType('id')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition ${
                        urlType === 'id'
                          ? 'bg-orange-600/20 border-orange-500 text-white'
                          : 'bg-[#0B0F19] border-[#23304A] text-slate-400 hover:text-white'
                      }`}
                    >
                      By ID ({cleanId.slice(0, 10)}...)
                    </button>
                  </div>
                </div>

                {/* Dine-in Table Selector */}
                <div className="pt-1">
                  <label className="text-xs font-bold text-white block mb-1.5">
                    Counter or Dining Table:
                  </label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="counter">Main Counter / Walk-in QR</option>
                    {diningTables.map((tbl) => (
                      <option key={tbl} value={tbl}>
                        {tbl} QR Code
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Copy Store Menu Link Button */}
              <button
                onClick={handleCopy}
                className="w-full py-3.5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Customer Menu Link</span>
                  </>
                )}
              </button>

              {/* Open Link in New Tab (Test Link) */}
              <a
                href={orderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-[#131B2E] hover:bg-[#1a253e] border border-[#23304A] text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                <span>Open Customer Link (Preview)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

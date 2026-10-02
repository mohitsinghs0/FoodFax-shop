import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { soundService } from '../services/soundService';
import { 
  X, 
  Volume2, 
  Flame, 
  Sliders, 
  Bell, 
  BellOff, 
  Send, 
  Bike, 
  UtensilsCrossed, 
  ShoppingBag, 
  Info,
  Check,
  Plus,
  Trash2,
  Grid,
  Tag,
  Layers
} from 'lucide-react';

interface ShopSettingsModalProps {
  onClose: () => void;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({ onClose }) => {
  const { 
    shop, 
    saveShop, 
    toggleRushMode, 
    toggleShopOpen, 
    isSoundEnabled, 
    toggleSound,
    isPushNotificationEnabled,
    togglePushNotifications,
    pushPermission,
    triggerTestPushNotification
  } = useOwnerApp();

  const [acceptsDineIn, setAcceptsDineIn] = useState<boolean>(shop?.acceptsDineIn ?? true);
  const [acceptsTakeaway, setAcceptsTakeaway] = useState<boolean>(shop?.acceptsTakeaway ?? true);
  const [acceptsDelivery, setAcceptsDelivery] = useState<boolean>(shop?.acceptsDelivery ?? false);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<number>(shop?.deliveryRadiusKm ?? 3);
  const [deliveryFeeType, setDeliveryFeeType] = useState<'free' | 'fixed'>(
    (shop?.deliveryFeeType as 'free' | 'fixed') || 'free'
  );
  const [deliveryFeeAmount, setDeliveryFeeAmount] = useState<number>(shop?.deliveryFeeAmount ?? 0);

  // Table and Section Management State
  const [diningTables, setDiningTables] = useState<string[]>(
    shop?.diningTables && shop.diningTables.length > 0
      ? shop.diningTables
      : ['Table 1', 'Table 2', 'Table 3', 'Table 4']
  );
  const [diningSections, setDiningSections] = useState<string[]>(
    shop?.diningSections && shop.diningSections.length > 0
      ? shop.diningSections
      : ['Main Dining', 'AC Hall', 'Outdoor Patio']
  );
  const [selectedSection, setSelectedSection] = useState<string>(
    shop?.diningSections?.[0] || 'Main Dining'
  );
  const [newTableInput, setNewTableInput] = useState<string>('');
  const [newSectionInput, setNewSectionInput] = useState<string>('');
  const [showAddSection, setShowAddSection] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!shop) return null;

  // Batch table generation (e.g. +5 or +10 tables)
  const handleAddBatchTables = (count: number) => {
    setDiningTables((prev) => {
      let maxNum = 0;
      prev.forEach((t) => {
        const match = t.match(/\d+/);
        if (match) {
          const n = parseInt(match[0], 10);
          if (n > maxNum) maxNum = n;
        }
      });
      const newItems: string[] = [];
      for (let i = 1; i <= count; i++) {
        const prefix = selectedSection !== 'Main Dining' ? `${selectedSection} - ` : '';
        newItems.push(`${prefix}Table ${maxNum + i}`);
      }
      return [...prev, ...newItems];
    });
  };

  // Add individual custom table
  const handleAddCustomTable = () => {
    const trimmed = newTableInput.trim();
    if (!trimmed) return;
    const finalLabel = selectedSection !== 'Main Dining' && !trimmed.toLowerCase().includes(selectedSection.toLowerCase())
      ? `${selectedSection} - ${trimmed}`
      : trimmed;
    if (!diningTables.includes(finalLabel)) {
      setDiningTables((prev) => [...prev, finalLabel]);
    }
    setNewTableInput('');
  };

  // Remove table
  const handleRemoveTable = (tableToRemove: string) => {
    setDiningTables((prev) => prev.filter((t) => t !== tableToRemove));
  };

  // Add new section
  const handleAddSection = () => {
    const trimmed = newSectionInput.trim();
    if (!trimmed) return;
    if (!diningSections.includes(trimmed)) {
      setDiningSections((prev) => [...prev, trimmed]);
      setSelectedSection(trimmed);
    }
    setNewSectionInput('');
    setShowAddSection(false);
  };

  // Remove section
  const handleRemoveSection = (sectionToRemove: string) => {
    if (diningSections.length <= 1) return;
    setDiningSections((prev) => prev.filter((s) => s !== sectionToRemove));
    if (selectedSection === sectionToRemove) {
      setSelectedSection(diningSections.find((s) => s !== sectionToRemove) || 'Main Dining');
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    await saveShop({
      acceptsDineIn,
      acceptsTakeaway,
      acceptsDelivery,
      diningTables,
      diningSections,
      deliveryRadiusKm,
      deliveryFeeType,
      deliveryFeeAmount: deliveryFeeType === 'free' ? 0 : Number(deliveryFeeAmount),
    });
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
      <div className="bg-[#0B0F19] border border-[#1E293B] rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#F97316]" />
            <h3 className="text-base font-black text-white">Operations &amp; Delivery Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Store Switch */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Store Live Status</p>
            <p className="text-[11px] text-slate-400">
              {shop.isOpen ? 'Store is open & accepting customer orders' : 'Store is paused / closed for walk-ins'}
            </p>
          </div>
          <button
            onClick={() => toggleShopOpen(!shop.isOpen)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              shop.isOpen ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {shop.isOpen ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>

        {/* SECTION 3: DELIVERY & FULFILLMENT SETTINGS (Section 3 Requirements) */}
        <div className="p-4 rounded-2xl bg-[#131B2E] border border-[#1E293B] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-[#F97316]" />
              <p className="text-xs font-black uppercase tracking-wider text-white">
                Fulfillment &amp; Delivery Modes
              </p>
            </div>
            <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded-full">
              OWN FULFILLMENT
            </span>
          </div>

          {/* Three Mode Checkboxes */}
          <div className="space-y-2 pt-1">
            {/* 1. Dine-in available */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-[#23304A] cursor-pointer hover:border-slate-700 transition">
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Dine-in available</span>
                  <span className="text-[10px] text-slate-400">Table ordering or on-premise consumption</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={acceptsDineIn}
                onChange={(e) => setAcceptsDineIn(e.target.checked)}
                className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            {/* DINE-IN TABLE & SECTION MANAGEMENT (Interactive Config) */}
            {acceptsDineIn && (
              <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#23304A] space-y-3.5 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-sky-400" />
                    <div>
                      <h5 className="text-xs font-black uppercase tracking-wider text-white">
                        Dining Tables &amp; Sections
                      </h5>
                      <p className="text-[10px] text-slate-400">
                        Define table labels and dining areas for customer orders
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/30">
                    {diningTables.length} Tables Active
                  </span>
                </div>

                {/* 1. Dining Sections Tabs */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      <span>Dining Sections / Areas</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddSection(!showAddSection)}
                      className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showAddSection ? 'Cancel' : 'Add Section'}</span>
                    </button>
                  </div>

                  {showAddSection && (
                    <div className="p-2 rounded-lg bg-slate-900 border border-sky-500/30 flex gap-2">
                      <input
                        type="text"
                        value={newSectionInput}
                        onChange={(e) => setNewSectionInput(e.target.value)}
                        placeholder="e.g. AC Dining, Rooftop, Garden..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSection}
                        disabled={!newSectionInput.trim()}
                        className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {diningSections.map((sec) => (
                      <div
                        key={sec}
                        onClick={() => setSelectedSection(sec)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                          selectedSection === sec
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 shadow-sm'
                            : 'bg-[#0B0F19] text-slate-400 border-[#23304A] hover:text-white'
                        }`}
                      >
                        <span>{sec}</span>
                        {diningSections.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSection(sec);
                            }}
                            className="text-slate-500 hover:text-rose-400 text-xs leading-none p-0.5"
                            title="Remove section"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Tables Management in Current Section */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-orange-400" />
                      <span>Table Labels ({diningTables.length})</span>
                    </label>

                    {/* Quick batch generator buttons */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">Quick add:</span>
                      <button
                        type="button"
                        onClick={() => handleAddBatchTables(5)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition cursor-pointer"
                      >
                        +5 Tables
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBatchTables(10)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition cursor-pointer"
                      >
                        +10
                      </button>
                    </div>
                  </div>

                  {/* Add Custom Table Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTableInput}
                      onChange={(e) => setNewTableInput(e.target.value)}
                      placeholder={`Custom label for ${selectedSection} (e.g. T-5, VIP-1)...`}
                      className="flex-1 bg-[#0B0F19] border border-[#23304A] focus:border-sky-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTable}
                      disabled={!newTableInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Active Table Badges Container */}
                  <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#23304A] max-h-36 overflow-y-auto">
                    {diningTables.length === 0 ? (
                      <p className="text-[11px] text-slate-500 text-center py-2">
                        No tables defined yet. Click '+5 Tables' above or type a custom table name.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {diningTables.map((tbl) => (
                          <div
                            key={tbl}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-white text-xs font-bold flex items-center gap-1.5 group hover:border-slate-500 transition"
                          >
                            <span>{tbl}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTable(tbl)}
                              className="text-slate-400 hover:text-rose-400 text-xs leading-none p-0.5 cursor-pointer"
                              title="Delete table"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Takeaway available */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-[#23304A] cursor-pointer hover:border-slate-700 transition">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Takeaway available</span>
                  <span className="text-[10px] text-slate-400">Customer walks up to counter for pickup</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={acceptsTakeaway}
                onChange={(e) => setAcceptsTakeaway(e.target.checked)}
                className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            {/* 3. Shop Delivery available */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-[#23304A] cursor-pointer hover:border-slate-700 transition">
              <div className="flex items-center gap-2.5">
                <Bike className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Shop Delivery available</span>
                  <span className="text-[10px] text-slate-400">Delivered directly by your own store staff</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={acceptsDelivery}
                onChange={(e) => setAcceptsDelivery(e.target.checked)}
                className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Conditional Delivery Configuration when Shop Delivery is Enabled */}
          {acceptsDelivery && (
            <div className="p-3.5 rounded-xl bg-[#070b14] border border-[#23304A] space-y-3 mt-2">
              {/* Delivery Radius */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-white">Delivery Radius</label>
                  <span className="text-xs font-black text-orange-400 tabular-nums">
                    {deliveryRadiusKm} km
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => setDeliveryRadiusKm(km)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        deliveryRadiusKm === km
                          ? 'bg-[#F97316] text-white border-orange-500 shadow-sm'
                          : 'bg-[#0B0F19] text-slate-400 border-[#23304A] hover:text-white'
                      }`}
                    >
                      {km} km
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Fee Configuration */}
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">Delivery Fee</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryFeeType('free');
                      setDeliveryFeeAmount(0);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      deliveryFeeType === 'free'
                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500'
                        : 'bg-[#0B0F19] text-slate-400 border-[#23304A]'
                    }`}
                  >
                    Free Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryFeeType('fixed')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      deliveryFeeType === 'fixed'
                        ? 'bg-orange-600/20 text-orange-400 border-orange-500'
                        : 'bg-[#0B0F19] text-slate-400 border-[#23304A]'
                    }`}
                  >
                    Fixed Amount (₹)
                  </button>
                </div>

                {deliveryFeeType === 'fixed' && (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={deliveryFeeAmount || ''}
                      onChange={(e) => setDeliveryFeeAmount(Number(e.target.value))}
                      placeholder="e.g. 20"
                      className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-orange-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                )}
              </div>

              {/* FoodFax Delivery Notice (Explicit requirement) */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Notice:</strong> FoodFax only supports <em>Shop Delivery</em> where your individual shop handles delivery. FoodFax delivery partner/delivery-boy tracking is a future feature.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Rush Mode Configuration */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              <p className="text-xs font-bold text-white">Rush Hour Delay Buffer</p>
            </div>
            <button
              onClick={() => toggleRushMode(!shop.isRushMode, shop.rushExtraMinutes)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                shop.isRushMode ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {shop.isRushMode ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            {[10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                onClick={() => toggleRushMode(true, mins)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  shop.isRushMode && shop.rushExtraMinutes === mins
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                +{mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Order Chimes & Sound */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Order Chimes</p>
              <p className="text-[11px] text-slate-400">Play alert sound for incoming orders</p>
            </div>
            <button
              onClick={toggleSound}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isSoundEnabled ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isSoundEnabled ? 'SOUND ON' : 'MUTED'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundService.unlockAudio();
                soundService.playLoudOrderAlarm(2.2);
              }}
              className="w-full py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-xs font-bold text-orange-400 border border-orange-500/40 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Fanfare</span>
            </button>
            <button
              onClick={() => {
                soundService.unlockAudio();
                soundService.playNewOrderChime();
              }}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-slate-300 border border-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Soft Chime</span>
            </button>
          </div>
        </div>

        {/* Browser Push Notifications */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white">Push Notifications</p>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                  pushPermission === 'granted' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : pushPermission === 'denied'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {pushPermission}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Background alerts when minimized</p>
            </div>
            <button
              onClick={togglePushNotifications}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                isPushNotificationEnabled ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isPushNotificationEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
              <span>{isPushNotificationEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </button>
          </div>

          <button
            onClick={triggerTestPushNotification}
            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-sky-400 border border-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test Push</span>
          </button>
        </div>

        {/* Save & Return Button */}
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <span>Save &amp; Return</span>
          )}
        </button>
      </div>
    </div>
  );
};

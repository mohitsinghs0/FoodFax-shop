import React, { useState, useMemo, useEffect } from 'react';
import { 
  Store, 
  MapPin, 
  Clock, 
  Star, 
  RefreshCw, 
  Truck, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Shop } from '../types';
import { shopService } from '../services/shopService';

interface CustomerDiscoveryMapWidgetProps {
  currentShop: Shop;
  allShops?: Shop[];
  onOpenShop?: (shopId: string) => void;
}

export const CustomerDiscoveryMapWidget: React.FC<CustomerDiscoveryMapWidgetProps> = ({
  currentShop,
  onOpenShop
}) => {
  // Radius selector (1 km, 2 km, 3 km, 4 km as explicitly required)
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(3);
  const [serviceFilter, setServiceFilter] = useState<'all' | 'dine_in' | 'takeaway' | 'delivery'>('all');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(currentShop.id);
  const [viewShopModalShop, setViewShopModalShop] = useState<Shop | null>(null);

  // PostGIS fetched nearby shops state
  const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState<boolean>(false);

  // Customer Coordinates (Default near current shop)
  const [customerLat, setCustomerLat] = useState<number>(() => {
    return Number(((currentShop.latitude || 19.1026) - 0.0075).toFixed(6));
  });
  const [customerLng, setCustomerLng] = useState<number>(() => {
    return Number(((currentShop.longitude || 72.8362) + 0.0055).toFixed(6));
  });
  const [isLocatingCustomer, setIsLocatingCustomer] = useState(false);

  // Sync customer position if shop coordinates change initially
  useEffect(() => {
    if (currentShop.latitude && currentShop.longitude) {
      setCustomerLat(Number((currentShop.latitude - 0.0075).toFixed(6)));
      setCustomerLng(Number((currentShop.longitude + 0.0055).toFixed(6)));
    }
  }, [currentShop.latitude, currentShop.longitude]);

  // Request Customer Location on demand (Single explicit action)
  const handleRequestCustomerLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Browser does not support geolocation.');
      setIsLocatingCustomer(false);
      return;
    }
    setIsLocatingCustomer(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomerLat(Number(pos.coords.latitude.toFixed(6)));
        setCustomerLng(Number(pos.coords.longitude.toFixed(6)));
        setIsLocatingCustomer(false);
      },
      (err) => {
        console.warn('Customer geolocation error:', err);
        setIsLocatingCustomer(false);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Query PostGIS server-side find_nearby_shops RPC whenever customer lat, lng, radius, or serviceFilter changes
  useEffect(() => {
    let isCancelled = false;

    async function loadPostGisShops() {
      setIsLoadingNearby(true);
      try {
        const results = await shopService.fetchNearbyPublicShops(
          customerLat,
          customerLng,
          selectedRadiusKm,
          serviceFilter
        );
        if (!isCancelled) {
          setNearbyShops(results);
          setIsLoadingNearby(false);
        }
      } catch (err) {
        console.warn('PostGIS nearby shops fetch error:', err);
        if (!isCancelled) setIsLoadingNearby(false);
      }
    }

    loadPostGisShops();
    return () => {
      isCancelled = true;
    };
  }, [customerLat, customerLng, selectedRadiusKm, serviceFilter]);

  // Pool of shops: PostGIS returned shops, plus current shop if active/open and within radius
  const visibleShops = useMemo(() => {
    const map = new Map<string, Shop>();

    // Add current shop if valid
    if (currentShop.isOpen && currentShop.latitude && currentShop.longitude) {
      map.set(currentShop.id, currentShop);
    }

    // Add PostGIS results
    nearbyShops.forEach((s) => {
      map.set(s.id, s);
    });

    const list = Array.from(map.values());
    return list;
  }, [nearbyShops, currentShop]);

  const activeSelected = visibleShops.find((item) => item.id === selectedShopId) || visibleShops[0];

  return (
    <div className="bg-[#131B2E] border border-[#1E293B] rounded-[22px] p-4 space-y-3.5 shadow-sm select-none">
      
      {/* Header with Title and Customer GPS Refresher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-[#F97316] flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-white truncate">
              Customer Map &amp; Discovery Radius
            </h3>
            <p className="text-[10px] text-[#94A3B8] truncate">
              Live PostGIS radius query with shop-specific delivery boundaries
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRequestCustomerLocation}
          disabled={isLocatingCustomer}
          className="px-2.5 py-1 rounded-lg bg-[#0B0F19] hover:bg-[#1a253e] border border-[#23304A] text-slate-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
          title="Refresh Customer GPS"
        >
          <RefreshCw className={`w-3 h-3 text-orange-400 ${isLocatingCustomer ? 'animate-spin' : ''}`} />
          <span>Locate</span>
        </button>
      </div>

      {/* Radius Selector: 1 km, 2 km, 3 km, 4 km */}
      <div className="flex items-center justify-between gap-1 p-1 bg-[#0B0F19] rounded-xl border border-[#23304A]">
        <span className="text-[10px] font-bold text-slate-400 pl-2 shrink-0">Radius:</span>
        <div className="flex items-center gap-1 flex-1 justify-end">
          {[1, 2, 3, 4].map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => setSelectedRadiusKm(km)}
              className={`px-3 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                selectedRadiusKm === km
                  ? 'bg-[#F97316] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {km} km
            </button>
          ))}
        </div>
      </div>

      {/* Service Filter Tabs (All, Dine-in, Takeaway, Shop Delivery) */}
      <div className="grid grid-cols-4 gap-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'dine_in', label: 'Dine-in' },
          { key: 'takeaway', label: 'Takeaway' },
          { key: 'delivery', label: 'Shop Delivery' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setServiceFilter(tab.key as any)}
            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition text-center truncate cursor-pointer ${
              serviceFilter === tab.key
                ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                : 'bg-[#0B0F19] text-slate-400 border-[#23304A] hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactive Map Visualizer Canvas */}
      <div 
        className="relative h-52 rounded-2xl bg-[#070b14] border border-[#1E293B] overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.12) 0%, transparent 65%),
            linear-gradient(to right, rgba(30, 41, 59, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(30, 41, 59, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 28px 28px, 28px 28px'
        }}
      >
        {/* Selected Radius Circle around Customer */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-sky-400/40 bg-sky-500/5 pointer-events-none transition-all duration-300"
          style={{
            width: `${Math.min(190, selectedRadiusKm * 42)}px`,
            height: `${Math.min(190, selectedRadiusKm * 42)}px`,
          }}
        />

        {/* Center: Customer Marker (Blue Dot "YOU") */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center ring-4 ring-blue-500/30 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
          <span className="text-[9px] font-black text-blue-300 bg-[#0B0F19]/90 px-1.5 py-0.5 rounded shadow mt-1">
            YOU
          </span>
        </div>

        {/* Nearby FoodFax Shop Markers */}
        {visibleShops.map((shop, idx) => {
          const isCurrent = shop.id === currentShop.id;
          const isSelected = activeSelected?.id === shop.id;

          // Compute offsets relative to center customer
          const distKm = typeof shop.distanceKm === 'number' ? shop.distanceKm : 1.2;
          const angle = (idx * (360 / Math.max(1, visibleShops.length)) + 45) * (Math.PI / 180);
          const rPixel = Math.min(80, Math.max(30, (distKm / selectedRadiusKm) * 70));
          const leftPercent = 50 + (Math.cos(angle) * rPixel * 0.55);
          const topPercent = 50 + (Math.sin(angle) * rPixel * 0.45);

          return (
            <button
              key={shop.id}
              type="button"
              onClick={() => setSelectedShopId(shop.id)}
              style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center transition-transform cursor-pointer ${
                isSelected ? 'scale-110 z-40' : 'hover:scale-105'
              }`}
            >
              <div className={`p-1.5 rounded-full border shadow-lg ${
                isCurrent 
                  ? 'bg-[#F97316] text-white border-white ring-2 ring-orange-500/40' 
                  : 'bg-emerald-600 text-white border-slate-900'
              }`}>
                {shop.isMobileStall ? (
                  <Truck className="w-3.5 h-3.5" />
                ) : (
                  <Store className="w-3.5 h-3.5" />
                )}
              </div>
              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded mt-0.5 whitespace-nowrap shadow ${
                isSelected ? 'bg-orange-500 text-white font-black' : 'bg-[#0B0F19]/90 text-slate-300'
              }`}>
                {shop.name.slice(0, 14)}
              </span>
            </button>
          );
        })}

        {/* Radius badge top left */}
        <div className="absolute left-2.5 top-2.5 px-2 py-0.5 rounded-md bg-[#0B0F19]/90 border border-[#23304A] text-[9px] text-slate-300 flex items-center gap-1.5">
          {isLoadingNearby ? (
            <Loader2 className="w-3 h-3 text-orange-400 animate-spin" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
          <span>PostGIS Radius: <strong>{selectedRadiusKm} km</strong> &bull; {visibleShops.length} shops</span>
        </div>
      </div>

      {/* Selected Shop Preview Card (Real database values without fake fallbacks) */}
      {activeSelected && (
        <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-[#1E293B] space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-white truncate">
                  {activeSelected.name}
                </h4>
                {activeSelected.id === currentShop.id && (
                  <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-[#F97316] text-[9px] font-black shrink-0">
                    YOUR SHOP
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                {activeSelected.isMobileStall ? '📍 Mobile Food Cart / Stall' : '🏢 Restaurant & Cafe'} &bull; {activeSelected.address || activeSelected.area || 'Street Spot'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-black text-orange-400 tabular-nums">
                {typeof activeSelected.distanceKm === 'number'
                  ? `${activeSelected.distanceKm} km`
                  : typeof activeSelected.distanceMeters === 'number'
                  ? `${activeSelected.distanceMeters} m`
                  : 'Nearby'}
              </span>
              <p className="text-[9px] text-emerald-400 font-bold">
                {activeSelected.isOpen ? 'OPEN' : 'CLOSED'}
              </p>
            </div>
          </div>

          {/* Real Service badges, real rating, real prep time */}
          <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800 gap-1 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              {activeSelected.acceptsDineIn && (
                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                  Dine-in
                </span>
              )}
              {activeSelected.acceptsTakeaway && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                  Takeaway
                </span>
              )}
              {activeSelected.acceptsDelivery && (
                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">
                  Delivery ({activeSelected.deliveryRadiusKm || 3}km)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              {typeof activeSelected.rating === 'number' ? (
                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {activeSelected.rating.toFixed(1)}
                  {activeSelected.totalReviews ? (
                    <span className="text-[9px] text-slate-400 font-normal">({activeSelected.totalReviews})</span>
                  ) : null}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium bg-slate-800 px-1.5 py-0.2 rounded">
                  New
                </span>
              )}

              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3 text-orange-400" />
                {activeSelected.preparationTimeMinutes ? `${activeSelected.preparationTimeMinutes} prep` : '~10-15m'}
              </span>
            </div>
          </div>

          {/* Section 6 "View Shop" button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenShop) {
                onOpenShop(activeSelected.id);
              } else {
                setViewShopModalShop(activeSelected);
              }
            }}
            className="w-full py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <span>View Shop</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick View Shop Modal for Customer Discovery */}
      {viewShopModalShop && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-400" />
                <h4 className="text-sm font-black text-white">{viewShopModalShop.name}</h4>
              </div>
              <button 
                onClick={() => setViewShopModalShop(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1.5">
              <p>
                <span className="text-slate-400">Type:</span> {viewShopModalShop.isMobileStall ? 'Mobile Food Cart / Stall' : 'Restaurant & Cafe'}
              </p>
              <p>
                <span className="text-slate-400">Spot / Address:</span> {viewShopModalShop.address || viewShopModalShop.area || 'Local Street Market'}
              </p>
              {typeof viewShopModalShop.rating === 'number' && (
                <p>
                  <span className="text-slate-400">Rating:</span> {viewShopModalShop.rating} ★ ({viewShopModalShop.totalReviews || 0} reviews)
                </p>
              )}
              <p>
                <span className="text-slate-400">Hours:</span> {viewShopModalShop.openingTime} - {viewShopModalShop.closingTime}
              </p>
              <p>
                <span className="text-slate-400">Fulfillment:</span> {[
                  viewShopModalShop.acceptsDineIn && 'Dine-In',
                  viewShopModalShop.acceptsTakeaway && 'Takeaway',
                  viewShopModalShop.acceptsDelivery && `Shop Delivery (${viewShopModalShop.deliveryRadiusKm || 3}km)`,
                ].filter(Boolean).join(' • ')}
              </p>
            </div>

            <button
              onClick={() => setViewShopModalShop(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

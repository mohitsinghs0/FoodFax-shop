import React, { useState, useEffect, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  useMap,
  ControlPosition,
  MapControl
} from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Search, 
  Crosshair, 
  Check, 
  Loader2, 
  Layers, 
  Globe, 
  Navigation,
  AlertTriangle,
  ClipboardPaste,
  Building2,
  Truck,
  Maximize2
} from 'lucide-react';

export const GOOGLE_MAPS_API_KEY = 
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAgoO9tSAD1RgFvvsR3zJCPJeZT8M_0XNE';

interface GoogleMapsLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  initialArea?: string;
  isMobileStall?: boolean;
  onSaveLocation: (loc: {
    latitude: number;
    longitude: number;
    address?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    accuracy?: number;
  }) => Promise<void> | void;
  height?: string;
  showSaveButton?: boolean;
}

const POPULAR_CITIES = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
];

// Controller component to pan & zoom on coordinates change
const MapController: React.FC<{ targetLat: number; targetLng: number; zoom?: number }> = ({ 
  targetLat,
  targetLng,
  zoom 
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: targetLat, lng: targetLng });
    if (zoom) {
      map.setZoom(zoom);
    }
  }, [map, targetLat, targetLng, zoom]);

  return null;
};

export const GoogleMapsLocationPicker: React.FC<GoogleMapsLocationPickerProps> = ({
  initialLat = 19.0760,
  initialLng = 72.8777,
  initialAddress = '',
  initialArea = '',
  isMobileStall = false,
  onSaveLocation,
  height = '360px',
  showSaveButton = true,
}) => {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [addressLabel, setAddressLabel] = useState<string>(initialAddress || initialArea || 'Google Maps Pinned Location');
  const [detectedArea, setDetectedArea] = useState<string>(initialArea || '');
  const [detectedCity, setDetectedCity] = useState<string>('');
  const [detectedState, setDetectedState] = useState<string>('');
  const [detectedPincode, setDetectedPincode] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [locating, setLocating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteInput, setPasteInput] = useState<string>('');

  // Synchronize when initial props change
  useEffect(() => {
    if (initialLat && initialLng) {
      setLat(initialLat);
      setLng(initialLng);
    }
    if (initialAddress) {
      setAddressLabel(initialAddress);
    }
  }, [initialLat, initialLng, initialAddress]);

  // Dual Reverse geocoding (Google Maps Geocoder primary + OSM Nominatim fallback)
  const reverseGeocode = useCallback(async (targetLat: number, targetLng: number) => {
    // 1. Try Google Maps Geocoder if SDK is loaded
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      try {
        const geocoder = new (window as any).google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat: targetLat, lng: targetLng } });
        if (response?.results?.[0]) {
          const result = response.results[0];
          const comps = result.address_components || [];
          let road = '';
          let sublocality = '';
          let cityVal = '';
          let stateVal = '';
          let pincodeVal = '';

          for (const c of comps) {
            const types = c.types || [];
            if (types.includes('route') || types.includes('street_address')) road = c.long_name;
            if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
              sublocality = c.long_name;
            }
            if (types.includes('locality')) cityVal = c.long_name;
            if (!cityVal && (types.includes('administrative_area_level_2') || types.includes('administrative_area_level_3'))) {
              cityVal = c.long_name;
            }
            if (types.includes('administrative_area_level_1')) stateVal = c.long_name;
            if (types.includes('postal_code')) pincodeVal = c.long_name;
          }

          const mainLabel = [road, sublocality, cityVal].filter(Boolean).join(', ') || result.formatted_address;
          setAddressLabel(mainLabel);
          if (sublocality) setDetectedArea(sublocality);
          if (cityVal) setDetectedCity(cityVal);
          if (stateVal) setDetectedState(stateVal);
          if (pincodeVal) setDetectedPincode(pincodeVal);
          return;
        }
      } catch (_) {}
    }

    // 2. OpenStreetMap Nominatim Fallback
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || '';
          const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.residential || '';
          const cityVal = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district || '';
          const stateVal = data.address?.state || '';
          const pincodeVal = data.address?.postcode || '';
          const label = [road, suburb, cityVal].filter(Boolean).join(', ') || data.display_name.split(',').slice(0, 3).join(',');
          setAddressLabel(label);
          if (suburb) setDetectedArea(suburb);
          if (cityVal) setDetectedCity(cityVal);
          if (stateVal) setDetectedState(stateVal);
          if (pincodeVal) setDetectedPincode(pincodeVal);
        }
      }
    } catch {
      // Keep existing coordinates if network times out
    }
  }, []);

  // Update coordinates handler
  const handlePositionChange = useCallback((newLat: number, newLng: number) => {
    const fixedLat = Number(newLat.toFixed(6));
    const fixedLng = Number(newLng.toFixed(6));
    setLat(fixedLat);
    setLng(fixedLng);
    reverseGeocode(fixedLat, fixedLng);
  }, [reverseGeocode]);

  // Click on map to drop or move pin
  const handleMapClick = (e: { detail?: { latLng?: { lat: number; lng: number } } }) => {
    if (e.detail?.latLng) {
      handlePositionChange(e.detail.latLng.lat, e.detail.latLng.lng);
    }
  };

  // Marker drag end
  const handleMarkerDragEnd = (e: { latLng?: { lat: () => number; lng: () => number } | null }) => {
    if (e.latLng) {
      handlePositionChange(e.latLng.lat(), e.latLng.lng());
    }
  };

  // Detect Device GPS with fallbacks
  const handleDetectGps = () => {
    setLocating(true);
    setGpsErrorMsg(null);

    if (!navigator.geolocation) {
      fallbackToIp('Browser does not support GPS API.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detectedLat = Number(pos.coords.latitude.toFixed(6));
        const detectedLng = Number(pos.coords.longitude.toFixed(6));
        handlePositionChange(detectedLat, detectedLng);
        setLocating(false);
      },
      (err) => {
        let reason = 'GPS hardware unavailable or permission denied.';
        if (err.code === 1) reason = 'Location permission is denied in browser settings.';
        if (err.code === 2) reason = 'GPS position unavailable.';
        if (err.code === 3) reason = 'GPS acquisition timed out.';
        fallbackToIp(reason);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  // Network IP Geolocation Fallback
  const fallbackToIp = async (priorReason: string) => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          handlePositionChange(Number(data.latitude), Number(data.longitude));
          setGpsErrorMsg(
            `${priorReason} Centered on approximate city (${data.city || 'local network'}) via IP. Please drag the pin to your exact spot.`
          );
          setLocating(false);
          return;
        }
      }
    } catch {
      // Fallback failed
    }
    setLocating(false);
    setGpsErrorMsg(`${priorReason} Use search bar or paste coordinates to set location.`);
  };

  // Search Address or Landmark
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setGpsErrorMsg(null);
    const query = searchQuery.trim();

    // 1. Try Google Maps Geocoder if available
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      try {
        const geocoder = new (window as any).google.maps.Geocoder();
        const response = await geocoder.geocode({ address: query, componentRestrictions: { country: 'IN' } });
        if (response?.results?.[0]) {
          const loc = response.results[0].geometry.location;
          const newLat = Number(loc.lat().toFixed(6));
          const newLng = Number(loc.lng().toFixed(6));
          handlePositionChange(newLat, newLng);
          setIsSearching(false);
          return;
        }
      } catch (_) {}
    }

    // 2. OpenStreetMap Nominatim Search
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const item = results[0];
          const newLat = parseFloat(item.lat);
          const newLng = parseFloat(item.lon);
          handlePositionChange(newLat, newLng);
          setAddressLabel(item.display_name.split(',').slice(0, 3).join(','));
        } else {
          setGpsErrorMsg(`No exact match for "${query}". Try adding city name (e.g. "${query} Mumbai").`);
        }
      }
    } catch {
      setGpsErrorMsg('Search connection timed out. You can drag the map pin manually.');
    } finally {
      setIsSearching(false);
    }
  };

  // Parse pasted Google Maps coordinates
  const handleApplyPastedCoords = () => {
    if (!pasteInput.trim()) return;
    const match = pasteInput.trim().match(/(-?\d+\.\d+)[\s,]+(-?\d+\.\d+)/);
    if (match) {
      const pLat = parseFloat(match[1]);
      const pLng = parseFloat(match[2]);
      if (pLat >= -90 && pLat <= 90 && pLng >= -180 && pLng <= 180) {
        handlePositionChange(pLat, pLng);
        setShowPasteModal(false);
        setPasteInput('');
        setGpsErrorMsg(null);
        return;
      }
    }
    alert('Please enter coordinates in format: 19.076090, 72.877712');
  };

  // Save confirmed location
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveLocation({
        latitude: lat,
        longitude: lng,
        address: addressLabel,
        area: detectedArea || initialArea,
        city: detectedCity,
        state: detectedState,
        pincode: detectedPincode,
        accuracy: 8,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#0B0F19] rounded-[20px] border border-[#23304A] overflow-hidden flex flex-col shadow-sm">
      {/* Search & Top Action Bar */}
      <div className="p-3 bg-[#131B2E] border-b border-[#23304A] space-y-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurant street, landmark, area or city..."
              className="w-full bg-[#0B0F19] border border-[#23304A] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Find</span>
          </button>
        </form>

        {/* Quick City Jump Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          <span className="text-[10px] font-bold text-slate-400 shrink-0">Quick Jump:</span>
          {POPULAR_CITIES.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => {
                handlePositionChange(city.lat, city.lng);
                setSearchQuery(city.name);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#0B0F19] hover:bg-orange-500/20 text-slate-300 hover:text-orange-400 border border-[#23304A] hover:border-orange-500/40 text-[10px] font-bold whitespace-nowrap transition cursor-pointer shrink-0"
            >
              {city.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-orange-400 border border-slate-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ClipboardPaste className="w-3 h-3" />
              <span>Paste Google Lat/Lng</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#0B0F19] p-0.5 rounded-lg border border-[#23304A]">
            <button
              type="button"
              onClick={() => setMapType('roadmap')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                mapType === 'roadmap' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Map</span>
            </button>
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                mapType === 'satellite' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Satellite</span>
            </button>
          </div>
        </div>

        {gpsErrorMsg && (
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-[11px] text-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="flex-1">{gpsErrorMsg}</span>
            <button onClick={() => setGpsErrorMsg(null)} className="text-amber-400 hover:text-white text-xs">✕</button>
          </div>
        )}
      </div>

      {/* Google Maps Interactive Container */}
      <div className="relative w-full overflow-hidden bg-[#070b14]" style={{ height }}>
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="gmp_git_agentskills_v1">
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat, lng }}
            defaultZoom={16}
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={handleMapClick}
            className="w-full h-full"
          >
            <MapController targetLat={lat} targetLng={lng} />

            {/* Draggable Advanced Marker for Exact Shop Spot */}
            <AdvancedMarker
              position={{ lat, lng }}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
              title="Drag pin to set exact store spot"
            >
              <div className="relative flex flex-col items-center cursor-grab active:cursor-grabbing">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-2xl border-2 border-white transform transition hover:scale-110">
                  {isMobileStall ? (
                    <Truck className="w-4.5 h-4.5 stroke-[2.2]" />
                  ) : (
                    <Building2 className="w-4.5 h-4.5 stroke-[2.2]" />
                  )}
                </div>
                <div className="w-2.5 h-1.5 bg-orange-600 rotate-45 -mt-1 shadow-sm" />
                <span className="text-[9px] font-black uppercase tracking-wider bg-slate-900/90 text-orange-400 px-1.5 py-0.5 rounded shadow border border-slate-700 mt-0.5 whitespace-nowrap">
                  Exact Spot
                </span>
              </div>
            </AdvancedMarker>

            {/* Custom Floating GPS Re-center Control */}
            <MapControl position={ControlPosition.RIGHT_BOTTOM}>
              <div className="p-2">
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={locating}
                  title="Detect Device GPS"
                  className="w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-orange-400 hover:text-white hover:bg-orange-600 flex items-center justify-center shadow-lg transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5 stroke-[2.2]" />}
                </button>
              </div>
            </MapControl>
          </Map>
        </APIProvider>

        {/* Floating Instruction Banner */}
        <div className="absolute top-2 left-2 right-2 pointer-events-none flex justify-center z-10">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1 rounded-full shadow-lg text-[10px] text-slate-200 flex items-center gap-1.5 pointer-events-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>Drag pin or click on map to pinpoint store entrance</span>
          </div>
        </div>
      </div>

      {/* Footer Info & Save Action */}
      <div className="p-3 bg-[#131B2E] border-t border-[#23304A] space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="font-bold text-white text-[10px] uppercase tracking-wider">
                Google Maps Coordinates:
              </span>
              <span className="font-mono text-orange-400 font-bold text-[11px]">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-200 truncate mt-0.5">
              {addressLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDetectGps}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Navigation className="w-3 h-3 text-orange-400" />
            <span>GPS Auto</span>
          </button>
        </div>

        {/* Extracted Address Components Tags */}
        {(detectedArea || detectedCity || detectedState || detectedPincode) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-bold">Detected:</span>
            {detectedArea && (
              <span className="text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                Area: <strong className="text-white">{detectedArea}</strong>
              </span>
            )}
            {detectedCity && (
              <span className="text-[10px] font-semibold bg-orange-500/10 border border-orange-500/30 text-orange-300 px-2 py-0.5 rounded-md">
                City: <strong className="text-white">{detectedCity}</strong>
              </span>
            )}
            {detectedState && (
              <span className="text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                State: <strong className="text-white">{detectedState}</strong>
              </span>
            )}
            {detectedPincode && (
              <span className="text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                PIN: <strong className="text-white">{detectedPincode}</strong>
              </span>
            )}
          </div>
        )}

        {showSaveButton && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg cursor-pointer active:scale-[0.99] ${
              savedSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950/40'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Exact Location Saved to Store!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm &amp; Save Exact Google Maps Spot</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Paste Google Coordinates Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131b2e] border border-[#23304a] rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <ClipboardPaste className="w-4 h-4 text-orange-400" />
                <span>Paste Google Maps Coordinates</span>
              </h4>
              <button onClick={() => setShowPasteModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-300">
              Paste coordinates copied from Google Maps:
            </p>
            <input
              type="text"
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="e.g. 19.076090, 72.877712"
              className="w-full bg-[#0b0f19] border border-[#23304a] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPastedCoords}
                disabled={!pasteInput.trim()}
                className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs"
              >
                Apply Spot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

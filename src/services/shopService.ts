import { supabase } from '../lib/supabaseClient';
import { Shop } from '../types';
import { apiCache } from './apiCache';

export interface DbShop {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy_meters?: number | null;
  last_location_updated_at?: string | null;
  is_mobile_stall?: boolean;
  opening_time?: string | null;
  closing_time?: string | null;
  upi_id?: string | null;
  image?: string | null;
  banner_image?: string | null;
  stall_type?: string | null;
  is_open?: boolean;
  is_rush_hour?: boolean;
  table_service_available?: boolean;
  accepts_delivery?: boolean;
  delivery_radius_km?: number | null;
  delivery_fee_type?: string | null;
  delivery_fee_amount?: number | null;
  preparation_time_minutes?: string | null;
  rating?: number | null;
  total_reviews?: number | null;
  created_at?: string;
  updated_at?: string;
}

export function mapDbShopToAppShop(s: DbShop): Shop {
  return {
    id: s.id,
    ownerId: s.owner_id,
    name: s.name,
    shopType: s.stall_type || (s.is_mobile_stall ? 'Food Stall / Food Cart' : 'Restaurant & Cafe'),
    isMobileStall: s.is_mobile_stall ?? (s.stall_type?.toLowerCase().includes('thela') || s.stall_type?.toLowerCase().includes('stall')),
    description: s.description || undefined,
    phone: s.phone || s.contact_phone || undefined,
    address: s.address || undefined,
    area: s.area || undefined,
    city: s.city || undefined,
    state: s.state || undefined,
    pincode: s.pincode || undefined,
    latitude: s.latitude ?? undefined,
    longitude: s.longitude ?? undefined,
    locationAccuracyMeters: s.location_accuracy_meters ?? undefined,
    lastLocationUpdatedAt: s.last_location_updated_at || undefined,
    openingTime: s.opening_time || '10:00 AM',
    closingTime: s.closing_time || '10:00 PM',
    upiId: s.upi_id || undefined,
    logoUrl: s.image || undefined,
    bannerUrl: s.banner_image || undefined,
    isOpen: s.is_open ?? true,
    isRushMode: s.is_rush_hour ?? false,
    rushExtraMinutes: 15,
    minimumOrder: 0,
    acceptsTakeaway: true,
    acceptsDineIn: s.table_service_available ?? true,
    acceptsDelivery: s.accepts_delivery ?? false,
    deliveryRadiusKm: s.delivery_radius_km ?? 3,
    deliveryFeeType: (s.delivery_fee_type as 'free' | 'fixed') || 'free',
    deliveryFeeAmount: s.delivery_fee_amount ?? 0,
    rating: s.rating ?? undefined,
    totalReviews: s.total_reviews ?? undefined,
    preparationTimeMinutes: s.preparation_time_minutes ?? undefined,
    createdAt: s.created_at || new Date().toISOString(),
  };
}

export const shopService = {
  /**
   * Fetch shop associated with owner user ID (cached with stale-while-revalidate)
   */
  async getShopByOwnerId(ownerId: string, forceRefresh = false): Promise<Shop | null> {
    const cacheKey = `shop_owner_${ownerId}`;
    return apiCache.fetchWithCache(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('owner_id', ownerId)
          .maybeSingle();

        if (error) {
          console.warn('[shopService.getShopByOwnerId] Error:', error.message);
          return null;
        }
        return data ? mapDbShopToAppShop(data as DbShop) : null;
      },
      { ttlMs: 30000, tags: ['shop', `owner_${ownerId}`], forceRefresh, staleWhileRevalidate: true }
    );
  },

  /**
   * Fetch shop by primary key ID
   */
  async getShopById(shopId: string, forceRefresh = false): Promise<Shop | null> {
    const cacheKey = `shop_id_${shopId}`;
    return apiCache.fetchWithCache(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('id', shopId)
          .maybeSingle();

        if (error) {
          console.warn('[shopService.getShopById] Error:', error.message);
          return null;
        }
        return data ? mapDbShopToAppShop(data as DbShop) : null;
      },
      { ttlMs: 30000, tags: ['shop', `shop_${shopId}`], forceRefresh, staleWhileRevalidate: true }
    );
  },

  /**
   * Upsert shop details matching database column types
   */
  async upsertShop(shop: Partial<Shop> & { id: string; ownerId: string; name: string }): Promise<Shop | null> {
    apiCache.invalidate('shop');

    const payload: Partial<DbShop> = {
      id: shop.id,
      owner_id: shop.ownerId,
      name: shop.name.trim(),
      stall_type: shop.shopType || 'Restaurant',
      description: shop.description || null,
      phone: shop.phone || null,
      contact_phone: shop.phone || null,
      address: shop.address || null,
      area: shop.area || null,
      city: shop.city || null,
      state: shop.state || null,
      pincode: shop.pincode || null,
      latitude: shop.latitude ?? null,
      longitude: shop.longitude ?? null,
      location_accuracy_meters: shop.locationAccuracyMeters ?? null,
      last_location_updated_at: shop.lastLocationUpdatedAt || (shop.latitude && shop.longitude ? new Date().toISOString() : null),
      is_mobile_stall: shop.isMobileStall ?? false,
      opening_time: shop.openingTime || '10:00 AM',
      closing_time: shop.closingTime || '10:00 PM',
      upi_id: shop.upiId || null,
      image: shop.logoUrl || null,
      banner_image: shop.bannerUrl || null,
      is_open: shop.isOpen ?? true,
      is_rush_hour: shop.isRushMode ?? false,
      table_service_available: shop.acceptsDineIn ?? true,
      accepts_delivery: shop.acceptsDelivery ?? false,
      delivery_radius_km: shop.deliveryRadiusKm ?? 3,
      delivery_fee_type: shop.deliveryFeeType || 'free',
      delivery_fee_amount: shop.deliveryFeeAmount ?? 0,
      preparation_time_minutes: '10-15',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('shops')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[shopService.upsertShop] Error:', error.message);
      throw error;
    }
    return data ? mapDbShopToAppShop(data as DbShop) : null;
  },

  /**
   * Update shop open/closed status
   */
  async updateShopStatus(shopId: string, isOpen: boolean): Promise<boolean> {
    apiCache.invalidate('shop');

    const { error } = await supabase
      .from('shops')
      .update({
        is_open: isOpen,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId);

    if (error) {
      console.error('[shopService.updateShopStatus] Error:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Update rush hour mode
   */
  async updateRushMode(shopId: string, isRushHour: boolean, extraMinutes?: number): Promise<boolean> {
    apiCache.invalidate('shop');

    const { error } = await supabase
      .from('shops')
      .update({
        is_rush_hour: isRushHour,
        preparation_time_minutes: isRushHour ? `${(extraMinutes || 15) + 10} min` : '10-15 min',
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId);

    if (error) {
      console.error('[shopService.updateRushMode] Error:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Update shop location explicitly (for mobile stalls or permanent restaurants)
   */
  async updateShopLocation(
    shopId: string, 
    location: {
      latitude: number;
      longitude: number;
      locationAccuracyMeters?: number;
      lastLocationUpdatedAt?: string;
      isMobileStall?: boolean;
      address?: string;
      area?: string;
    }
  ): Promise<boolean> {
    apiCache.invalidate('shop');

    const updatePayload: Record<string, any> = {
      latitude: location.latitude,
      longitude: location.longitude,
      last_location_updated_at: location.lastLocationUpdatedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (location.locationAccuracyMeters !== undefined) {
      updatePayload.location_accuracy_meters = location.locationAccuracyMeters;
    }
    if (location.isMobileStall !== undefined) {
      updatePayload.is_mobile_stall = location.isMobileStall;
    }
    if (location.address) {
      updatePayload.address = location.address;
    }
    if (location.area) {
      updatePayload.area = location.area;
    }

    const { error } = await supabase
      .from('shops')
      .update(updatePayload)
      .eq('id', shopId);

    if (error) {
      console.error('[shopService.updateShopLocation] Error:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Fetch active, approved shops from database using PostGIS find_nearby_shops RPC
   */
  async fetchNearbyPublicShops(
    customerLat: number,
    customerLng: number,
    radiusKm: number = 5,
    serviceType: 'all' | 'dine_in' | 'takeaway' | 'delivery' = 'all'
  ): Promise<Shop[]> {
    try {
      const { data, error } = await supabase.rpc('find_nearby_shops', {
        customer_lat: customerLat,
        customer_lng: customerLng,
        radius_km: radiusKm,
        service_type: serviceType,
      });

      if (!error && Array.isArray(data)) {
        return data.map((item: any) => ({
          id: item.id,
          ownerId: 'public',
          name: item.name,
          shopType: item.stall_type || (item.is_mobile_stall ? 'Food Stall / Food Cart' : 'Restaurant & Cafe'),
          isMobileStall: item.is_mobile_stall ?? false,
          address: item.address || undefined,
          area: item.area || undefined,
          city: item.city || undefined,
          latitude: item.latitude,
          longitude: item.longitude,
          rating: item.rating ?? undefined,
          totalReviews: item.total_reviews ?? undefined,
          preparationTimeMinutes: item.preparation_time_minutes ?? undefined,
          isOpen: item.is_open,
          isRushMode: false,
          rushExtraMinutes: 15,
          minimumOrder: 0,
          acceptsTakeaway: true,
          acceptsDineIn: item.table_service_available,
          acceptsDelivery: item.accepts_delivery,
          deliveryRadiusKm: item.delivery_radius_km ?? 3,
          deliveryFeeType: (item.delivery_fee_type as 'free' | 'fixed') || 'free',
          deliveryFeeAmount: item.delivery_fee_amount ?? 0,
          distanceMeters: item.distance_meters,
          distanceKm: item.distance_km,
        }));
      }

      console.warn('[shopService.fetchNearbyPublicShops] PostGIS RPC fallback notice:', error?.message);
      // Fallback query if RPC ever encounters an issue
      const { data: fallbackData } = await supabase
        .from('shops')
        .select('*')
        .eq('is_active', true)
        .eq('is_open', true)
        .limit(30);

      return (fallbackData || []).map((d) => mapDbShopToAppShop(d as DbShop));
    } catch (err) {
      console.warn('[shopService.fetchNearbyPublicShops] Error:', err);
      return [];
    }
  },
};


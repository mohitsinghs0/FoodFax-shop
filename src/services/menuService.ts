import { supabase } from '../lib/supabaseClient';
import { MenuCategory, MenuItem } from '../types';
import { apiCache } from './apiCache';

export interface DbCategory {
  id: string;
  shop_id: string;
  name: string;
  display_order?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface DbMenuItem {
  id: string;
  shop_id: string;
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  is_veg?: boolean;
  is_available?: boolean;
  display_order?: number;
  preparation_time_min?: number;
  is_bestseller?: boolean;
  image?: string | null;
  created_at?: string;
}

export const menuService = {
  /**
   * Fetch all categories for a shop (cached with stale-while-revalidate)
   */
  async getCategories(shopId: string, forceRefresh = false): Promise<MenuCategory[]> {
    const cacheKey = `categories_${shopId}`;
    return apiCache.fetchWithCache(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .or(`shop_id.eq.${shopId},shop_id.is.null`)
          .order('display_order', { ascending: true });

        if (error) {
          console.warn('[menuService.getCategories] Error:', error.message);
          return [];
        }

        return (data || []).map((c: any) => ({
          id: c.id,
          shopId: c.shop_id || shopId,
          name: c.name,
          sortOrder: c.display_order ?? 0,
          isActive: c.is_active ?? true,
        }));
      },
      { ttlMs: 30000, tags: ['categories', `shop_${shopId}`], forceRefresh, staleWhileRevalidate: true }
    );
  },

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: string, shopId?: string): Promise<boolean> {
    if (shopId) {
      apiCache.invalidate(`categories_${shopId}`);
    } else {
      apiCache.invalidate('categories');
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('[menuService.deleteCategory] Error:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Add a new category
   */
  async addCategory(shopId: string, name: string, displayOrder = 0): Promise<MenuCategory | null> {
    const id = crypto.randomUUID();
    apiCache.invalidate(`categories_${shopId}`);

    const { data, error } = await supabase
      .from('categories')
      .insert({
        id,
        shop_id: shopId,
        name: name.trim(),
        display_order: displayOrder,
        is_active: true,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[menuService.addCategory] Error:', error.message);
      return null;
    }

    return data
      ? {
          id: data.id,
          shopId: data.shop_id,
          name: data.name,
          sortOrder: data.display_order ?? 0,
          isActive: data.is_active ?? true,
        }
      : null;
  },

  /**
   * Fetch all menu items for a shop (cached with deduplication)
   */
  async getMenuItems(shopId: string, forceRefresh = false): Promise<MenuItem[]> {
    const cacheKey = `menu_items_${shopId}`;
    return apiCache.fetchWithCache(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('shop_id', shopId)
          .order('display_order', { ascending: true });

        if (error) {
          console.warn('[menuService.getMenuItems] Error:', error.message);
          return [];
        }

        return (data || []).map((i: any) => ({
          id: i.id,
          shopId: i.shop_id,
          categoryId: i.category_id,
          name: i.name,
          description: i.description || undefined,
          price: Number(i.price || 0),
          isVeg: i.is_veg ?? true,
          isAvailable: i.is_available ?? true,
          preparationTimeMinutes: i.preparation_time_min || 10,
          tag: i.is_bestseller ? 'Bestseller' : undefined,
          imageUrl: i.image || undefined,
        }));
      },
      { ttlMs: 30000, tags: ['menu_items', `shop_${shopId}`], forceRefresh, staleWhileRevalidate: true }
    );
  },

  /**
   * Upsert a menu item
   */
  async upsertMenuItem(item: Partial<MenuItem> & { id: string; shopId: string; name: string; price: number }): Promise<boolean> {
    apiCache.invalidate(`menu_items_${item.shopId}`);

    const payload = {
      id: item.id,
      shop_id: item.shopId,
      category_id: item.categoryId || null,
      name: item.name.trim(),
      description: item.description || null,
      price: item.price,
      is_veg: item.isVeg ?? true,
      is_available: item.isAvailable ?? true,
      image: item.imageUrl || null,
      is_bestseller: item.tag === 'Bestseller',
      preparation_time_min: item.preparationTimeMinutes || 10,
    };

    const { error } = await supabase
      .from('menu_items')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[menuService.upsertMenuItem] Error:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Delete a menu item
   */
  async deleteMenuItem(itemId: string, shopId?: string): Promise<boolean> {
    if (shopId) {
      apiCache.invalidate(`menu_items_${shopId}`);
    } else {
      apiCache.invalidate('menu_items');
    }

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('[menuService.deleteMenuItem] Error:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Toggle item availability
   */
  async toggleAvailability(itemId: string, isAvailable: boolean, shopId?: string): Promise<boolean> {
    if (shopId) {
      apiCache.invalidate(`menu_items_${shopId}`);
    } else {
      apiCache.invalidate('menu_items');
    }

    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: isAvailable })
      .eq('id', itemId);

    if (error) {
      console.error('[menuService.toggleAvailability] Error:', error.message);
      return false;
    }
    return true;
  },
};

/**
 * IndexedDB Service for Foodfax Shop App
 * Provides persistent offline storage for orders, menu items, categories, and shops,
 * with a resilient background mutation sync queue for intermittent connectivity.
 */

import { MenuItem, MenuCategory, OwnerOrder, Shop } from '../types';

const DB_NAME = 'FoodfaxShopDB';
const DB_VERSION = 1;

export interface OfflineMutation {
  id: string;
  timestamp: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'orders' | 'menu_items' | 'categories' | 'shops';
  recordId: string;
  payload?: any;
}

class IndexedDbService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase | null> | null = null;
  private isSupported = typeof window !== 'undefined' && 'indexedDB' in window;

  constructor() {
    if (this.isSupported) {
      this.initPromise = this.openDatabase();
    }
  }

  private openDatabase(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('shops')) {
            db.createObjectStore('shops', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('categories')) {
            const catStore = db.createObjectStore('categories', { keyPath: 'id' });
            catStore.createIndex('shopId', 'shopId', { unique: false });
          }

          if (!db.objectStoreNames.contains('menu_items')) {
            const itemStore = db.createObjectStore('menu_items', { keyPath: 'id' });
            itemStore.createIndex('shopId', 'shopId', { unique: false });
            itemStore.createIndex('categoryId', 'categoryId', { unique: false });
          }

          if (!db.objectStoreNames.contains('orders')) {
            const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
            orderStore.createIndex('shopId', 'shopId', { unique: false });
            orderStore.createIndex('status', 'status', { unique: false });
          }

          if (!db.objectStoreNames.contains('sync_queue')) {
            db.createObjectStore('sync_queue', { keyPath: 'id' });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve(this.db);
        };

        request.onerror = (err) => {
          console.warn('[IndexedDbService] Failed to open IndexedDB, falling back to local storage cache:', err);
          resolve(null);
        };
      } catch (err) {
        console.warn('[IndexedDbService] IndexedDB init exception:', err);
        resolve(null);
      }
    });
  }

  private async getDb(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;
    return null;
  }

  // ================= MENU ITEMS CACHE =================

  async saveMenuItemsOffline(items: MenuItem[]): Promise<void> {
    const db = await this.getDb();
    if (!db) {
      try {
        localStorage.setItem('foodfax_offline_menu_items', JSON.stringify(items));
      } catch (_) {}
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('menu_items', 'readwrite');
        const store = tx.objectStore('menu_items');
        items.forEach((item) => store.put(item));
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }

  async getMenuItemsOffline(shopId?: string): Promise<MenuItem[]> {
    const db = await this.getDb();
    if (!db) {
      try {
        const raw = localStorage.getItem('foodfax_offline_menu_items');
        const parsed: MenuItem[] = raw ? JSON.parse(raw) : [];
        return shopId ? parsed.filter((i) => i.shopId === shopId) : parsed;
      } catch (_) {
        return [];
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('menu_items', 'readonly');
        const store = tx.objectStore('menu_items');
        const request = store.getAll();

        request.onsuccess = () => {
          const items: MenuItem[] = request.result || [];
          resolve(shopId ? items.filter((i) => i.shopId === shopId) : items);
        };
        request.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  async saveMenuItemOffline(item: MenuItem): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('menu_items', 'readwrite');
        tx.objectStore('menu_items').put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }

  async deleteMenuItemOffline(id: string): Promise<void> {
    const db = await this.getDb();
    if (!db) {
      try {
        const raw = localStorage.getItem('foodfax_offline_menu_items');
        if (raw) {
          const items: MenuItem[] = JSON.parse(raw);
          localStorage.setItem('foodfax_offline_menu_items', JSON.stringify(items.filter((i) => i.id !== id)));
        }
      } catch (_) {}
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('menu_items', 'readwrite');
        tx.objectStore('menu_items').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }

  // ================= CATEGORIES CACHE =================

  async saveCategoriesOffline(categories: MenuCategory[]): Promise<void> {
    const db = await this.getDb();
    if (!db) {
      try {
        localStorage.setItem('foodfax_offline_categories', JSON.stringify(categories));
      } catch (_) {}
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('categories', 'readwrite');
        const store = tx.objectStore('categories');
        categories.forEach((cat) => store.put(cat));
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }

  async getCategoriesOffline(shopId?: string): Promise<MenuCategory[]> {
    const db = await this.getDb();
    if (!db) {
      try {
        const raw = localStorage.getItem('foodfax_offline_categories');
        const parsed: MenuCategory[] = raw ? JSON.parse(raw) : [];
        return shopId ? parsed.filter((c) => !c.shopId || c.shopId === shopId) : parsed;
      } catch (_) {
        return [];
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('categories', 'readonly');
        const store = tx.objectStore('categories');
        const request = store.getAll();

        request.onsuccess = () => {
          const cats: MenuCategory[] = request.result || [];
          resolve(shopId ? cats.filter((c) => !c.shopId || c.shopId === shopId) : cats);
        };
        request.onerror = () => resolve([]);
      } catch (_) {
        resolve([]);
      }
    });
  }

  async deleteCategoryOffline(id: string): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('categories', 'readwrite');
        tx.objectStore('categories').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }

  // ================= ORDERS CACHE =================

  async saveOrdersOffline(orders: OwnerOrder[]): Promise<void> {
    const db = await this.getDb();
    if (!db) {
      try {
        localStorage.setItem('foodfax_offline_orders', JSON.stringify(orders.slice(0, 50)));
      } catch (_) {}
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('orders', 'readwrite');
        const store = tx.objectStore('orders');
        orders.forEach((o) => store.put(o));
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }

  async getOrdersOffline(shopId?: string): Promise<OwnerOrder[]> {
    const db = await this.getDb();
    if (!db) {
      try {
        const raw = localStorage.getItem('foodfax_offline_orders');
        const parsed: OwnerOrder[] = raw ? JSON.parse(raw) : [];
        return shopId ? parsed.filter((o) => o.shopId === shopId) : parsed;
      } catch (_) {
        return [];
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('orders', 'readonly');
        const store = tx.objectStore('orders');
        const request = store.getAll();

        request.onsuccess = () => {
          const ords: OwnerOrder[] = request.result || [];
          resolve(shopId ? ords.filter((o) => o.shopId === shopId) : ords);
        };
        request.onerror = () => resolve([]);
      } catch (_) {
        resolve([]);
      }
    });
  }

  async saveOrderOffline(order: OwnerOrder): Promise<void> {
    const db = await this.getDb();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('orders', 'readwrite');
        tx.objectStore('orders').put(order);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }

  // ================= SHOP CACHE =================

  async saveShopOffline(shop: Shop): Promise<void> {
    const db = await this.getDb();
    if (!db) {
      try {
        localStorage.setItem('foodfax_offline_shop', JSON.stringify(shop));
      } catch (_) {}
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('shops', 'readwrite');
        tx.objectStore('shops').put(shop);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }

  async getShopOffline(shopId?: string): Promise<Shop | null> {
    const db = await this.getDb();
    if (!db) {
      try {
        const raw = localStorage.getItem('foodfax_offline_shop');
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('shops', 'readonly');
        const store = tx.objectStore('shops');
        if (shopId) {
          const request = store.get(shopId);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
        } else {
          const request = store.getAll();
          request.onsuccess = () => {
            const list = request.result || [];
            resolve(list.length > 0 ? list[0] : null);
          };
          request.onerror = () => resolve(null);
        }
      } catch (_) {
        resolve(null);
      }
    });
  }

  // ================= BACKGROUND RESILIENT MUTATION QUEUE =================

  async enqueueMutation(mutation: Omit<OfflineMutation, 'id' | 'timestamp'>): Promise<string> {
    const id = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullMutation: OfflineMutation = {
      ...mutation,
      id,
      timestamp: Date.now(),
    };

    const db = await this.getDb();
    if (!db) {
      try {
        const raw = localStorage.getItem('foodfax_offline_queue') || '[]';
        const queue: OfflineMutation[] = JSON.parse(raw);
        queue.push(fullMutation);
        localStorage.setItem('foodfax_offline_queue', JSON.stringify(queue));
      } catch (_) {}
      return id;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('sync_queue', 'readwrite');
        tx.objectStore('sync_queue').put(fullMutation);
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => resolve(id);
      } catch (_) {
        resolve(id);
      }
    });
  }

  async getPendingMutations(): Promise<OfflineMutation[]> {
    const db = await this.getDb();
    if (!db) {
      try {
        const raw = localStorage.getItem('foodfax_offline_queue');
        return raw ? JSON.parse(raw) : [];
      } catch (_) {
        return [];
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      } catch (_) {
        resolve([]);
      }
    });
  }

  async removeMutation(id: string): Promise<void> {
    const db = await this.getDb();
    if (!db) {
      try {
        const raw = localStorage.getItem('foodfax_offline_queue');
        if (raw) {
          const queue: OfflineMutation[] = JSON.parse(raw);
          localStorage.setItem('foodfax_offline_queue', JSON.stringify(queue.filter((m) => m.id !== id)));
        }
      } catch (_) {}
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('sync_queue', 'readwrite');
        tx.objectStore('sync_queue').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }

  async clearPendingMutations(): Promise<void> {
    const db = await this.getDb();
    if (!db) {
      localStorage.removeItem('foodfax_offline_queue');
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('sync_queue', 'readwrite');
        tx.objectStore('sync_queue').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }

  /**
   * Replays all offline queued mutations to Supabase when connectivity resumes
   */
  async flushMutationQueue(supabaseClient: any): Promise<{ syncedCount: number; errors: number }> {
    if (!supabaseClient) return { syncedCount: 0, errors: 0 };
    const mutations = await this.getPendingMutations();
    if (mutations.length === 0) return { syncedCount: 0, errors: 0 };

    let syncedCount = 0;
    let errors = 0;

    for (const mut of mutations) {
      try {
        if (mut.table === 'menu_items') {
          if (mut.action === 'DELETE') {
            await supabaseClient.from('menu_items').delete().eq('id', mut.recordId);
          } else if (mut.action === 'INSERT' || mut.action === 'UPDATE') {
            await supabaseClient.from('menu_items').upsert(mut.payload, { onConflict: 'id' });
          }
        } else if (mut.table === 'categories') {
          if (mut.action === 'DELETE') {
            await supabaseClient.from('categories').delete().eq('id', mut.recordId);
          } else if (mut.action === 'INSERT') {
            await supabaseClient.from('categories').insert(mut.payload);
          }
        } else if (mut.table === 'orders') {
          if (mut.action === 'UPDATE') {
            await supabaseClient.from('orders').update(mut.payload).eq('id', mut.recordId);
          }
        } else if (mut.table === 'shops') {
          if (mut.action === 'UPDATE') {
            await supabaseClient.from('shops').update(mut.payload).eq('id', mut.recordId);
          }
        }

        await this.removeMutation(mut.id);
        syncedCount++;
      } catch (err) {
        console.warn(`[IndexedDbService] Error syncing mutation ${mut.id}:`, err);
        errors++;
      }
    }

    return { syncedCount, errors };
  }
}

export const indexedDbService = new IndexedDbService();

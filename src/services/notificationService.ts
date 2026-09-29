// Browser Push Notification Service (HTML5 Notification API)
import { OwnerOrder } from '../types';

class BrowserNotificationService {
  private enabled: boolean = true;
  private permission: NotificationPermission = 'default';

  constructor() {
    const saved = localStorage.getItem('foodfax_push_notifications_enabled');
    this.enabled = saved !== null ? saved === 'true' : true;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('foodfax_push_notifications_enabled', enabled ? 'true' : 'false');
    if (enabled && this.isSupported() && this.permission === 'default') {
      this.requestPermission();
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  /**
   * Check if app tab is hidden / in background
   */
  public isAppInBackground(): boolean {
    if (typeof document === 'undefined') return false;
    return document.visibilityState === 'hidden' || !document.hasFocus();
  }

  /**
   * Triggers a browser push notification for an incoming order
   */
  public notifyNewOrder(order: OwnerOrder, force: boolean = false): boolean {
    if (!this.enabled) return false;
    if (!this.isSupported()) return false;

    // Only notify if tab is in the background or forced (e.g. testing)
    const inBackground = this.isAppInBackground();
    if (!inBackground && !force) {
      return false;
    }

    if (Notification.permission === 'granted') {
      this.dispatchNotification(order);
      return true;
    } else if (Notification.permission === 'default') {
      this.requestPermission().then((perm) => {
        if (perm === 'granted') {
          this.dispatchNotification(order);
        }
      });
      return false;
    }

    return false;
  }

  private dispatchNotification(order: OwnerOrder): void {
    try {
      const title = `🔔 New Order #${order.orderNumber || order.id.slice(-4)} Received!`;
      const itemCount = order.items?.length || 0;
      const itemsSummary = order.items && order.items.length > 0
        ? order.items.map((i) => `${i.quantity}x ${i.name}`).slice(0, 3).join(', ')
        : 'New incoming items';
      
      const body = `Total ₹${order.totalAmount} • ${order.customerName || 'Customer'}\nItems: ${itemsSummary}${itemCount > 3 ? ` (+${itemCount - 3} more)` : ''}`;

      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `order-${order.id}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('Could not display browser notification:', e);
    }
  }

  /**
   * Test push notification
   */
  public triggerTestNotification(): void {
    const mockOrder: OwnerOrder = {
      id: 'test-' + Date.now(),
      shopId: 'shop-demo',
      orderNumber: 'TEST-99',
      customerName: 'Aman Singh',
      customerPhone: '+91 9876543210',
      status: 'pending',
      orderType: 'dine_in',
      subtotal: 250,
      tax: 0,
      discount: 0,
      totalAmount: 250,
      estimatedPrepMinutes: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      items: [
        { id: 'item-1', menuItemId: 'm-1', name: 'Special Vada Pav', quantity: 2, price: 50, isVeg: true },
        { id: 'item-2', menuItemId: 'm-2', name: 'Cold Coffee', quantity: 1, price: 150, isVeg: true },
      ],
    };
    this.notifyNewOrder(mockOrder, true);
  }
}

export const browserNotificationService = new BrowserNotificationService();

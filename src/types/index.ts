export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  id: string;
  orderId?: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  notes?: string;
}

export interface OwnerOrder {
  id: string;
  shopId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'cod';
  paymentMethod: 'upi' | 'cash' | 'card';
  cancellationReason?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  estimatedPrepMinutes: number;
}

export interface MenuItem {
  id: string;
  shopId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl?: string;
  preparationTimeMinutes: number;
  tag?: string; // 'Bestseller', 'Chef Special', 'Must Try'
  createdAt?: string;
}

export interface MenuCategory {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export const DEFAULT_MENU_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', shopId: 'default', name: 'Vada Pav & Chaat', sortOrder: 1, isActive: true },
  { id: 'cat-2', shopId: 'default', name: 'Chai & Beverages', sortOrder: 2, isActive: true },
  { id: 'cat-3', shopId: 'default', name: 'Rolls & Fast Food', sortOrder: 3, isActive: true },
  { id: 'cat-4', shopId: 'default', name: 'Thali & Meals', sortOrder: 4, isActive: true },
  { id: 'cat-5', shopId: 'default', name: 'Desserts & Shakes', sortOrder: 5, isActive: true },
  { id: 'cat-6', shopId: 'default', name: 'Snacks & Starters', sortOrder: 6, isActive: true },
  { id: 'cat-7', shopId: 'default', name: 'South Indian & Dosa', sortOrder: 7, isActive: true },
  { id: 'cat-8', shopId: 'default', name: 'Chinese & Noodles', sortOrder: 8, isActive: true },
  { id: 'cat-9', shopId: 'default', name: 'Burgers & Sandwiches', sortOrder: 9, isActive: true },
];

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  shopType?: string;
  isMobileStall?: boolean;
  description?: string;
  phone?: string;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracyMeters?: number;
  lastLocationUpdatedAt?: string;
  openingTime?: string;
  closingTime?: string;
  upiId?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isOpen: boolean;
  isRushMode: boolean;
  rushExtraMinutes: number;
  minimumOrder: number;
  acceptsTakeaway: boolean;
  acceptsDineIn: boolean;
  acceptsDelivery: boolean;
  isMapSpotActive?: boolean;
  deliveryRadiusKm?: number;
  deliveryFeeType?: 'free' | 'fixed';
  deliveryFeeAmount?: number;
  rating?: number;
  totalReviews?: number;
  preparationTimeMinutes?: string;
  distanceMeters?: number;
  distanceKm?: number;
  createdAt?: string;
}

export interface DashboardCardPreferences {
  todaySales: boolean;
  activeOrders: boolean;
  preparingOrders: boolean;
  completedOrders: boolean;
  topSellingItems: boolean;
  quickActions: boolean;
  recentOrders: boolean;
}

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardCardPreferences = {
  todaySales: true,
  activeOrders: true,
  preparingOrders: true,
  completedOrders: true,
  topSellingItems: true,
  quickActions: true,
  recentOrders: true,
};

export interface OwnerProfile {
  id: string;
  email?: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  role: 'owner';
  dashboardLayout?: DashboardCardPreferences;
  createdAt?: string;
}

export type ActiveScreen =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'shop_setup'
  | 'dashboard'
  | 'orders'
  | 'menu'
  | 'shop_qr'
  | 'sales'
  | 'profile';

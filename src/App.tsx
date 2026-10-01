/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense, lazy } from 'react';
import { OwnerAppProvider, useOwnerApp } from './context/OwnerAppContext';
import { MobileFrame } from './components/MobileFrame';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { ScreenSkeletonFallback } from './components/ScreenSkeletonFallback';
import { MenuItem } from './types';
import { Zap } from 'lucide-react';

// LAZY LOADED ROUTE CHUNKS FOR SIGNIFICANT INITIAL BUNDLE REDUCTION
const SplashScreen = lazy(() => import('./screens/SplashScreen').then(m => ({ default: m.SplashScreen })));
const OnboardingScreen = lazy(() => import('./screens/OnboardingScreen').then(m => ({ default: m.OnboardingScreen })));
const LoginScreen = lazy(() => import('./screens/LoginScreen').then(m => ({ default: m.LoginScreen })));
const RegisterScreen = lazy(() => import('./screens/RegisterScreen').then(m => ({ default: m.RegisterScreen })));
const ShopSetupScreen = lazy(() => import('./screens/ShopSetupScreen').then(m => ({ default: m.ShopSetupScreen })));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen').then(m => ({ default: m.DashboardScreen })));
const OrdersScreen = lazy(() => import('./screens/OrdersScreen').then(m => ({ default: m.OrdersScreen })));
const OrderDetailsModal = lazy(() => import('./screens/OrderDetailsModal').then(m => ({ default: m.OrderDetailsModal })));
const MenuScreen = lazy(() => import('./screens/MenuScreen').then(m => ({ default: m.MenuScreen })));
const AddEditMenuItemModal = lazy(() => import('./screens/AddEditMenuItemModal').then(m => ({ default: m.AddEditMenuItemModal })));
const ShopQrScreen = lazy(() => import('./screens/ShopQrScreen').then(m => ({ default: m.ShopQrScreen })));
const SalesScreen = lazy(() => import('./screens/SalesScreen').then(m => ({ default: m.SalesScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const ShopSettingsModal = lazy(() => import('./screens/ShopSettingsModal').then(m => ({ default: m.ShopSettingsModal })));
const ShopProfileModal = lazy(() => import('./screens/ShopProfileModal').then(m => ({ default: m.ShopProfileModal })));
const NotificationsModal = lazy(() => import('./screens/NotificationsModal').then(m => ({ default: m.NotificationsModal })));
const OptimizationDiagnosticsModal = lazy(() => import('./components/OptimizationDiagnosticsModal').then(m => ({ default: m.OptimizationDiagnosticsModal })));

const MainAppContent: React.FC = () => {
  const { activeScreen, isAuthenticated, hasCompletedShopSetup, selectedOrderId } = useOwnerApp();

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [showShopProfileModal, setShowShopProfileModal] = useState<boolean>(false);
  const [showOptimizationModal, setShowOptimizationModal] = useState<boolean>(false);
  const [isMemoizationActive, setIsMemoizationActive] = useState<boolean>(true);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [showAddMenuModal, setShowAddMenuModal] = useState<boolean>(false);

  // Authenticated internal screen check
  const isInternalApp =
    isAuthenticated &&
    hasCompletedShopSetup &&
    !['splash', 'onboarding', 'login', 'register', 'shop_setup'].includes(activeScreen);

  // Strict Anti-Bypass & Safe Routing Guard:
  // 1. If not authenticated, force public screen or login.
  // 2. If authenticated but has not completed shop setup, force shop_setup unless on profile.
  const isPublicScreen = ['splash', 'onboarding', 'login', 'register'].includes(activeScreen);
  const effectiveScreen = !isAuthenticated
    ? (isPublicScreen ? activeScreen : 'login')
    : (!hasCompletedShopSetup && !['shop_setup', 'profile'].includes(activeScreen)
      ? 'shop_setup'
      : activeScreen);

  return (
    <MobileFrame>
      {/* Top App Bar on internal screens */}
      {isInternalApp && (
        <TopAppBar
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onOpenOptimizationDiagnostics={() => setShowOptimizationModal(true)}
        />
      )}

      {/* Screen Router wrapped in Suspense with smooth Skeleton Loader */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative">
        <Suspense fallback={<ScreenSkeletonFallback />}>
          {effectiveScreen === 'splash' && <SplashScreen />}
          {effectiveScreen === 'onboarding' && <OnboardingScreen />}
          {effectiveScreen === 'login' && <LoginScreen />}
          {effectiveScreen === 'register' && <RegisterScreen />}
          {effectiveScreen === 'shop_setup' && <ShopSetupScreen />}
          {effectiveScreen === 'dashboard' && <DashboardScreen />}
          {effectiveScreen === 'orders' && <OrdersScreen />}
          {effectiveScreen === 'menu' && (
            <MenuScreen
              onOpenAddItem={(item) => {
                setEditingMenuItem(item || null);
                setShowAddMenuModal(true);
              }}
            />
          )}
          {effectiveScreen === 'shop_qr' && <ShopQrScreen />}
          {effectiveScreen === 'sales' && <SalesScreen />}
          {effectiveScreen === 'profile' && (
            <ProfileScreen
              onOpenSettings={() => setShowSettingsModal(true)}
              onOpenNotifications={() => setShowNotificationsModal(true)}
              onOpenShopProfile={() => setShowShopProfileModal(true)}
            />
          )}
        </Suspense>
      </main>

      {/* Bottom Nav Bar on internal screens - Pinned and fixed at bottom */}
      {isInternalApp && <BottomNavBar />}

      {/* On-demand Lazy-loaded Modals - Mounted only when needed */}
      <Suspense fallback={null}>
        {/* Order Details Modal (loads only when an order is selected) */}
        {selectedOrderId && <OrderDetailsModal />}

        {/* Add / Edit Menu Item Modal */}
        {showAddMenuModal && (
          <AddEditMenuItemModal
            itemToEdit={editingMenuItem}
            onClose={() => {
              setShowAddMenuModal(false);
              setEditingMenuItem(null);
            }}
          />
        )}

        {/* Shop Operations Settings Modal */}
        {showSettingsModal && (
          <ShopSettingsModal onClose={() => setShowSettingsModal(false)} />
        )}

        {/* Shop Profile Modal */}
        {showShopProfileModal && (
          <ShopProfileModal onClose={() => setShowShopProfileModal(false)} />
        )}

        {/* Live Store Notifications Modal */}
        {showNotificationsModal && (
          <NotificationsModal onClose={() => setShowNotificationsModal(false)} />
        )}

        {/* Performance & Latency Diagnostics Modal */}
        {showOptimizationModal && (
          <OptimizationDiagnosticsModal
            isOpen={showOptimizationModal}
            onClose={() => setShowOptimizationModal(false)}
            isMemoizationActive={isMemoizationActive}
            onToggleMemoization={() => setIsMemoizationActive((prev) => !prev)}
          />
        )}
      </Suspense>
    </MobileFrame>
  );
};

export default function App() {
  return (
    <OwnerAppProvider>
      <MainAppContent />
    </OwnerAppProvider>
  );
}

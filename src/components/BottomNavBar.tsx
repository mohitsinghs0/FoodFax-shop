import React from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { ActiveScreen } from '../types';
import { LayoutGrid, Receipt, UtensilsCrossed, QrCode, User } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const { activeScreen, setActiveScreen, orders } = useOwnerApp();

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  const navItems: { screen: ActiveScreen; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      screen: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutGrid className="w-5 h-5 stroke-[2]" />,
    },
    {
      screen: 'orders',
      label: 'Orders',
      icon: <Receipt className="w-5 h-5 stroke-[2]" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      screen: 'menu',
      label: 'Menu',
      icon: <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />,
    },
    {
      screen: 'shop_qr',
      label: 'QR Code',
      icon: <QrCode className="w-5 h-5 stroke-[2]" />,
    },
    {
      screen: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5 stroke-[2]" />,
    },
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-[#0B0F19]/95 backdrop-blur-md border-t border-[#1E293B] w-full shrink-0 z-40 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
      <div className="grid grid-cols-5 h-16 w-full max-w-[440px] mx-auto items-stretch px-1">
        {navItems.map((item) => {
          const isActive = activeScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => setActiveScreen(item.screen)}
              className="flex flex-col items-center justify-center h-full relative cursor-pointer group transition-all px-0.5 active:scale-95"
              aria-label={item.label}
            >
              {/* Active top accent pill indicator - perfectly centered! */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.9)]" />
              )}

              <div className="relative flex items-center justify-center mt-1">
                <span
                  className={`transition-all duration-200 ${
                    isActive ? 'scale-110 text-[#F97316]' : 'text-[#64748B] group-hover:text-[#94A3B8]'
                  }`}
                >
                  {item.icon}
                </span>

                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center bg-orange-600 text-white shadow-sm ring-1 ring-[#0B0F19]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] sm:text-[11px] mt-1.5 tracking-tight truncate w-full text-center leading-none transition-colors ${
                  isActive
                    ? 'text-[#F97316] font-bold'
                    : 'text-[#64748B] group-hover:text-[#94A3B8] font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

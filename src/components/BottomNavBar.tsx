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
      label: 'Shop QR',
      icon: <QrCode className="w-5 h-5 stroke-[2]" />,
    },
    {
      screen: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5 stroke-[2]" />,
    },
  ];

  return (
    <nav className="bg-[#0B0F19] border-t border-[#131B2E] px-2 py-1.5 sticky bottom-0 z-30 select-none">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => setActiveScreen(item.screen)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive ? 'text-[#F97316] font-bold' : 'text-[#64748B] hover:text-[#94A3B8] font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center bg-[#F97316] text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

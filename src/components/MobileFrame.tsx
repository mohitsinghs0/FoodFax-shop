import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#050811] text-[#F8FAFC] flex items-center justify-center p-0 sm:p-4">
      {/* Sleek Professional App Viewport Container (Edge-to-edge on mobile, centered card on desktop) */}
      <div className="relative w-full max-w-[440px] h-[100dvh] sm:h-[92vh] sm:max-h-[880px] bg-[#0B0F19] sm:border sm:border-[#1E293B] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};

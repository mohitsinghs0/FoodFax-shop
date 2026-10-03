import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 lg:static lg:min-h-screen bg-[#050811] text-[#F8FAFC] flex items-center justify-center p-0 overflow-hidden">
      {/* On mobile: edge-to-edge max-w-[440px] phone layout. On desktop: full-screen expansive layout */}
      <div className="relative w-full max-w-[440px] lg:max-w-none h-full lg:h-screen bg-[#0B0F19] overflow-hidden flex flex-col lg:flex-row">
        {children}
      </div>
    </div>
  );
};

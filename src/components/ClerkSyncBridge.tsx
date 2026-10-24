import React, { useEffect } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { isClerkConfigured } from '../lib/clerkClient';

export const ClerkSyncBridge: React.FC = () => {
  if (!isClerkConfigured) {
    return null;
  }

  return <ClerkSyncInner />;
};

const ClerkSyncInner: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { isAuthenticated, loginWithClerk, logout } = useOwnerApp();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user && !isAuthenticated) {
      loginWithClerk({
        id: user.id,
        fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Restaurant Partner',
        primaryEmailAddress: user.primaryEmailAddress ? { emailAddress: user.primaryEmailAddress.emailAddress } : null,
        primaryPhoneNumber: user.primaryPhoneNumber ? { phoneNumber: user.primaryPhoneNumber.phoneNumber } : null,
        imageUrl: user.imageUrl,
      });
    }
  }, [isLoaded, isSignedIn, user, isAuthenticated]);

  return null;
};


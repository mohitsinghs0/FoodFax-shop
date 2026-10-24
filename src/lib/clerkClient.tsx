/**
 * Clerk Authentication Integration for FoodFax Shop Owner Dashboard
 * Adheres to Clerk React Guidelines (clerk.com/SKILL.md)
 */

import React, { ReactNode } from 'react';
import { ClerkProvider, UserButton, useUser } from '@clerk/react';

// Read Publishable Key safely across Vite client and Node environments
export const CLERK_PUBLISHABLE_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY) ||
  (typeof process !== 'undefined' ? process.env?.VITE_CLERK_PUBLISHABLE_KEY : '') ||
  '';

export const isClerkConfigured = Boolean(
  CLERK_PUBLISHABLE_KEY &&
  CLERK_PUBLISHABLE_KEY.trim().startsWith('pk_') &&
  !CLERK_PUBLISHABLE_KEY.includes('pk_test_...')
);

interface ClerkAuthProviderProps {
  children: ReactNode;
}

/**
 * Resilient ClerkAuthProvider:
 * If VITE_CLERK_PUBLISHABLE_KEY is configured with a valid key, wraps app in <ClerkProvider>.
 * If not yet configured, renders children gracefully so the app does not crash.
 */
export const ClerkAuthProvider: React.FC<ClerkAuthProviderProps> = ({ children }) => {
  if (!isClerkConfigured) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
};

/**
 * Renders Clerk's UserButton if Clerk is configured and user is signed in.
 */
export const ClerkUserAvatar: React.FC = () => {
  if (!isClerkConfigured) return null;
  return <ClerkUserAvatarInner />;
};

const ClerkUserAvatarInner: React.FC = () => {
  const { isSignedIn } = useUser();
  if (!isSignedIn) return null;
  return <UserButton />;
};

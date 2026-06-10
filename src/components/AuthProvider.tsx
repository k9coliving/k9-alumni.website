'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import PasswordGate from './PasswordGate';

interface AuthProviderProps {
  children: React.ReactNode;
  initialAuth: boolean;
}

// Routes reachable without the shared site password. The newsletter submission
// form and per-token newsletter/edit pages are protected by their own tokens
// (or are deliberately open, in the case of /newsletter/submit), so they must
// not sit behind the alumni password gate. The /newsletter teaser stays gated.
function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/newsletter/submit' ||
    pathname.startsWith('/newsletter/edit/') ||
    pathname.startsWith('/newsletter/n/')
  );
}

export default function AuthProvider({ children, initialAuth }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);
  const pathname = usePathname();

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated && !isPublicPath(pathname)) {
    return <PasswordGate onAuthenticated={handleAuthenticated} />;
  }

  return <>{children}</>;
}

'use client';

import { useState } from 'react';
import PasswordGate from './PasswordGate';

interface AuthProviderProps {
  children: React.ReactNode;
  initialAuth: boolean;
}

export default function AuthProvider({ children, initialAuth }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={handleAuthenticated} />;
  }

  return <>{children}</>;
}
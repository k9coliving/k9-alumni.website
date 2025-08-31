'use client';

import { useState, useEffect, useRef } from 'react';

interface PasswordGateProps {
  onAuthenticated: () => void;
}

export default function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [requireEmail, setRequireEmail] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (retryAfter > 0) {
      setRetryAfter(0);
      setError('');
    }
  }, [countdown, retryAfter]);

  // Check rate limit status and auto-focus on mount
  useEffect(() => {
    const checkRateLimit = async () => {
      try {
        const response = await fetch('/api/auth/status');
        if (response.ok) {
          const data = await response.json();
          if (data.isRateLimited) {
            setRetryAfter(data.retryAfter);
            setCountdown(data.retryAfter);
            setError(`Please wait ${data.retryAfter} seconds before trying again`);
            return; // Don't focus if rate limited
          }
          
          // Set email requirement based on failed attempts
          setRequireEmail(data.requireEmail);
        }
      } catch (err) {
        console.error('Failed to check rate limit status:', err);
      }
      
      // Only focus if not rate limited
      inputRef.current?.focus();
    };

    checkRateLimit();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, email: requireEmail ? email : undefined }),
      });

      if (response.ok) {
        onAuthenticated();
      } else if (response.status === 429) {
        const errorData = await response.json();
        setRetryAfter(errorData.retryAfter || 0);
        setCountdown(errorData.retryAfter || 0);
        setError(errorData.message || 'Too many failed attempts. Please wait.');
        setPassword(''); // Clear password on rate limit
      } else if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.requireEmail) {
          setRequireEmail(true);
        }
        setError(errorData.message || 'Please provide required information.');
        setPassword(''); // Clear password on error
      } else {
        // Check if email is now required (after failed attempt)
        const errorData = await response.json().catch(() => ({}));
        if (errorData.requireEmail) {
          setRequireEmail(true);
        }
        setError('Incorrect password. Please try again.');
        setPassword(''); // Clear password on incorrect password
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setPassword(''); // Clear password on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            K9 Alumni Website
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the shared password to access the alumni community
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              ref={inputRef}
              id="password"
              name="password"
              type="password"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || countdown > 0}
            />
          </div>

          {requireEmail && (
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mt-2"
                placeholder="Your email address (for identification)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || countdown > 0}
              />
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
              {countdown > 0 && (
                <div className="mt-1 text-xs">
                  Retry in {countdown} seconds
                </div>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || countdown > 0}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Checking...' : countdown > 0 ? `Wait ${countdown}s` : 'Enter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
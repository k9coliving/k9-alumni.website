'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';

type Phase = 'loading' | 'confirm' | 'done' | 'already' | 'error';

function UnsubscribeInner() {
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [phase, setPhase] = useState<Phase>('loading');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('This unsubscribe link is missing its code.');
      setPhase('error');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`);
        if (cancelled) return;
        if (!res.ok) {
          setError("We couldn't find this subscription — the link may be out of date.");
          setPhase('error');
          return;
        }
        const data = await res.json();
        setEmail(data.email || '');
        setPhase(data.status === 'unsubscribed' ? 'already' : 'confirm');
      } catch {
        if (!cancelled) {
          setError('Something went wrong. Please try again in a moment.');
          setPhase('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const confirm = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong.');
      }
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {phase === 'loading' && <p className="text-gray-500">One moment…</p>}

        {phase === 'confirm' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Leaving the pack?</h1>
            <p className="text-gray-600">
              We&apos;ll stop sending the K9 newsletter to{' '}
              <span className="font-medium text-gray-900">{email}</span>. You can always come back later.
            </p>
            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
            <button
              onClick={confirm}
              disabled={busy}
              className="btn-primary px-6 py-2.5 mt-6 disabled:opacity-50"
            >
              {busy ? 'Unsubscribing…' : 'Unsubscribe me'}
            </button>
          </>
        )}

        {phase === 'done' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">You&apos;re unsubscribed</h1>
            <p className="text-gray-600">
              {email && <span className="font-medium text-gray-900">{email}</span>} won&apos;t receive the
              newsletter anymore. Thanks for being part of K9 — the door&apos;s always open if you change your mind.
            </p>
          </>
        )}

        {phase === 'already' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Already unsubscribed</h1>
            <p className="text-gray-600">
              {email && <span className="font-medium text-gray-900">{email}</span>} isn&apos;t on the newsletter
              list. Nothing more to do here.
            </p>
          </>
        )}

        {phase === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Hmm.</h1>
            <p className="text-gray-600">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Layout>
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <UnsubscribeInner />
      </Suspense>
    </Layout>
  );
}

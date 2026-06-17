'use client';

import { useState } from 'react';

// Shown on the submit/edit success screens when the entered email had previously
// unsubscribed: we never silently revive an unsubscribe, so we ask first. Backed
// by the public POST /api/newsletter/resubscribe.
export default function ResubscribePrompt({ email }: { email: string }) {
  const [phase, setPhase] = useState<'ask' | 'busy' | 'done'>('ask');
  const [error, setError] = useState<string | null>(null);

  const resubscribe = async () => {
    setPhase('busy');
    setError(null);
    try {
      const res = await fetch('/api/newsletter/resubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong.');
      }
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setPhase('ask');
    }
  };

  if (phase === 'done') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        You&apos;re back on the newsletter list — welcome back! 🎉
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800 space-y-2">
      <p>
        Heads up — <span className="font-medium">{email}</span> had unsubscribed from the newsletter
        before, so we didn&apos;t add it back automatically. Want to resubscribe?
      </p>
      {error && <p className="text-red-600">{error}</p>}
      <button
        type="button"
        onClick={resubscribe}
        disabled={phase === 'busy'}
        className="btn-primary px-4 py-1.5 text-sm cursor-pointer disabled:opacity-50"
      >
        {phase === 'busy' ? 'Resubscribing…' : 'Resubscribe me'}
      </button>
    </div>
  );
}

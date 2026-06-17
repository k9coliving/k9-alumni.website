'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SubscriberRecord } from '@/lib/subscribers';

type Filter = 'all' | 'subscribed' | 'unsubscribed';

function StatusPill({ status }: { status: SubscriberRecord['status'] }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
        status === 'subscribed' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
      }`}
    >
      {status}
    </span>
  );
}

function SubscriberRow({ sub, onChanged }: { sub: SubscriberRecord; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubscribed = sub.status === 'subscribed';
  const action = isSubscribed ? 'unsubscribe' : 'resubscribe';

  const apply = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sub.email, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update.');
      }
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update.');
      setBusy(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">{sub.email}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {sub.name || <span className="text-gray-400">no name</span>}
            {sub.source && <span className="text-gray-400"> · {sub.source}</span>}
          </p>
          <div className="mt-2">
            <StatusPill status={sub.status} />
            {sub.unsubscribed_at && isSubscribed === false && (
              <span className="text-xs text-gray-400 ml-2">
                left {new Date(sub.unsubscribed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm">
          <button
            onClick={apply}
            disabled={busy}
            className={`disabled:opacity-50 ${
              isSubscribed ? 'text-red-500 hover:text-red-700' : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            {busy ? 'Saving…' : isSubscribed ? 'Unsubscribe' : 'Resubscribe'}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}

export default function SubscribersClient({ subscribers }: { subscribers: SubscriberRecord[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(
    () => ({
      all: subscribers.length,
      subscribed: subscribers.filter((s) => s.status === 'subscribed').length,
      unsubscribed: subscribers.filter((s) => s.status === 'unsubscribed').length,
    }),
    [subscribers]
  );

  const visible = useMemo(
    () => (filter === 'all' ? subscribers : subscribers.filter((s) => s.status === filter)),
    [subscribers, filter]
  );

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'subscribed', label: `Subscribed (${counts.subscribed})` },
    { key: 'unsubscribed', label: `Unsubscribed (${counts.unsubscribed})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Newsletter subscribers</h1>
          <a href="/admin/newsletter" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to newsletter admin
          </a>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-wrap gap-2 mb-5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  filter === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No subscribers here.</p>
          ) : (
            <div className="space-y-3">
              {visible.map((sub) => (
                <SubscriberRow key={sub.email} sub={sub} onChanged={() => router.refresh()} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

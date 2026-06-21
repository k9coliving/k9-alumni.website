'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SubscriberRecord } from '@/lib/subscribers';

type Filter = 'all' | 'subscribed' | 'unsubscribed';

// Human-readable labels for the raw source tags stored on each subscriber.
const SOURCE_LABELS: Record<string, string> = {
  resident: 'The K9 Family',
  submission: 'Newsletter form',
  manual: 'Added by admin',
  import: 'Imported',
};

interface PersonGroup {
  key: string;
  name: string | null;
  members: SubscriberRecord[];
}

// Group subscribers sharing the same name (case-insensitive, trimmed) so an
// admin can spot one person who's on the list under several emails. Rows with
// no name can't be attributed to a person, so each stays on its own.
function groupByName(subs: SubscriberRecord[]): PersonGroup[] {
  const groups: PersonGroup[] = [];
  const byName = new Map<string, PersonGroup>();

  for (const s of subs) {
    const trimmed = (s.name ?? '').trim();
    if (!trimmed) {
      groups.push({ key: `email:${s.email}`, name: null, members: [s] });
      continue;
    }
    const key = `name:${trimmed.toLowerCase()}`;
    let group = byName.get(key);
    if (!group) {
      group = { key, name: trimmed, members: [] };
      byName.set(key, group);
      groups.push(group);
    }
    group.members.push(s);
  }

  return groups;
}

// Manual subscribe. Two confirm gates: (1) the name already exists on the list
// (client-side — likely a duplicate person), and (2) the email previously
// unsubscribed (backend 'needs_resubscribe_confirm' — admin must reconfirm
// before reviving an unsubscribe).
function AddSubscriber({
  existingNames,
  onAdded,
}: {
  existingNames: Set<string>;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | 'name' | 'resub'>(null);

  const post = async (confirmResubscribe: boolean) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), confirmResubscribe }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add subscriber.');

      if (data.result === 'needs_resubscribe_confirm') {
        setConfirm('resub');
        return;
      }
      if (data.result === 'already_subscribed') {
        setInfo('That email is already subscribed.');
        setConfirm(null);
        return;
      }
      // 'created' or 'resubscribed'
      setName('');
      setEmail('');
      setConfirm(null);
      setInfo(data.result === 'resubscribed' ? 'Resubscribed.' : 'Subscribed.');
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subscriber.');
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const trimmedName = name.trim();
    if (!email.trim()) {
      setError('Enter an email.');
      return;
    }
    // Gate 1: warn when this name is already on the list.
    if (trimmedName && existingNames.has(trimmedName.toLowerCase())) {
      setConfirm('name');
      return;
    }
    post(false);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Add a subscriber</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setConfirm(null);
          }}
          className="form-input sm:flex-1"
          placeholder="Name (optional)"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setConfirm(null);
          }}
          className="form-input sm:flex-1"
          placeholder="Email"
        />
        <button type="submit" disabled={busy} className="btn-primary px-5 py-2 cursor-pointer disabled:cursor-default disabled:opacity-50">
          {busy ? 'Adding…' : 'Subscribe'}
        </button>
      </div>

      {confirm === 'name' && (
        <div className="text-sm bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-amber-800">
          A subscriber named <span className="font-medium">{name.trim()}</span> is already on the list. Add{' '}
          <span className="font-medium">{email.trim()}</span> as another email for them?
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => post(false)}
              disabled={busy}
              className="text-amber-900 font-medium hover:underline cursor-pointer disabled:opacity-50"
            >
              {busy ? 'Adding…' : 'Add anyway'}
            </button>
            <button
              type="button"
              onClick={() => setConfirm(null)}
              disabled={busy}
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirm === 'resub' && (
        <div className="text-sm bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-amber-800">
          <span className="font-medium">{email.trim()}</span> previously unsubscribed. Resubscribe them?
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => post(true)}
              disabled={busy}
              className="text-amber-900 font-medium hover:underline cursor-pointer disabled:opacity-50"
            >
              {busy ? 'Resubscribing…' : 'Resubscribe'}
            </button>
            <button
              type="button"
              onClick={() => setConfirm(null)}
              disabled={busy}
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-600">{info}</p>}
    </form>
  );
}

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

// One email's status + action. The person's name lives on the group header now,
// so the email is the primary line here.
function EmailRow({ sub, onChanged }: { sub: SubscriberRecord; onChanged: () => void }) {
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
    } finally {
      // The row stays mounted (status just flips), so clear busy on success too —
      // otherwise the button is stuck on "Saving…".
      setBusy(false);
    }
  };

  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-gray-900 truncate">{sub.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusPill status={sub.status} />
            {sub.source && (
              <span className="text-xs text-gray-400">Source: {SOURCE_LABELS[sub.source] ?? sub.source}</span>
            )}
            {sub.unsubscribed_at && !isSubscribed && (
              <span className="text-xs text-gray-400">
                left {new Date(sub.unsubscribed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm">
          <button
            onClick={apply}
            disabled={busy}
            className={`cursor-pointer disabled:cursor-default disabled:opacity-50 ${
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

function PersonCard({ group, onChanged }: { group: PersonGroup; onChanged: () => void }) {
  const subscribedCount = group.members.filter((m) => m.status === 'subscribed').length;
  // Warn only when the same person has more than one *subscribed* email — a
  // likely duplicate that would get the newsletter twice.
  const duplicate = subscribedCount > 1;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {group.name && (
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="font-medium text-gray-900">{group.name}</p>
          {duplicate && (
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              ⚠ {subscribedCount} subscribed emails
            </span>
          )}
        </div>
      )}
      {duplicate && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
          {group.name || 'This person'} has {subscribedCount} subscribed emails — looks like a duplicate.
          You may want to unsubscribe the extra one.
        </p>
      )}
      <div className={group.members.length > 1 ? 'divide-y divide-gray-100' : ''}>
        {group.members.map((m) => (
          <EmailRow key={m.email} sub={m} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}

export default function SubscribersClient({ subscribers }: { subscribers: SubscriberRecord[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(
    () => ({
      all: subscribers.length,
      subscribed: subscribers.filter((s) => s.status === 'subscribed').length,
      unsubscribed: subscribers.filter((s) => s.status === 'unsubscribed').length,
    }),
    [subscribers]
  );

  // Status tab + free-text search combine. The search matches name OR email
  // (case-insensitive, trimmed); filtering happens per email row before grouping,
  // so an email-only match still surfaces that person's card.
  const visible = useMemo(() => {
    const byStatus = filter === 'all' ? subscribers : subscribers.filter((s) => s.status === filter);
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (s) => (s.name ?? '').toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [subscribers, filter, query]);

  const groups = useMemo(() => groupByName(visible), [visible]);

  // All names already on the list (any status), lowercased — drives the
  // duplicate-name warning when manually adding a subscriber.
  const existingNames = useMemo(() => {
    const set = new Set<string>();
    for (const s of subscribers) {
      const n = (s.name ?? '').trim().toLowerCase();
      if (n) set.add(n);
    }
    return set;
  }, [subscribers]);

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

        <AddSubscriber existingNames={existingNames} onAdded={() => router.refresh()} />

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-wrap gap-2 mb-4">
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

          <div className="relative mb-5">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-input w-full"
              placeholder="Search by name or email…"
              aria-label="Search subscribers by name or email"
            />
            {query.trim() && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {groups.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">
              {query.trim() ? `No subscribers match “${query.trim()}”.` : 'No subscribers here.'}
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => (
                <PersonCard key={g.key} group={g} onChanged={() => router.refresh()} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

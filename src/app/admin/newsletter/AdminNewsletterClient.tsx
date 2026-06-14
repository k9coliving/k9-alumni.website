'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MultiImageDrop from '@/components/MultiImageDrop';
import type { NewsletterRecord, NewsletterSubmissionRecord } from '@/lib/newsletter';

interface Quota {
  sentLast24h: number;
  limit: number;
}

interface Props {
  submissions: NewsletterSubmissionRecord[];
  newsletters: NewsletterRecord[];
  quota: Quota;
}

function QuotaWidget({ quota }: { quota: Quota }) {
  const remaining = Math.max(0, quota.limit - quota.sentLast24h);
  const pct = quota.limit > 0 ? Math.min(100, Math.round((quota.sentLast24h / quota.limit) * 100)) : 0;
  const bar = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Email quota (rolling 24h)</span>
        <span className="text-gray-500">
          {quota.sentLast24h} sent · {remaining} left of {quota.limit}
        </span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// One active draft at a time: when a draft already exists we edit it (PATCH)
// rather than offering to create another. Multiple drafts would be confusing —
// every draft's preview renders the same unassigned-submissions pool, and
// sending any one scoops all of them. A new draft becomes available again only
// once the current one is sent.
function DraftEditor({ draft }: { draft: NewsletterRecord | null }) {
  const router = useRouter();
  const isEdit = !!draft;

  const [title, setTitle] = useState(draft?.title ?? '');
  const [intro, setIntro] = useState(draft?.intro_text ?? '');
  const [outro, setOutro] = useState(draft?.outro_text ?? '');
  const [headerImageUrl, setHeaderImageUrl] = useState(draft?.header_image_url ?? '');
  // Only send header_image_url when the admin actually changes it, so issues
  // that don't use a custom header never write the (optional) DB column.
  const [headerTouched, setHeaderTouched] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Same drag-and-drop component the public submission form uses. It can hand up
  // several files; we only keep the first since the header is a single image.
  const addHeaderImage = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }
    setUploadingHeader(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/images/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      setHeaderImageUrl(data.url);
      setHeaderTouched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploadingHeader(false);
    }
  };

  const removeHeader = () => {
    setHeaderImageUrl('');
    setHeaderTouched(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!title.trim()) {
      setError('A title is required.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/newsletter/${draft.id}` : '/api/admin/newsletter', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          intro_text: intro,
          outro_text: outro,
          ...(headerTouched ? { header_image_url: headerImageUrl || null } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save.');
      }
      if (isEdit) {
        setSaved(true);
        setHeaderTouched(false);
      } else {
        setTitle('');
        setIntro('');
        setOutro('');
        setHeaderImageUrl('');
        setHeaderTouched(false);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEdit ? 'Current draft' : 'Create next newsletter'}
        </h2>
        {isEdit && (
          <a
            href={`/newsletter/n/${draft.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Preview →
          </a>
        )}
      </div>
      {isEdit && (
        <p className="text-sm text-gray-500">
          A draft already exists, so you&apos;re editing it. Send it to start a fresh one.
        </p>
      )}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="form-input"
        placeholder="Title (e.g. K9 Newsletter — Summer 2026)"
      />
      <textarea
        value={intro}
        onChange={(e) => setIntro(e.target.value)}
        rows={2}
        className="form-input"
        placeholder="Intro text (optional)"
      />
      <textarea
        value={outro}
        onChange={(e) => setOutro(e.target.value)}
        rows={2}
        className="form-input"
        placeholder="Outro text (optional)"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Header image (optional)</label>
        {headerImageUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={headerImageUrl} alt="Header preview" className="h-16 w-28 object-cover rounded-md border border-gray-200" />
            <button type="button" onClick={removeHeader} className="text-sm text-red-500 hover:text-red-700">
              Remove
            </button>
          </div>
        ) : (
          <MultiImageDrop onAdd={addHeaderImage} remaining={1} />
        )}
        {uploadingHeader && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
        <p className="text-xs text-gray-400 mt-1">Overrides the default masthead photo for this issue.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="btn-primary px-5 py-2 disabled:opacity-50">
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Save draft'}
        </button>
      </div>
    </form>
  );
}

function SubmissionRow({ s, onDeleted }: { s: NewsletterSubmissionRecord; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editToken = s.edit_token?.token;
  const editUrl = editToken ? `/newsletter/edit/${s.id}?token=${encodeURIComponent(editToken)}` : null;

  const del = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${s.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete.');
      }
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.');
      setBusy(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">
            {s.name} <span className="font-normal text-gray-400">· {s.period_in_k9}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1 line-clamp-3 whitespace-pre-line">{s.whats_up}</p>
          <p className="text-xs text-gray-400 mt-2">
            {s.email || 'no email'}
            {s.photo_urls && s.photo_urls.length > 0 ? ` · ${s.photo_urls.length} photo(s)` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm">
          {editUrl && (
            <a href={editUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
              Edit
            </a>
          )}
          {confirming ? (
            <span className="flex items-center gap-2">
              <button onClick={del} disabled={busy} className="text-red-600 hover:text-red-700 disabled:opacity-50">
                {busy ? 'Deleting…' : 'Confirm'}
              </button>
              <button onClick={() => setConfirming(false)} disabled={busy} className="text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </span>
          ) : (
            <button onClick={() => setConfirming(true)} className="text-red-500 hover:text-red-700">
              Delete
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}

function Submissions({ submissions }: { submissions: NewsletterSubmissionRecord[] }) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Unassigned submissions <span className="text-gray-400 font-normal">({submissions.length})</span>
      </h2>
      <p className="text-sm text-gray-500 mb-4">These go into the next newsletter when you send it.</p>
      {submissions.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">No submissions waiting.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <SubmissionRow key={s.id} s={s} onDeleted={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  );
}

function PastNewsletters({ newsletters }: { newsletters: NewsletterRecord[] }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Newsletters</h2>
      {newsletters.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">No newsletters yet. Create a draft above.</p>
      ) : (
        <div className="space-y-3">
          {newsletters.map((n) => (
            <div key={n.id} className="flex items-center justify-between gap-4 border border-gray-200 rounded-lg p-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{n.title}</p>
                <p className="text-xs mt-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full ${
                      n.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {n.status}
                  </span>
                  {n.sent_at && <span className="text-gray-400 ml-2">sent {new Date(n.sent_at).toLocaleDateString()}</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-sm">
                <a
                  href={`/newsletter/n/${n.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  {n.status === 'draft' ? 'Preview' : 'View'}
                </a>
                <a href={`/admin/newsletter/${n.id}/send`} className="btn-primary px-3 py-1.5">
                  {n.status === 'draft' ? 'Send' : 'Re-send'}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminNewsletterClient({ submissions, newsletters, quota }: Props) {
  const router = useRouter();

  // At most one draft should be active. If several exist (legacy/test data),
  // edit the most recent — getAllNewsletters returns newest first.
  const activeDraft = newsletters.find((n) => n.status === 'draft') ?? null;

  const logout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Newsletter admin</h1>
          <div className="flex items-center gap-4">
            <a href="/admin/newsletter/reminder" className="text-sm text-blue-600 hover:text-blue-700">
              Send reminder
            </a>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
              Log out
            </button>
          </div>
        </div>

        <QuotaWidget quota={quota} />
        <DraftEditor key={activeDraft?.id ?? 'new'} draft={activeDraft} />
        <Submissions submissions={submissions} />
        <PastNewsletters newsletters={newsletters} />
      </div>
    </div>
  );
}

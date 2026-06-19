'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MultiImageDrop from '@/components/MultiImageDrop';
import DraftPreview from '@/components/newsletter/DraftPreview';
import { DEFAULT_INTRO_HEADING } from '@/components/newsletter/sections';
import type { NewsletterRecord, NewsletterSubmissionRecord } from '@/lib/newsletter';

interface Quota {
  sentLast24h: number;
  limit: number;
}

interface Props {
  submissions: NewsletterSubmissionRecord[];
  newsletters: NewsletterRecord[];
  quota: Quota;
  // Reply-to to seed a brand-new draft with (carried forward from the most recent
  // issue, or the env default). Editing a draft uses the draft's own saved value.
  defaultReplyTo: string;
  // ISO timestamp of the most recent reminder send, or null if none yet.
  lastReminderAt: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Whole-day "x days ago" phrasing, with friendlier forms for the recent cases.
function relativeDays(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function QuotaWidget({ quota, lastReminderAt }: { quota: Quota; lastReminderAt: string | null }) {
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
      <p className="mt-2 text-xs text-gray-400">
        {lastReminderAt
          ? `Last email reminder sent ${relativeDays(lastReminderAt)}`
          : 'No email reminder sent yet'}
      </p>
    </div>
  );
}

// One active draft at a time: when a draft already exists we edit it (PATCH)
// rather than offering to create another. Multiple drafts would be confusing —
// every draft's preview renders the same unassigned-submissions pool, and
// sending any one scoops all of them. A new draft becomes available again only
// once the current one is sent.
function DraftEditor({ draft, defaultReplyTo }: { draft: NewsletterRecord | null; defaultReplyTo: string }) {
  const router = useRouter();
  const isEdit = !!draft;

  const [title, setTitle] = useState(draft?.title ?? '');
  const [introHeading, setIntroHeading] = useState(draft?.intro_heading ?? '');
  const [intro, setIntro] = useState(draft?.intro_text ?? '');
  const [outro, setOutro] = useState(draft?.outro_text ?? '');
  const [headerImageUrl, setHeaderImageUrl] = useState(draft?.header_image_url ?? '');
  // Reply-to for every email this issue sends. Set once here, not per send.
  // Edit uses the draft's saved value; a new draft inherits the carried-forward default.
  const [replyTo, setReplyTo] = useState(draft ? (draft.data?.email_reply_to ?? '') : defaultReplyTo);
  // Only send header_image_url when the admin actually changes it, so issues
  // that don't use a custom header never write the (optional) DB column.
  const [headerTouched, setHeaderTouched] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // For an existing draft the form starts collapsed behind an "Edit draft"
  // button — the live preview below already conveys the content. A new draft
  // shows the form straight away (nothing to collapse).
  const [editing, setEditing] = useState(false);

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
    if (replyTo.trim() && !EMAIL_RE.test(replyTo.trim())) {
      setError('Reply-to must be a valid email.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/newsletter/${draft.id}` : '/api/admin/newsletter', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          intro_heading: introHeading,
          intro_text: intro,
          outro_text: outro,
          email_reply_to: replyTo.trim() || null,
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
        setIntroHeading('');
        setIntro('');
        setOutro('');
        setHeaderImageUrl('');
        setReplyTo(defaultReplyTo);
        setHeaderTouched(false);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setBusy(false);
    }
  };

  // Issue label mirrors the public view: the month/year the draft was created
  // (or now, for a not-yet-saved new draft).
  const issueLabel = new Date(draft?.created_at || Date.now()).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Unsaved-changes detection: compare each field to its pristine value. After a
  // successful save, router.refresh() feeds back the saved draft as new props
  // (same key → no remount), so pristine catches up and dirty clears.
  const dirty =
    title !== (draft?.title ?? '') ||
    introHeading !== (draft?.intro_heading ?? '') ||
    intro !== (draft?.intro_text ?? '') ||
    outro !== (draft?.outro_text ?? '') ||
    headerImageUrl !== (draft?.header_image_url ?? '') ||
    replyTo !== (draft ? (draft.data?.email_reply_to ?? '') : defaultReplyTo);

  const saveLabel = isEdit ? 'Save changes' : 'Save draft';

  return (
    <div className="space-y-6">
    {dirty && (
      <div className="sticky top-0 z-40 animate-fadeInUp">
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-md">
          <span aria-hidden className="text-lg leading-none">💡</span>
          <p className="flex-1 text-sm font-medium text-blue-900">You have unsaved changes.</p>
          <button
            type="submit"
            form="draft-editor-form"
            disabled={busy}
            className="btn-primary shrink-0 px-4 py-1.5 text-sm disabled:opacity-50"
          >
            {busy ? 'Saving…' : saveLabel}
          </button>
        </div>
      </div>
    )}
    {isEdit && !editing ? (
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Current draft</h2>
          <a
            href={`/newsletter/n/${draft.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Preview →
          </a>
        </div>
        <p className="text-sm text-gray-500">A draft already exists. Send it to start a fresh one.</p>
        <p className="text-base font-medium text-gray-900">{draft.title}</p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn-primary px-5 py-2"
          >
            Edit draft
          </button>
        </div>
      </div>
    ) : (
    <form id="draft-editor-form" onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
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
      <div>
        <input
          type="text"
          value={introHeading}
          onChange={(e) => setIntroHeading(e.target.value)}
          className="form-input"
          placeholder={`Intro heading (default: "${DEFAULT_INTRO_HEADING}")`}
        />
        <p className="text-xs text-gray-400 mt-1">The greeting above the intro. Blank uses the default.</p>
      </div>
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reply-to email</label>
        <input
          type="email"
          value={replyTo}
          onChange={(e) => setReplyTo(e.target.value)}
          className="form-input"
          placeholder="replies@k9coliving.com"
        />
        <p className="text-xs text-gray-400 mt-1">
          Where replies to this issue&apos;s emails (and its reminders) go. Set once — Send and Send reminder use it automatically.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="btn-primary px-5 py-2 disabled:opacity-50">
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Save draft'}
        </button>
      </div>
    </form>
    )}

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Live preview</h2>
          <span className="text-xs text-gray-400">Heading, intro &amp; footer — updates as you type</span>
        </div>
        <div className="rounded-lg overflow-hidden border border-gray-100">
          <DraftPreview
            title={title}
            introHeading={introHeading}
            introText={intro}
            outroText={outro}
            headerImageUrl={headerImageUrl}
            issueLabel={issueLabel}
          />
        </div>
      </div>
    </div>
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
            {s.photos && s.photos.length > 0 ? ` · ${s.photos.length} photo(s)` : ''}
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

export default function AdminNewsletterClient({ submissions, newsletters, quota, defaultReplyTo, lastReminderAt }: Props) {
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
            <a href="/admin/newsletter/subscribers" className="text-sm text-blue-600 hover:text-blue-700">
              Subscribers
            </a>
            <a href="/admin/newsletter/reminder" className="text-sm text-blue-600 hover:text-blue-700">
              Send reminder
            </a>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
              Log out
            </button>
          </div>
        </div>

        <QuotaWidget quota={quota} lastReminderAt={lastReminderAt} />
        <DraftEditor key={activeDraft?.id ?? 'new'} draft={activeDraft} defaultReplyTo={defaultReplyTo} />
        <Submissions submissions={submissions} />
        <PastNewsletters newsletters={newsletters} />
      </div>
    </div>
  );
}

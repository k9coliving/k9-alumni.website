'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SendLogEntry } from '@/lib/audit';
import { buildNewsletterEmailHtml } from '@/lib/newsletterEmail';

interface NewsletterLite {
  id: string;
  title: string;
  token: string;
  status: 'draft' | 'sent';
  intro_heading: string | null;
  intro_text: string | null;
  header_image_url: string | null;
}

interface Quota {
  sentLast24h: number;
  limit: number;
}

interface Props {
  newsletter: NewsletterLite;
  recipientCount: number;
  quota: Quota;
  // Configured per issue in the newsletter admin (read-only here).
  replyTo: string;
  log: SendLogEntry[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function QuotaStrip({ quota, recipientCount }: { quota: Quota; recipientCount: number }) {
  const { sentLast24h, limit } = quota;
  const combined = sentLast24h + recipientCount;
  const level = recipientCount > limit ? 'red' : combined > limit ? 'yellow' : 'green';

  const styles = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  }[level];

  const message =
    level === 'green'
      ? `✓ Within today's limit. ${sentLast24h} sent in the last 24h, ${recipientCount} to send now, limit ${limit}.`
      : level === 'yellow'
        ? `⚠ This would exceed your Resend daily limit. ${sentLast24h} sent in the last 24h, ${recipientCount} to send now, limit ${limit}. About ${combined - limit} may fail.`
        : `⚠ ${recipientCount} recipients exceeds the entire daily limit of ${limit}. Consider splitting the send.`;

  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{message}</div>;
}

export default function SendClient({ newsletter, recipientCount, quota, replyTo, log }: Props) {
  const router = useRouter();
  const isDraft = newsletter.status === 'draft';
  const [testEmail, setTestEmail] = useState('');
  const [busy, setBusy] = useState<null | 'all' | 'test' | 'failed'>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const replyToValid = EMAIL_RE.test(replyTo.trim());
  const testEmailValid = EMAIL_RE.test(testEmail.trim());

  const testMissing = [
    !replyToValid && 'reply-to (set it in the newsletter admin)',
    !testEmailValid && 'recipient email',
  ].filter(Boolean) as string[];

  // The real announcement email, with placeholder links.
  const previewHtml = useMemo(
    () =>
      buildNewsletterEmailHtml({
        title: newsletter.title,
        introHeading: newsletter.intro_heading,
        introText: newsletter.intro_text,
        headerImageUrl: newsletter.header_image_url,
        readUrl: '#',
        unsubscribeUrl: '#',
      }),
    [newsletter]
  );

  const failedCount = useMemo(() => {
    const latest = new Map<string, 'sent' | 'failed'>();
    for (const e of log) {
      const k = e.recipient_email.toLowerCase();
      if (!latest.has(k)) latest.set(k, e.status);
    }
    return [...latest.values()].filter((s) => s === 'failed').length;
  }, [log]);

  const post = async (mode: 'all' | 'failed' | 'test') => {
    setError(null);
    setInfo(null);
    if (!replyToValid) {
      setError('Set a reply-to email in the newsletter admin first.');
      return;
    }
    if (mode === 'test' && !testEmailValid) {
      setError('Enter a valid test email.');
      return;
    }
    if (mode === 'all') {
      const msg = isDraft
        ? `Send this newsletter to ${recipientCount} people?\n\nThis finalizes the issue: all unassigned submissions are added to it and it's marked sent.`
        : `Re-send this newsletter to ${recipientCount} people?`;
      if (!window.confirm(msg)) return;
    }
    if (mode === 'failed' && !window.confirm(`Retry the ${failedCount} failed send(s)?`)) {
      return;
    }

    setBusy(mode);
    try {
      const res = await fetch(`/api/admin/newsletter/${newsletter.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, testEmail: testEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send.');

      if (mode === 'test') {
        setInfo(`Test sent to ${testEmail.trim()}.`);
      } else {
        setInfo(`Done — ${data.sent} sent${data.failed ? `, ${data.failed} failed` : ''}.`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{isDraft ? 'Send newsletter' : 'Re-send newsletter'}</h1>
          <a href="/admin/newsletter" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to newsletter admin
          </a>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-5">
          <div>
            <p className="font-medium text-gray-900">{newsletter.title}</p>
            <a
              href={`/newsletter/n/${newsletter.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Open the {isDraft ? 'preview' : 'newsletter'} →
            </a>
          </div>

          <p className="text-gray-600 text-sm">
            Goes to active subscribers plus this issue&apos;s contributors.{' '}
            <a href="/admin/newsletter/subscribers" className="font-medium text-blue-600 hover:text-blue-700">
              {recipientCount} people will get it
            </a>
            .
          </p>

          {replyToValid ? (
            <p className="text-sm text-gray-600">
              Replies go to <span className="font-medium text-gray-900">{replyTo}</span>.{' '}
              <a href="/admin/newsletter" className="text-blue-600 hover:text-blue-700">
                Change in newsletter admin
              </a>
            </p>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No reply-to is set.{' '}
              <a href="/admin/newsletter" className="font-medium underline">
                Set one in the newsletter admin
              </a>{' '}
              before sending.
            </div>
          )}

          {isDraft && (
            <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Sending finalizes the issue — all unassigned submissions are added to it and it&apos;s marked sent.
            </p>
          )}

          <QuotaStrip quota={quota} recipientCount={recipientCount} />

          <div className="flex justify-end">
            <button
              onClick={() => post('all')}
              disabled={busy !== null || !replyToValid || recipientCount === 0}
              className="btn-primary px-6 py-2 cursor-pointer disabled:cursor-default disabled:opacity-50"
            >
              {busy === 'all'
                ? 'Sending…'
                : `${isDraft ? 'Send' : 'Re-send'} to ${recipientCount}`}
            </button>
          </div>

          {/* Test send */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Send a test to one address first
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="form-input sm:flex-1"
                placeholder="you@example.com"
              />
              <button
                onClick={() => post('test')}
                disabled={busy !== null || testMissing.length > 0}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer disabled:cursor-default disabled:opacity-50"
              >
                {busy === 'test' ? 'Sending…' : 'Send test'}
              </button>
            </div>
            {busy === null && testMissing.length > 0 ? (
              <p className="text-xs text-amber-600 mt-1">Missing {testMissing.join(' and ')}.</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Doesn&apos;t finalize the issue or count toward the audit log.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}
        </div>

        {/* Email preview */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Preview</h2>
          <p className="text-sm text-gray-500 mb-4">
            Roughly how the email will look. Links are inactive here; the real send links to the newsletter.
          </p>
          <div
            className="rounded-lg border border-gray-200 overflow-hidden"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>

        {/* Send log */}
        {log.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">This issue&apos;s sends</h2>
              {failedCount > 0 && (
                <button
                  onClick={() => post('failed')}
                  disabled={busy !== null || !replyToValid}
                  className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer disabled:opacity-50"
                >
                  {busy === 'failed' ? 'Retrying…' : `Retry ${failedCount} failed`}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {log.map((e, i) => (
                <div
                  key={`${e.recipient_email}-${i}`}
                  className="flex items-center justify-between gap-4 text-sm border-b border-gray-100 pb-2 last:border-0"
                >
                  <span className="min-w-0 truncate text-gray-700">
                    {e.recipient_name ? (
                      <>
                        {e.recipient_name} <span className="text-gray-400">· {e.recipient_email}</span>
                      </>
                    ) : (
                      e.recipient_email
                    )}
                  </span>
                  <span className="shrink-0 flex items-center gap-2">
                    {e.status === 'failed' && e.error_message && (
                      <span className="text-xs text-gray-400 max-w-[200px] truncate">{e.error_message}</span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        e.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {e.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SendLogEntry, ReminderTextEntry } from '@/lib/audit';
import {
  buildReminderEmailHtml,
  pickReminderImage,
  DEFAULT_REMINDER_SUBJECT,
  DEFAULT_REMINDER_BODY,
} from '@/lib/newsletterEmail';

interface Quota {
  sentLast24h: number;
  limit: number;
}

interface Props {
  recipientCount: number;
  skippedAlreadyPosted: number;
  quota: Quota;
  // Configured per issue in the newsletter admin (not editable here).
  replyTo: string;
  log: SendLogEntry[];
  history: ReminderTextEntry[];
  slackConfigured: boolean;
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

export default function ReminderClient({
  recipientCount,
  skippedAlreadyPosted,
  quota,
  replyTo,
  log,
  history,
  slackConfigured,
}: Props) {
  const router = useRouter();
  const [testEmail, setTestEmail] = useState('');
  const [subject, setSubject] = useState(DEFAULT_REMINDER_SUBJECT);
  const [message, setMessage] = useState(DEFAULT_REMINDER_BODY);
  const [busy, setBusy] = useState<null | 'all' | 'test' | 'failed' | 'slack'>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Timestamps in the history list use the viewer's locale + timezone, which the
  // server can't know — formatting at SSR time causes a hydration mismatch. Gate
  // formatting behind a post-mount flag so server and first client render agree
  // (both blank), then fill in the local time on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // One sample image for the preview (same-origin relative path), picked once so
  // it doesn't reshuffle on every keystroke. The actual send picks its own.
  const previewImage = useMemo(() => `/${pickReminderImage()}`, []);

  // Live preview of the actual email HTML — the exact builder the send route
  // uses, with placeholder links. Blank fields fall back to the defaults.
  const previewHtml = useMemo(
    () =>
      buildReminderEmailHtml({
        heading: subject,
        bodyText: message,
        submitUrl: '#',
        unsubscribeUrl: '#',
        imageUrl: previewImage,
      }),
    [subject, message, previewImage]
  );

  const replyToValid = EMAIL_RE.test(replyTo.trim());
  const testEmailValid = EMAIL_RE.test(testEmail.trim());

  // Slack broadcast pings only fire from @channel/@here/@everyone (the slack
  // route rewrites these to <!channel> etc). A reminder usually wants one, so
  // warn when the body has none — but it's only a nudge, not a block.
  const hasSlackMention = /@(channel|here|everyone)\b/.test(message);

  // Why the test button is disabled, if it is (busy aside).
  const testMissing = [
    !replyToValid && 'reply-to (set it in the newsletter admin)',
    !testEmailValid && 'recipient email',
  ].filter(Boolean) as string[];

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
    if (mode === 'test' && !EMAIL_RE.test(testEmail.trim())) {
      setError('Enter a valid test email.');
      return;
    }
    if (mode === 'all' && !window.confirm(`Send the reminder to ${recipientCount} subscriber(s)?`)) {
      return;
    }
    if (mode === 'failed' && !window.confirm(`Retry the ${failedCount} failed reminder(s)?`)) {
      return;
    }

    setBusy(mode);
    try {
      const res = await fetch('/api/admin/newsletter/reminder/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          testEmail: testEmail.trim(),
          subject: subject.trim(),
          body: message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send.');

      if (mode === 'test') {
        setInfo(`Test reminder sent to ${testEmail.trim()}.`);
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

  // Post the same subject/message to the K9 Slack channel. Independent of the
  // email send and unaffected by reply-to (Slack doesn't need one).
  const postSlack = async () => {
    setError(null);
    setInfo(null);
    const confirmMsg = hasSlackMention
      ? 'Post this reminder to the K9 Slack channel?'
      : "This message has no @channel mention, so it won't ping the channel. Post anyway?";
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setBusy('slack');
    try {
      const res = await fetch('/api/admin/newsletter/reminder/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), body: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to post to Slack.');
      setInfo('Posted to the K9 Slack channel.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post to Slack.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Send a reminder</h1>
          <a href="/admin/newsletter" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to newsletter admin
          </a>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-5">
          <p className="text-gray-600 text-sm">
            Nudges active subscribers to add their news for the next issue.{' '}
            <a href="/admin/newsletter/subscribers" className="font-medium text-blue-600 hover:text-blue-700">
              {recipientCount} people will get it
              {skippedAlreadyPosted > 0 && <> · {skippedAlreadyPosted} skipped (already posted)</>}
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

          {/* Email content */}
          <div className="border-t border-gray-200 pt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject &amp; heading
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="form-input w-full"
                placeholder={DEFAULT_REMINDER_SUBJECT}
              />
              <p className="text-xs text-gray-400 mt-1">
                Shown in the inbox and as the big heading inside the email.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="form-input w-full"
                placeholder={DEFAULT_REMINDER_BODY}
              />
              <p className="text-xs text-gray-400 mt-1">
                Plain text. Leave a blank line between paragraphs. The “Add my news” button
                and footer are added automatically.
              </p>
            </div>
          </div>

          <QuotaStrip quota={quota} recipientCount={recipientCount} />

          <div className="flex justify-end">
            <button
              onClick={() => post('all')}
              disabled={busy !== null || !replyToValid || recipientCount === 0}
              className="btn-primary px-6 py-2 cursor-pointer disabled:cursor-default disabled:opacity-50"
            >
              {busy === 'all' ? 'Sending…' : `Send reminder to ${recipientCount}`}
            </button>
          </div>

          {/* Post to Slack — same copy, posted to the K9 channel */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm text-gray-600">
                Also post this reminder to the K9 Slack channel.
                {!slackConfigured && (
                  <span className="block text-xs text-amber-600 mt-0.5">
                    Set SLACK_WEBHOOK_URL to enable.
                  </span>
                )}
              </p>
              <button
                onClick={postSlack}
                disabled={busy !== null || !slackConfigured}
                className="shrink-0 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer disabled:cursor-default disabled:opacity-50"
              >
                {busy === 'slack' ? 'Posting…' : 'Post to Slack'}
              </button>
            </div>
            {slackConfigured && !hasSlackMention && (
              <p className="text-xs text-amber-600">
                ⚠ No <span className="font-mono">@channel</span>{' '}in the message
              </p>
            )}
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
                Doesn&apos;t finalize anything or count toward the audit log.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}
        </div>

        {/* Email preview — renders the real email HTML as you type */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Preview</h2>
          <p className="text-sm text-gray-500 mb-4">
            Roughly how the email will look. A random illustration is added to each send. Links are inactive here.
          </p>
          <div
            className="rounded-lg border border-gray-200 overflow-hidden"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>

        {/* Recent send log */}
        {log.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent reminders <span className="text-gray-400 font-normal">(last 24h)</span>
              </h2>
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

        {/* Previous reminder texts — browse and reuse past wording */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous reminders</h2>
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={`${h.timestamp}-${i}`} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{h.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {mounted ? `${new Date(h.timestamp).toLocaleString()} · ` : ''}{h.sent} sent
                        {h.failed > 0 && `, ${h.failed} failed`}
                        {h.mode === 'failed' && ' · retry'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSubject(h.subject);
                        setMessage(h.body);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="shrink-0 text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Reuse
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-line line-clamp-3">{h.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

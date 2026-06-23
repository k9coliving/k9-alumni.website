import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import { getActiveSubscribers } from '@/lib/subscribers';
import { getUnassignedSubmissions, getEffectiveReplyTo } from '@/lib/newsletter';
import { logAuditEvent, getReminderSendLog } from '@/lib/audit';
import { resendClient, NEWSLETTER_FROM, baseUrl } from '@/lib/resend';
import {
  buildReminderEmailHtml,
  pickReminderImage,
  DEFAULT_REMINDER_SUBJECT,
  DEFAULT_REMINDER_BODY,
} from '@/lib/newsletterEmail';
import { logger } from '@/lib/logger';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function unsubscribeUrlFor(token: string | null): string {
  const base = `${baseUrl()}/newsletter/unsubscribe`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

// Send the "add your news" reminder to active subscribers, EXCEPT anyone who's
// already in the current unassigned-submissions pool (they've posted, no nudge
// needed). Reply-to is admin-supplied; every recipient is logged.
export async function POST(request: NextRequest) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      mode?: string;
      testEmail?: string;
      subject?: string;
      body?: string;
    };

    // Reply-to is configured per issue in the newsletter admin, not per send.
    const replyTo = await getEffectiveReplyTo();
    if (!replyTo || !EMAIL_RE.test(replyTo)) {
      return NextResponse.json(
        { error: 'Set a reply-to email in the newsletter admin before sending.' },
        { status: 400 }
      );
    }

    // Admin-supplied subject (doubles as the in-email heading) + message body.
    // Fall back to the defaults when left blank.
    const subject =
      (typeof body.subject === 'string' && body.subject.trim()) || DEFAULT_REMINDER_SUBJECT;
    const bodyText =
      (typeof body.body === 'string' && body.body.trim()) || DEFAULT_REMINDER_BODY;

    const mode = body.mode === 'failed' ? 'failed' : body.mode === 'test' ? 'test' : 'all';
    const submitUrl = `${baseUrl()}/newsletter/submit`;
    // One random decorative image per run, as an absolute URL for mail clients.
    const imageUrl = `${baseUrl()}/${pickReminderImage()}`;

    // Test: one email, no audit/quota write. Uses the test address's own token
    // when it happens to be a subscriber, else a tokenless link.
    if (mode === 'test') {
      const testEmail = typeof body.testEmail === 'string' ? body.testEmail.trim() : '';
      if (!testEmail || !EMAIL_RE.test(testEmail)) {
        return NextResponse.json({ error: 'A valid test email is required.' }, { status: 400 });
      }
      const subs = await getActiveSubscribers();
      const match = subs.find((s) => s.email.toLowerCase() === testEmail.toLowerCase());
      const unsubscribeUrl = unsubscribeUrlFor(match?.unsubscribe_token ?? null);
      const html = buildReminderEmailHtml({ heading: subject, bodyText, submitUrl, unsubscribeUrl, imageUrl });
      const { error } = await resendClient.emails.send({
        from: NEWSLETTER_FROM,
        to: testEmail,
        replyTo,
        subject,
        html,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 502 });
      }
      return NextResponse.json({ ok: true, test: true });
    }

    // Recipients: active subscribers minus those already in the unassigned pool.
    const [subs, unassigned] = await Promise.all([getActiveSubscribers(), getUnassignedSubmissions()]);
    const posted = new Set(
      unassigned.map((s) => (s.email || '').toLowerCase()).filter(Boolean)
    );
    let recipients = subs.filter((s) => !posted.has(s.email.toLowerCase()));

    // Retry failed: keep only recipients whose latest reminder attempt failed.
    if (mode === 'failed') {
      const log = await getReminderSendLog(); // newest-first
      const latest = new Map<string, 'sent' | 'failed'>();
      for (const e of log) {
        const k = e.recipient_email.toLowerCase();
        if (!latest.has(k)) latest.set(k, e.status);
      }
      recipients = recipients.filter((s) => latest.get(s.email.toLowerCase()) === 'failed');
    }

    let sent = 0;
    let failed = 0;
    for (const r of recipients) {
      const unsubscribeUrl = unsubscribeUrlFor(r.unsubscribe_token);
      const html = buildReminderEmailHtml({ heading: subject, bodyText, submitUrl, unsubscribeUrl, imageUrl });

      let status: 'sent' | 'failed' = 'sent';
      let resendId: string | undefined;
      let errorMessage: string | undefined;
      try {
        const { data, error } = await resendClient.emails.send({
          from: NEWSLETTER_FROM,
          to: r.email,
          replyTo,
          subject,
          html,
          headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
        });
        if (error) {
          status = 'failed';
          errorMessage = error.message;
        } else {
          resendId = data?.id;
        }
      } catch (err) {
        status = 'failed';
        errorMessage = err instanceof Error ? err.message : 'send threw';
      }

      if (status === 'sent') sent++;
      else failed++;

      await logAuditEvent({
        event_type: 'newsletter_reminder_sent',
        details: {
          newsletter_id: null,
          recipient_email: r.email,
          recipient_name: r.name ?? undefined,
          recipient_source: 'subscriber',
          resend_message_id: resendId,
          status,
          error_message: errorMessage,
          reply_to: replyTo,
        },
      });

      await sleep(100);
    }

    // Record the run's text + counts once, so past reminder wording can be
    // browsed and reused. Skipped when nothing was sent (no run to remember).
    if (recipients.length > 0) {
      await logAuditEvent({
        event_type: 'newsletter_reminder_batch',
        details: {
          subject,
          body: bodyText,
          mode,
          sent,
          failed,
          total: recipients.length,
          reply_to: replyTo,
        },
      });
    }

    logger.info('Newsletter reminder sent', {
      endpoint: 'admin/newsletter/reminder/send',
      mode,
      sent,
      failed,
      total: recipients.length,
    });

    return NextResponse.json({ ok: true, sent, failed, total: recipients.length });
  } catch (error) {
    logger.error('Newsletter reminder send failed', {
      endpoint: 'admin/newsletter/reminder/send',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to send reminder.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import {
  getNewsletterById,
  finalizeAndSendNewsletter,
  getNewsletterSendRecipients,
  getEffectiveReplyTo,
  replyToOf,
} from '@/lib/newsletter';
import { getActiveSubscribers } from '@/lib/subscribers';
import { logAuditEvent, getNewsletterSendLog } from '@/lib/audit';
import { resendClient, NEWSLETTER_FROM, baseUrl } from '@/lib/resend';
import { buildNewsletterEmailHtml } from '@/lib/newsletterEmail';
import { logger } from '@/lib/logger';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function unsubscribeUrlFor(token: string | null): string | undefined {
  return token ? `${baseUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(token)}` : undefined;
}

// Send the newsletter announcement email. Full send finalizes the issue first
// (scoop + freeze + status='sent'), then mails every recipient (active
// subscribers ∪ this edition's contributors, minus unsubscribers). Each is
// logged. Modes: all / retry-failed / test-to-one.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { mode?: string; testEmail?: string };
    const mode = body.mode === 'failed' ? 'failed' : body.mode === 'test' ? 'test' : 'all';

    const newsletter = await getNewsletterById(id);
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found.' }, { status: 404 });
    }

    // Reply-to: this issue's own setting, falling back to the effective default.
    const replyTo = replyToOf(newsletter) || (await getEffectiveReplyTo());
    if (!replyTo || !EMAIL_RE.test(replyTo)) {
      return NextResponse.json(
        { error: 'Set a reply-to email in the newsletter admin before sending.' },
        { status: 400 }
      );
    }

    const subject = newsletter.title?.trim() || 'The K9 Newsletter';
    const readUrl = `${baseUrl()}/newsletter/n/${newsletter.token}`;
    const emailFields = {
      title: newsletter.title,
      introHeading: newsletter.intro_heading,
      introText: newsletter.intro_text,
      headerImageUrl: newsletter.header_image_url,
      readUrl,
    };

    // Test: one address, no finalize, no audit/quota write. Uses the test
    // address's own unsubscribe token when it's a subscriber, else no link.
    if (mode === 'test') {
      const testEmail = typeof body.testEmail === 'string' ? body.testEmail.trim() : '';
      if (!testEmail || !EMAIL_RE.test(testEmail)) {
        return NextResponse.json({ error: 'A valid test email is required.' }, { status: 400 });
      }
      const subs = await getActiveSubscribers();
      const match = subs.find((s) => s.email.toLowerCase() === testEmail.toLowerCase());
      const html = buildNewsletterEmailHtml({
        ...emailFields,
        unsubscribeUrl: unsubscribeUrlFor(match?.unsubscribe_token ?? null),
      });
      const { error } = await resendClient.emails.send({
        from: NEWSLETTER_FROM,
        to: testEmail,
        replyTo,
        subject,
        html,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 502 });
      }
      return NextResponse.json({ ok: true, test: true });
    }

    // Full send freezes the issue first (idempotent once sent). Retry-failed
    // skips the scoop — the issue is already sent — and re-mails a subset.
    const issue = mode === 'failed' ? newsletter : await finalizeAndSendNewsletter(id);

    let recipients = await getNewsletterSendRecipients(issue);

    if (mode === 'failed') {
      const log = await getNewsletterSendLog(id); // newest-first
      const latest = new Map<string, 'sent' | 'failed'>();
      for (const e of log) {
        const k = e.recipient_email.toLowerCase();
        if (!latest.has(k)) latest.set(k, e.status);
      }
      recipients = recipients.filter((r) => latest.get(r.email.toLowerCase()) === 'failed');
    }

    let sent = 0;
    let failed = 0;
    for (const r of recipients) {
      const unsubscribeUrl = unsubscribeUrlFor(r.unsubscribe_token);
      const html = buildNewsletterEmailHtml({ ...emailFields, unsubscribeUrl });

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
          ...(unsubscribeUrl ? { headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` } } : {}),
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
        event_type: 'newsletter_email_sent',
        details: {
          newsletter_id: id,
          recipient_email: r.email,
          recipient_name: r.name ?? undefined,
          recipient_source: r.unsubscribe_token ? 'subscriber' : 'contributor',
          resend_message_id: resendId,
          status,
          error_message: errorMessage,
          reply_to: replyTo,
        },
      });

      await sleep(100);
    }

    logger.info('Newsletter sent', {
      endpoint: 'admin/newsletter/[id]/send',
      newsletterId: id,
      mode,
      sent,
      failed,
      total: recipients.length,
    });

    return NextResponse.json({ ok: true, sent, failed, total: recipients.length });
  } catch (error) {
    logger.error('Newsletter send failed', {
      endpoint: 'admin/newsletter/[id]/send',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to send newsletter.' }, { status: 500 });
  }
}

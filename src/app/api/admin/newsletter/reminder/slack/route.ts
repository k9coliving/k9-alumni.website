import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import { baseUrl } from '@/lib/resend';
import { slackConfigured, postToSlack } from '@/lib/slack';
import { DEFAULT_REMINDER_SUBJECT, DEFAULT_REMINDER_BODY } from '@/lib/newsletterEmail';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

// Post the "add your news" reminder to the K9 Slack channel (Incoming Webhook).
// Reuses the subject + message typed on the reminder page; independent of the
// email send. Not an email, so it doesn't touch the Resend quota.
export async function POST(request: NextRequest) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    if (!slackConfigured()) {
      return NextResponse.json(
        { error: 'Set SLACK_WEBHOOK_URL before posting to Slack.' },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      subject?: string;
      body?: string;
    };

    const subject =
      (typeof body.subject === 'string' && body.subject.trim()) || DEFAULT_REMINDER_SUBJECT;
    const bodyText =
      (typeof body.body === 'string' && body.body.trim()) || DEFAULT_REMINDER_BODY;

    const submitUrl = `${baseUrl()}/newsletter/submit`;
    // Slack mrkdwn: *bold* heading, body as-is (newlines preserved), CTA link.
    const text = `*${subject}*\n\n${bodyText}\n\n<${submitUrl}|Add your news →>`;

    const result = await postToSlack(text);

    await logAuditEvent({
      event_type: 'newsletter_reminder_slack_posted',
      details: {
        subject,
        body: bodyText,
        status: result.ok ? 'sent' : 'failed',
        error_message: result.error,
      },
    });

    if (!result.ok) {
      logger.error('Newsletter Slack reminder failed', {
        endpoint: 'admin/newsletter/reminder/slack',
        error: result.error,
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      return NextResponse.json({ error: result.error || 'Failed to post to Slack.' }, { status: 502 });
    }

    logger.info('Newsletter Slack reminder posted', {
      endpoint: 'admin/newsletter/reminder/slack',
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('Newsletter Slack reminder errored', {
      endpoint: 'admin/newsletter/reminder/slack',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to post to Slack.' }, { status: 500 });
  }
}

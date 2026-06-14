import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import crypto from 'crypto';
import {
  createSubmission,
  setSubmissionEditToken,
  parseSubmissionInput,
} from '@/lib/newsletter';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://alumni.k9coliving.com';
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Best-effort burst protection
  const limit = rateLimit(`newsletter-submit:${ip}`, RATE_LIMITS.submit.limit, RATE_LIMITS.submit.windowMs);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.', retryAfter: limit.retryAfterSeconds },
      { status: 429 }
    );
  }

  try {
    const raw = (await request.json()) as Record<string, unknown>;

    // Honeypot: real users never fill the hidden `website` field. Silently
    // accept so bots don't learn they were caught, but create nothing.
    if (typeof raw.website === 'string' && raw.website.trim() !== '') {
      logger.warn('Newsletter submission rejected - honeypot tripped', {
        endpoint: 'newsletter/submit',
        ip_address: ip,
      });
      return NextResponse.json({ success: true });
    }

    const parsed = parseSubmissionInput(raw);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const submission = await createSubmission({
      ...parsed.value,
      user_agent: userAgent,
    });

    // Edit token — high-entropy, no expiry; persists until the submission is
    // part of a sent newsletter.
    const editToken = crypto.randomUUID();
    await setSubmissionEditToken(submission.id, editToken);

    const editUrl = `${baseUrl()}/newsletter/edit/${submission.id}?token=${editToken}`;

    let emailed = false;
    if (parsed.value.email) {
      try {
        const { error } = await resend.emails.send({
          from: 'K9 Alumni <noreply@mail.k9coliving.com>',
          to: parsed.value.email,
          subject: 'Your K9 newsletter submission',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Thanks, ${parsed.value.name}!</h2>
              <p>We've received your contribution to the next K9 newsletter.</p>
              <p>Want to change something? You can edit your submission any time before the newsletter goes out:</p>
              <p style="margin: 24px 0;">
                <a href="${editUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">Edit my submission</a>
              </p>
              <p style="color: #6b7280; font-size: 14px;">Keep this email — it's the only way back to your submission.</p>
            </div>
          `,
        });
        if (error) {
          logger.error('Newsletter submission confirmation email failed', {
            endpoint: 'newsletter/submit',
            submissionId: submission.id,
            error: error.message,
          });
        } else {
          emailed = true;
        }
      } catch (err) {
        // A failed confirmation email must not fail the submission itself.
        logger.error('Newsletter submission confirmation email threw', {
          endpoint: 'newsletter/submit',
          submissionId: submission.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    logger.info('Newsletter submission created', {
      endpoint: 'newsletter/submit',
      submissionId: submission.id,
      hasEmail: !!parsed.value.email,
      emailed,
      photoCount: parsed.value.photo_urls?.length ?? 0,
    });

    return NextResponse.json({ id: submission.id, editUrl, emailed });
  } catch (error) {
    logger.error('Newsletter submission failed', {
      endpoint: 'newsletter/submit',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
  }
}

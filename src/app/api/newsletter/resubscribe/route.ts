import { NextRequest, NextResponse } from 'next/server';
import { resubscribe } from '@/lib/subscribers';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public, email-keyed resubscribe — backs the "you unsubscribed before,
// resubscribe?" prompt on the submit/edit success screens. Confirming by raw
// email is a deliberate, accepted trade-off for this alumni list (worst case:
// someone gets re-added and unsubscribes again in one click). No-op for unknown
// or already-subscribed emails.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`newsletter-resubscribe:${ip}`, RATE_LIMITS.resubscribe.limit, RATE_LIMITS.resubscribe.windowMs);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests.', retryAfter: limit.retryAfterSeconds }, { status: 429 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    const { resubscribed } = await resubscribe(email, { actor: 'self', source: 'submission' });
    return NextResponse.json({ ok: true, resubscribed });
  } catch (error) {
    logger.error('Newsletter resubscribe failed', {
      endpoint: 'newsletter/resubscribe',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

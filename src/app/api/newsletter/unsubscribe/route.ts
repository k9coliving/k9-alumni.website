import { NextRequest, NextResponse } from 'next/server';
import { getSubscriberByToken, unsubscribeByToken } from '@/lib/subscribers';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Public, token-gated. GET returns the email so the page can show a confirm
// screen; POST performs the unsubscribe. The actual change is a POST (not a
// bare GET link) so email clients / link scanners that prefetch the footer link
// can't silently unsubscribe someone.

function limited(request: NextRequest): NextResponse | null {
  const ip = getClientIp(request);
  const r = rateLimit(`unsubscribe:${ip}`, RATE_LIMITS.unsubscribe.limit, RATE_LIMITS.unsubscribe.windowMs);
  if (!r.allowed) {
    return NextResponse.json({ error: 'Too many requests.', retryAfter: r.retryAfterSeconds }, { status: 429 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = limited(request);
  if (denied) return denied;

  const token = request.nextUrl.searchParams.get('token') || '';
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  try {
    const sub = await getSubscriberByToken(token);
    if (!sub) {
      // Generic 404 — don't reveal whether a token maps to anyone.
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ email: sub.email, status: sub.status });
  } catch (error) {
    logger.error('Unsubscribe lookup failed', {
      endpoint: 'newsletter/unsubscribe',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = limited(request);
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => ({}))) as { token?: string };
    const token = typeof body.token === 'string' ? body.token : '';
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const result = await unsubscribeByToken(token, { actor: 'self' });
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, email: result.email });
  } catch (error) {
    logger.error('Unsubscribe failed', {
      endpoint: 'newsletter/unsubscribe',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

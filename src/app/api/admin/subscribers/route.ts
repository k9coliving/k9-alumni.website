import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import {
  listSubscribers,
  upsertSubscriber,
  unsubscribeByEmail,
  resubscribe,
  type SubscriberStatus,
} from '@/lib/subscribers';
import { logger } from '@/lib/logger';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// List subscribers, optionally filtered by ?status=subscribed|unsubscribed.
export async function GET(request: NextRequest) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const statusParam = request.nextUrl.searchParams.get('status');
    const status =
      statusParam === 'subscribed' || statusParam === 'unsubscribed'
        ? (statusParam as SubscriberStatus)
        : undefined;

    const subscribers = await listSubscribers({ status });
    return NextResponse.json({ subscribers });
  } catch (error) {
    logger.error('Admin subscribers list failed', {
      endpoint: 'admin/subscribers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to load subscribers.' }, { status: 500 });
  }
}

// Admin manually subscribes an email (source 'manual'). Returns the upsert
// result so the client can prompt: 'needs_resubscribe_confirm' means the email
// previously unsubscribed — the client confirms, then re-POSTs with
// confirmResubscribe:true (the explicit, audited resubscribe path).
export async function POST(request: NextRequest) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
      confirmResubscribe?: boolean;
    };
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (body.confirmResubscribe) {
      const r = await resubscribe(email, { actor: 'admin', source: 'manual' });
      return NextResponse.json({ result: r.resubscribed ? 'resubscribed' : 'already_subscribed' });
    }

    const { result } = await upsertSubscriber({ email, name: name || null, source: 'manual' });
    return NextResponse.json({ result });
  } catch (error) {
    logger.error('Admin subscriber add failed', {
      endpoint: 'admin/subscribers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to add subscriber.' }, { status: 500 });
  }
}

// Admin flips a subscriber's status. Audited as actor 'admin' in the lib.
export async function PATCH(request: NextRequest) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string; action?: string };
    const email = typeof body.email === 'string' ? body.email : '';
    const action = body.action;

    if (!email || (action !== 'unsubscribe' && action !== 'resubscribe')) {
      return NextResponse.json({ error: 'email and a valid action are required.' }, { status: 400 });
    }

    if (action === 'unsubscribe') {
      const row = await unsubscribeByEmail(email, { actor: 'admin' });
      if (!row) return NextResponse.json({ error: 'Subscriber not found.' }, { status: 404 });
    } else {
      // resubscribe is a no-op for unknown/already-subscribed emails
      await resubscribe(email, { actor: 'admin' });
    }

    logger.info('Admin changed subscriber status', { endpoint: 'admin/subscribers', action });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('Admin subscriber update failed', {
      endpoint: 'admin/subscribers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to update subscriber.' }, { status: 500 });
  }
}

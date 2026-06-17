import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import {
  listSubscribers,
  unsubscribeByEmail,
  resubscribe,
  type SubscriberStatus,
} from '@/lib/subscribers';
import { logger } from '@/lib/logger';

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

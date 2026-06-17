import crypto from 'crypto';
import { supabaseAdmin } from './supabase';
import { logAuditEvent } from './audit';

// ---------------------------------------------------------------------------
// Newsletter subscribers — single source of truth for newsletter consent.
//
// Sends read ONLY this table (getActiveSubscribers). The newsletter form,
// resident create/edit, and admin manual-add are WRITERS into it, never
// parallel readers. See newsletter-plan.md "Newsletter subscription model".
//
// Hard rule: writers NEVER auto-resurrect an unsubscribe. An opt-in targeting
// an already-unsubscribed email returns 'needs_resubscribe_confirm' so the UI
// can ask the person; only an explicit resubscribe() flips them back.
// ---------------------------------------------------------------------------

export type SubscriberStatus = 'subscribed' | 'unsubscribed';
export type SubscriberSource = 'resident' | 'submission' | 'manual' | 'import';
export type SubscriberActor = 'self' | 'admin';

export interface SubscriberRecord {
  email: string; // normalized lower(trim())
  name: string | null;
  status: SubscriberStatus;
  source: SubscriberSource | null;
  resident_id: string | null;
  unsubscribe_token: string;
  created_at?: string;
  updated_at?: string;
  unsubscribed_at?: string | null;
}

// Normalize to the table's primary-key form. All reads/writes go through this
// so casing/whitespace can never split one person across two rows.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

interface AuditContext {
  actor: SubscriberActor;
  source?: SubscriberSource;
  resident_id?: string;
  submission_id?: string;
}

function auditDetails(email: string, ctx: AuditContext): Record<string, unknown> {
  const details: Record<string, unknown> = { email, actor: ctx.actor };
  if (ctx.source) details.source = ctx.source;
  if (ctx.resident_id) details.resident_id = ctx.resident_id;
  if (ctx.submission_id) details.submission_id = ctx.submission_id;
  return details;
}

// Current status of an email, or null if it's never been a subscriber. Used to
// prefill the newsletter edit form's subscribe checkbox.
export async function getSubscriberStatus(email: string): Promise<SubscriberStatus | null> {
  const row = await getSubscriberByEmail(email);
  return row ? row.status : null;
}

async function getSubscriberByEmail(email: string): Promise<SubscriberRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('*')
    .eq('email', normalizeEmail(email))
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch subscriber: ${error.message}`);
  }
  return data;
}

export type UpsertResult = 'created' | 'already_subscribed' | 'needs_resubscribe_confirm';

// Opt-in entry point for every writer (form checkbox, resident create/edit,
// manual add). Idempotent for an already-subscribed email; refuses to silently
// revive an unsubscribe — the caller must route the person through resubscribe().
export async function upsertSubscriber(input: {
  email: string;
  name?: string | null;
  source: SubscriberSource;
  resident_id?: string | null;
  submission_id?: string;
}): Promise<{ result: UpsertResult }> {
  const email = normalizeEmail(input.email);
  const existing = await getSubscriberByEmail(email);

  if (existing) {
    if (existing.status === 'unsubscribed') {
      return { result: 'needs_resubscribe_confirm' };
    }
    return { result: 'already_subscribed' };
  }

  const { error } = await supabaseAdmin.from('newsletter_subscribers').insert({
    email,
    name: input.name ?? null,
    status: 'subscribed',
    source: input.source,
    resident_id: input.resident_id ?? null,
    unsubscribe_token: crypto.randomUUID(),
  });

  if (error) {
    throw new Error(`Failed to create subscriber: ${error.message}`);
  }

  await logAuditEvent({
    event_type: 'newsletter_subscribed',
    details: auditDetails(email, {
      actor: input.source === 'manual' ? 'admin' : 'self',
      source: input.source,
      resident_id: input.resident_id ?? undefined,
      submission_id: input.submission_id,
    }),
  });

  return { result: 'created' };
}

// Explicit, confirmed flip back to subscribed (form success page / resident
// step 2 / admin manual-add after a resubscribe prompt). Safe to call on an
// already-subscribed or unknown email — only logs when a row actually flips.
export async function resubscribe(
  rawEmail: string,
  ctx: AuditContext
): Promise<{ resubscribed: boolean }> {
  const email = normalizeEmail(rawEmail);
  const existing = await getSubscriberByEmail(email);

  if (!existing || existing.status === 'subscribed') {
    return { resubscribed: false };
  }

  const { error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .update({
      status: 'subscribed',
      unsubscribed_at: null,
      source: ctx.source ?? existing.source,
      updated_at: new Date().toISOString(),
    })
    .eq('email', email);

  if (error) {
    throw new Error(`Failed to resubscribe: ${error.message}`);
  }

  await logAuditEvent({
    event_type: 'newsletter_resubscribed',
    details: auditDetails(email, ctx),
  });

  return { resubscribed: true };
}

async function applyUnsubscribe(
  row: SubscriberRecord,
  ctx: AuditContext
): Promise<SubscriberRecord> {
  if (row.status === 'unsubscribed') {
    return row; // already gone — don't re-log
  }

  const { data, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', row.email)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to unsubscribe: ${error.message}`);
  }

  await logAuditEvent({
    event_type: 'newsletter_unsubscribed',
    details: auditDetails(row.email, ctx),
  });

  return data;
}

// One-click unsubscribe from an email footer link. Returns null on unknown
// token so the route can show a generic page (no token enumeration).
export async function unsubscribeByToken(
  token: string,
  ctx: Omit<AuditContext, 'actor'> & { actor?: SubscriberActor } = {}
): Promise<SubscriberRecord | null> {
  const row = await getSubscriberByToken(token);
  if (!row) return null;
  return applyUnsubscribe(row, { actor: 'self', ...ctx });
}

// Unsubscribe by email — admin action, or a resident de-opting their
// involvement (actor 'self', source 'resident'). No-op for unknown emails.
export async function unsubscribeByEmail(
  rawEmail: string,
  ctx: AuditContext
): Promise<SubscriberRecord | null> {
  const row = await getSubscriberByEmail(rawEmail);
  if (!row) return null;
  return applyUnsubscribe(row, ctx);
}

// The recipient list. Sends read ONLY this.
export async function getActiveSubscribers(): Promise<{ email: string; name: string | null }[]> {
  const { data, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('email, name')
    .eq('status', 'subscribed');

  if (error) {
    throw new Error(`Failed to fetch active subscribers: ${error.message}`);
  }
  return data || [];
}

export async function getSubscriberByToken(token: string): Promise<SubscriberRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('*')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch subscriber by token: ${error.message}`);
  }
  return data;
}

// Admin list, newest first, optionally filtered by status.
export async function listSubscribers(
  opts: { status?: SubscriberStatus } = {}
): Promise<SubscriberRecord[]> {
  let query = supabaseAdmin
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false });

  if (opts.status) {
    query = query.eq('status', opts.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list subscribers: ${error.message}`);
  }
  return data || [];
}

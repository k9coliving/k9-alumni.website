import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NewsletterEditTokenData {
  token: string;
  created_at: string;
}

export interface NewsletterSubmissionRecord {
  id: string;
  created_at?: string;
  updated_at?: string;

  name: string;
  period_in_k9: string;
  whats_up: string;

  where_now?: string | null;
  hold_my_hair?: string | null;
  email?: string | null;
  recommendation_link?: string | null;
  recommendation_context?: string | null;
  happy_story?: string | null;
  photo_urls?: string[];

  notify_for_next_newsletter?: boolean;

  edit_token?: NewsletterEditTokenData | null;
  newsletter_id?: string | null;

  submission_ip?: string | null;
  user_agent?: string | null;
}

export interface NewsletterRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
  sent_at?: string | null;

  token: string;
  title: string;
  intro_text?: string | null;
  outro_text?: string | null;

  // Optional per-issue masthead image (Supabase public URL). When unset the view
  // falls back to the default newsletter-header.jpg in Supabase storage.
  header_image_url?: string | null;

  status: 'draft' | 'sent';
}

export type RecipientSource = 'resident_subscribed' | 'past_submitter' | 'manual';

export interface RecipientEntry {
  email: string;
  name?: string;
  source: RecipientSource;
}

// Fields a submitter is allowed to set on create/update. Excludes server-managed
// columns (id/timestamps, edit_token, newsletter_id).
export type SubmissionInput = Omit<
  NewsletterSubmissionRecord,
  'id' | 'created_at' | 'updated_at' | 'edit_token' | 'newsletter_id'
>;

// Generous soft limits — users should never hit them; they exist as a DoS guard
// and are never surfaced in the UI.
export const MAX_FIELD_LENGTH = 10_000;
export const MAX_PHOTOS = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validates + normalises raw submission input (from the public form or the edit
// PATCH). Trims, soft-caps field lengths, caps photos at MAX_PHOTOS, enforces
// the three required fields, and checks email format when present. Does NOT set
// server-managed fields (ip/user_agent are added by the route).
export function parseSubmissionInput(
  raw: Record<string, unknown>
): { ok: true; value: SubmissionInput } | { ok: false; error: string } {
  const str = (v: unknown): string | undefined => {
    if (typeof v !== 'string') return undefined;
    const trimmed = v.trim();
    return trimmed ? trimmed.slice(0, MAX_FIELD_LENGTH) : undefined;
  };

  const name = str(raw.name);
  const period_in_k9 = str(raw.period_in_k9);
  const whats_up = str(raw.whats_up);
  const email = str(raw.email);

  if (!name || !period_in_k9 || !whats_up || !email) {
    return { ok: false, error: 'Name, period in K9, "What\'s up", and email are required.' };
  }

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'Please provide a valid email address.' };
  }

  let photo_urls: string[] = [];
  if (Array.isArray(raw.photo_urls)) {
    photo_urls = raw.photo_urls
      .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      .map((u) => u.trim())
      .slice(0, MAX_PHOTOS);
  }

  return {
    ok: true,
    value: {
      name,
      period_in_k9,
      whats_up,
      where_now: str(raw.where_now) ?? null,
      hold_my_hair: str(raw.hold_my_hair) ?? null,
      email: email ?? null,
      recommendation_link: str(raw.recommendation_link) ?? null,
      recommendation_context: str(raw.recommendation_context) ?? null,
      happy_story: str(raw.happy_story) ?? null,
      photo_urls,
      notify_for_next_newsletter: raw.notify_for_next_newsletter === true,
    },
  };
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export async function createSubmission(data: SubmissionInput): Promise<NewsletterSubmissionRecord> {
  const { data: row, error } = await supabaseAdmin
    .from('newsletter_submissions')
    .insert([data])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create submission: ${error.message}`);
  }

  return row;
}

export async function getSubmissionById(id: string): Promise<NewsletterSubmissionRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('newsletter_submissions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No rows found
    }
    throw new Error(`Failed to fetch submission: ${error.message}`);
  }

  return data;
}

// Editing is only allowed while the submission is unassigned. Re-checks
// `newsletter_id IS NULL` at write time too, so a submission scooped into a
// newsletter between our read and write can't be edited.
export async function updateSubmission(
  id: string,
  patch: Partial<SubmissionInput>
): Promise<{ updated: NewsletterSubmissionRecord | null; reason?: 'not_found' | 'already_sent' }> {
  const existing = await getSubmissionById(id);
  if (!existing) {
    return { updated: null, reason: 'not_found' };
  }
  if (existing.newsletter_id) {
    return { updated: null, reason: 'already_sent' };
  }

  const { data, error } = await supabaseAdmin
    .from('newsletter_submissions')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .is('newsletter_id', null)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Row matched id but not the newsletter_id IS NULL guard -> scooped meanwhile
      return { updated: null, reason: 'already_sent' };
    }
    throw new Error(`Failed to update submission: ${error.message}`);
  }

  return { updated: data };
}

// No expiry — the edit token persists until the submission is part of a sent
// newsletter (at which point editing is closed regardless of the token).
export async function setSubmissionEditToken(id: string, token: string): Promise<void> {
  const editToken: NewsletterEditTokenData = {
    token,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('newsletter_submissions')
    .update({ edit_token: editToken, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to set edit token: ${error.message}`);
  }
}

// Constant-time string compare — avoids leaking secrets via response timing.
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

export async function verifySubmissionEditToken(id: string, token: string): Promise<boolean> {
  const submission = await getSubmissionById(id);
  const stored = submission?.edit_token?.token;
  if (!stored) {
    return false;
  }
  return timingSafeEqualStr(stored, token);
}

// Hard-delete a submission (spam / correction). Admin-only.
export async function deleteSubmission(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('newsletter_submissions').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete submission: ${error.message}`);
  }
}

export async function getUnassignedSubmissions(): Promise<NewsletterSubmissionRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('newsletter_submissions')
    .select('*')
    .is('newsletter_id', null)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch unassigned submissions: ${error.message}`);
  }

  return data || [];
}

async function getSubmissionsByNewsletterId(newsletterId: string): Promise<NewsletterSubmissionRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('newsletter_submissions')
    .select('*')
    .eq('newsletter_id', newsletterId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch newsletter submissions: ${error.message}`);
  }

  return data || [];
}

// ---------------------------------------------------------------------------
// Newsletters
// ---------------------------------------------------------------------------

export async function createNewsletter(draft: {
  title: string;
  intro_text?: string | null;
  outro_text?: string | null;
  header_image_url?: string | null;
}): Promise<NewsletterRecord> {
  // 192-bit url-safe token. This is the only thing gating access to the
  // newsletter, so it needs real entropy.
  const token = crypto.randomBytes(24).toString('base64url');

  // header_image_url is only included when explicitly provided, so newsletter
  // creation keeps working even before the (optional) DB column is added.
  const row: Record<string, unknown> = {
    title: draft.title,
    intro_text: draft.intro_text ?? null,
    outro_text: draft.outro_text ?? null,
    token,
    status: 'draft',
  };
  if (draft.header_image_url !== undefined) {
    row.header_image_url = draft.header_image_url;
  }

  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .insert([row])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create newsletter: ${error.message}`);
  }

  return data;
}

// Edit a draft's editorial fields. Only meaningful while status='draft'; the
// caller is responsible for not exposing this on a sent newsletter.
export async function updateNewsletter(
  id: string,
  patch: { title?: string; intro_text?: string | null; outro_text?: string | null; header_image_url?: string | null }
): Promise<NewsletterRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to update newsletter: ${error.message}`);
  }

  return data;
}

// All newsletters, newest first — for the admin "past newsletters" list.
export async function getAllNewsletters(): Promise<NewsletterRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch newsletters: ${error.message}`);
  }

  return data || [];
}

export async function getNewsletterById(id: string): Promise<NewsletterRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch newsletter: ${error.message}`);
  }

  return data;
}

// Serves a newsletter by token in ANY status — the token is the access gate.
// Render depends on status: a draft shows the live set of unassigned
// submissions (preview of what will go out); a sent newsletter shows the
// submissions frozen into it. Both ordered created_at ASC.
export async function getNewsletterByToken(
  token: string
): Promise<{ newsletter: NewsletterRecord; submissions: NewsletterSubmissionRecord[] } | null> {
  const { data: newsletter, error } = await supabaseAdmin
    .from('newsletters')
    .select('*')
    .eq('token', token)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Wrong/unknown token — caller 404s
    }
    throw new Error(`Failed to fetch newsletter: ${error.message}`);
  }

  const submissions =
    newsletter.status === 'sent'
      ? await getSubmissionsByNewsletterId(newsletter.id)
      : await getUnassignedSubmissions();

  return { newsletter, submissions };
}

// Scoop all currently-unassigned submissions into this newsletter and mark it
// sent. Idempotent: a no-op scoop if already sent (supports retrying failed
// sends). The scoop is a single UPDATE (atomic across rows); the brief window
// before the status flip is the documented preview->send race.
export async function finalizeAndSendNewsletter(id: string): Promise<NewsletterRecord> {
  const newsletter = await getNewsletterById(id);
  if (!newsletter) {
    throw new Error('Newsletter not found');
  }

  if (newsletter.status === 'sent') {
    return newsletter;
  }

  const { error: scoopError } = await supabaseAdmin
    .from('newsletter_submissions')
    .update({ newsletter_id: id, updated_at: new Date().toISOString() })
    .is('newsletter_id', null);

  if (scoopError) {
    throw new Error(`Failed to assign submissions to newsletter: ${scoopError.message}`);
  }

  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark newsletter sent: ${error.message}`);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Events (Save the dates)
// ---------------------------------------------------------------------------

export interface NewsletterEventRecord {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_datetime: string;
  duration: string | null;
}

// Events from the `events` table starting between now and `months` months out,
// soonest first — populates the newsletter "Save the dates" section. Birthdays
// (derived from residents on the Events page) are intentionally excluded.
export async function getUpcomingEvents(months = 3): Promise<NewsletterEventRecord[]> {
  const now = new Date();
  const until = new Date(now);
  until.setMonth(until.getMonth() + months);

  const { data, error } = await supabaseAdmin
    .from('events')
    .select('id, title, description, location, start_datetime, duration')
    .gte('start_datetime', now.toISOString())
    .lte('start_datetime', until.toISOString())
    .order('start_datetime', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch upcoming events: ${error.message}`);
  }

  return data || [];
}

// ---------------------------------------------------------------------------
// Recipients
// ---------------------------------------------------------------------------

// Residents opted into the newsletter: involvement_level in the allowed set OR
// flagged as a team member. Excludes rows with no email.
export async function getNewsletterSubscribedResidents(): Promise<
  { id: string; name: string; email: string }[]
> {
  const { data, error } = await supabaseAdmin
    .from('residents')
    .select('id, name, email')
    .not('email', 'is', null)
    .or(
      [
        'preferences->>involvement_level.eq.full-engagement',
        'preferences->>involvement_level.eq.newsletter-only',
        'preferences->>involvement_level.eq.team-member',
        'preferences->>is_team_member.eq.true',
      ].join(',')
    );

  if (error) {
    throw new Error(`Failed to fetch subscribed residents: ${error.message}`);
  }

  return (data || []).filter((r): r is { id: string; name: string; email: string } => !!r.email);
}

// Distinct emails (lowercased-dedup, original casing preserved) of past
// submitters who asked to be reminded about the next newsletter.
export async function getPastSubmittersWantingReminders(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('newsletter_submissions')
    .select('email')
    .eq('notify_for_next_newsletter', true)
    .not('email', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch reminder subscribers: ${error.message}`);
  }

  const byKey = new Map<string, string>();
  for (const row of data || []) {
    if (row.email) {
      const key = row.email.toLowerCase();
      if (!byKey.has(key)) {
        byKey.set(key, row.email);
      }
    }
  }
  return [...byKey.values()];
}

// Unions subscribed residents + reminder-wanting past submitters + manual
// additions, deduped by lowercased email. First source to claim an email wins
// its source tag (resident_subscribed > past_submitter > manual).
export async function resolveRecipients(manualEmails: string[] = []): Promise<RecipientEntry[]> {
  const byKey = new Map<string, RecipientEntry>();

  const residents = await getNewsletterSubscribedResidents();
  for (const r of residents) {
    const key = r.email.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, { email: r.email, name: r.name, source: 'resident_subscribed' });
    }
  }

  const pastSubmitters = await getPastSubmittersWantingReminders();
  for (const email of pastSubmitters) {
    const key = email.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, { email, source: 'past_submitter' });
    }
  }

  for (const raw of manualEmails) {
    const email = raw.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, { email, source: 'manual' });
    }
  }

  return [...byKey.values()];
}

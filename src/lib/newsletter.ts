import crypto from 'crypto';
import { supabaseAdmin } from './supabase';
import { getActiveSubscribers, getUnsubscribedEmails } from './subscribers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NewsletterEditTokenData {
  token: string;
  created_at: string;
}

// A photo attached to a submission. `focus` is a CSS object-position keyword
// controlling how the image is cropped inside the newsletter's fixed-aspect
// frames (16:10 lead + small polaroids); absent means centred. Restricted to a
// 3x3 grid of presets, validated in parseSubmissionInput.
export type PhotoFocus =
  | 'left top' | 'center top' | 'right top'
  | 'left center' | 'center' | 'right center'
  | 'left bottom' | 'center bottom' | 'right bottom';

export const PHOTO_FOCUSES: PhotoFocus[] = [
  'left top', 'center top', 'right top',
  'left center', 'center', 'right center',
  'left bottom', 'center bottom', 'right bottom',
];

export interface NewsletterPhoto {
  url: string;
  focus?: PhotoFocus;
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
  photos?: NewsletterPhoto[];

  edit_token?: NewsletterEditTokenData | null;
  newsletter_id?: string | null;

  user_agent?: string | null;
}

export interface NewsletterRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
  sent_at?: string | null;

  token: string;
  title: string;
  // Heading above the intro ("welcome note"). Falls back to DEFAULT_INTRO_HEADING.
  intro_heading?: string | null;
  intro_text?: string | null;
  outro_text?: string | null;

  // Optional per-issue masthead image (Supabase public URL). When unset the view
  // falls back to the default newsletter-header.jpg in Supabase storage.
  header_image_url?: string | null;

  // Open jsonb bag for newsletter-scoped config and write-once snapshots that
  // don't each warrant a column. Today: email_reply_to (the address all mail for
  // this issue uses). Room for send-time stats later (e.g. sent_count). NOT for
  // high-frequency counters — derive view/sent counts from audit_logs instead of
  // racy read-modify-write on this blob.
  data?: NewsletterData | null;

  status: 'draft' | 'sent';
}

// An optional editorial highlight for an issue — a book recommendation, a piece
// of news, an anniversary banner. Stored in `data.featured` (no own column).
export interface FeaturedItem {
  eyebrow?: string; // small kicker label, e.g. "From #bookclub" / "K9 turns 10"
  title: string; // required
  body?: string;
  image_url?: string; // optional Supabase public URL (reuses the image upload)
}

export const MAX_FEATURED = 3;

export interface NewsletterData {
  email_reply_to?: string | null;
  featured?: FeaturedItem[];
  [key: string]: unknown;
}

// The reply-to address configured for an issue, trimmed ('' when unset).
export function replyToOf(n: Pick<NewsletterRecord, 'data'> | null | undefined): string {
  const v = n?.data?.email_reply_to;
  return typeof v === 'string' ? v.trim() : '';
}

// The featured highlights configured for an issue ([] when none).
export function featuredOf(n: Pick<NewsletterRecord, 'data'> | null | undefined): FeaturedItem[] {
  const v = n?.data?.featured;
  return Array.isArray(v) ? sanitizeFeatured(v) : [];
}

// Validate/normalise featured items from any input: trim, soft-cap field lengths
// (reusing MAX_FIELD_LENGTH), drop items with no title, cap the list at
// MAX_FEATURED, and only carry image_url when it's a non-empty string.
export function sanitizeFeatured(raw: unknown): FeaturedItem[] {
  if (!Array.isArray(raw)) return [];
  const str = (v: unknown): string | undefined => {
    if (typeof v !== 'string') return undefined;
    const t = v.trim();
    return t ? t.slice(0, MAX_FIELD_LENGTH) : undefined;
  };
  return raw
    .map((r): FeaturedItem | null => {
      if (!r || typeof r !== 'object') return null;
      const rec = r as Record<string, unknown>;
      const title = str(rec.title);
      if (!title) return null;
      const item: FeaturedItem = { title };
      const eyebrow = str(rec.eyebrow);
      if (eyebrow) item.eyebrow = eyebrow;
      const body = str(rec.body);
      if (body) item.body = body;
      const imageUrl = str(rec.image_url);
      if (imageUrl) item.image_url = imageUrl;
      return item;
    })
    .filter((i): i is FeaturedItem => i !== null)
    .slice(0, MAX_FEATURED);
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

  // Photos arrive as { url, focus? }. Keep only items with a non-empty url, and
  // only carry a focus when it's a known preset other than the default 'center'.
  let photos: NewsletterPhoto[] = [];
  if (Array.isArray(raw.photos)) {
    photos = raw.photos
      .map((p): NewsletterPhoto | null => {
        if (!p || typeof p !== 'object') return null;
        const rec = p as Record<string, unknown>;
        const url = typeof rec.url === 'string' ? rec.url.trim() : '';
        if (!url) return null;
        const focus = PHOTO_FOCUSES.find((f) => f === rec.focus);
        return focus && focus !== 'center' ? { url, focus } : { url };
      })
      .filter((p): p is NewsletterPhoto => p !== null)
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
      photos,
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
  intro_heading?: string | null;
  intro_text?: string | null;
  outro_text?: string | null;
  header_image_url?: string | null;
  email_reply_to?: string | null;
  featured?: FeaturedItem[];
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
  if (draft.intro_heading !== undefined) {
    row.intro_heading = draft.intro_heading;
  }
  if (draft.header_image_url !== undefined) {
    row.header_image_url = draft.header_image_url;
  }
  // email_reply_to + featured both live in the `data` jsonb; only attach it when
  // there's something to store.
  const data: NewsletterData = {};
  const replyTo = (draft.email_reply_to ?? '').trim();
  if (replyTo) data.email_reply_to = replyTo;
  const featured = sanitizeFeatured(draft.featured);
  if (featured.length) data.featured = featured;
  if (Object.keys(data).length) row.data = data;

  const { data: created, error } = await supabaseAdmin
    .from('newsletters')
    .insert([row])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create newsletter: ${error.message}`);
  }

  return created;
}

// Edit a draft's editorial fields. Only meaningful while status='draft'; the
// caller is responsible for not exposing this on a sent newsletter.
export async function updateNewsletter(
  id: string,
  patch: {
    title?: string;
    intro_heading?: string | null;
    intro_text?: string | null;
    outro_text?: string | null;
    header_image_url?: string | null;
    email_reply_to?: string | null;
    featured?: FeaturedItem[];
  }
): Promise<NewsletterRecord | null> {
  const { email_reply_to, featured, ...columns } = patch;
  const update: Record<string, unknown> = { ...columns, updated_at: new Date().toISOString() };

  // email_reply_to + featured live inside the `data` jsonb. Merge rather than
  // overwrite so a draft edit can't clobber other keys (e.g. send-time stats).
  if (email_reply_to !== undefined || featured !== undefined) {
    const existing = await getNewsletterById(id);
    const merged: NewsletterData = { ...(existing?.data ?? {}) };
    if (email_reply_to !== undefined) {
      const trimmed = (email_reply_to ?? '').trim();
      if (trimmed) merged.email_reply_to = trimmed;
      else delete merged.email_reply_to;
    }
    if (featured !== undefined) {
      const items = sanitizeFeatured(featured);
      if (items.length) merged.featured = items;
      else delete merged.featured;
    }
    update.data = merged;
  }

  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .update(update)
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

// Reply-to for reminder mail, which isn't tied to a specific newsletter row.
// Prefers the active draft (the issue the reminder nudges for), then the most
// recent newsletter that has one, then the legacy env default.
export async function getEffectiveReplyTo(): Promise<string> {
  const all = await getAllNewsletters(); // newest first
  const draft = all.find((n) => n.status === 'draft');
  const fromDraft = replyToOf(draft);
  if (fromDraft) return fromDraft;
  const fromLatest = all.map(replyToOf).find(Boolean);
  if (fromLatest) return fromLatest;
  return (process.env.ADMIN_DEFAULT_REPLY_TO ?? '').trim();
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
//
// The reminder flow computes its set inline (active subscribers minus those who
// already posted). The newsletter send uses the resolver below: active
// subscribers ∪ this edition's contributors, minus explicit unsubscribers.

// Dedupe a submission list down to one entry per email (first wins, keeping the
// original-cased email + the contributor's name). Skips rows without an email.
function dedupeSubmissionEmails(
  subs: NewsletterSubmissionRecord[]
): { email: string; name: string | null }[] {
  const byEmail = new Map<string, { email: string; name: string | null }>();
  for (const s of subs) {
    const email = (s.email || '').trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (!byEmail.has(key)) byEmail.set(key, { email, name: s.name ?? null });
  }
  return [...byEmail.values()];
}

// Emails of the people whose submissions are assigned to this (sent) newsletter.
export async function getNewsletterContributorEmails(
  newsletterId: string
): Promise<{ email: string; name: string | null }[]> {
  return dedupeSubmissionEmails(await getSubmissionsByNewsletterId(newsletterId));
}

export interface SendRecipient {
  email: string;
  name: string | null;
  // Subscribers carry their unsubscribe token (→ unsubscribe footer link).
  // Contributor-only recipients have null (→ "you submitted a post" line).
  unsubscribe_token: string | null;
}

// Recipients for a newsletter send: active subscribers ∪ the edition's
// contributors, deduped by lowercased email (the subscriber entry wins so they
// keep their unsubscribe link), minus anyone explicitly unsubscribed. For a
// draft the contributors are the current unassigned pool (what finalize will
// scoop); for a sent issue they're the rows already assigned to it.
export async function getNewsletterSendRecipients(
  newsletter: NewsletterRecord
): Promise<SendRecipient[]> {
  const [active, unsub, contributors] = await Promise.all([
    getActiveSubscribers(),
    getUnsubscribedEmails(),
    newsletter.status === 'sent'
      ? getNewsletterContributorEmails(newsletter.id)
      : dedupeSubmissionEmails(await getUnassignedSubmissions()),
  ]);

  const byEmail = new Map<string, SendRecipient>();
  for (const c of contributors) {
    const key = c.email.toLowerCase();
    if (unsub.has(key)) continue;
    byEmail.set(key, { email: c.email, name: c.name, unsubscribe_token: null });
  }
  // Subscribers added second so they overwrite a contributor entry for the same
  // email — that way they get the token-based unsubscribe link.
  for (const a of active) {
    const key = a.email.toLowerCase();
    if (unsub.has(key)) continue;
    byEmail.set(key, { email: a.email, name: a.name, unsubscribe_token: a.unsubscribe_token });
  }
  return [...byEmail.values()];
}

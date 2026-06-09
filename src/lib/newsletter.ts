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

export async function verifySubmissionEditToken(id: string, token: string): Promise<boolean> {
  const submission = await getSubmissionById(id);
  const stored = submission?.edit_token?.token;
  if (!stored) {
    return false;
  }

  // Constant-time compare to avoid leaking the token via response timing.
  const a = Buffer.from(stored);
  const b = Buffer.from(token);
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
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
}): Promise<NewsletterRecord> {
  // 192-bit url-safe token. This is the only thing gating access to the
  // newsletter, so it needs real entropy.
  const token = crypto.randomBytes(24).toString('base64url');

  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .insert([
      {
        title: draft.title,
        intro_text: draft.intro_text ?? null,
        outro_text: draft.outro_text ?? null,
        token,
        status: 'draft',
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create newsletter: ${error.message}`);
  }

  return data;
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

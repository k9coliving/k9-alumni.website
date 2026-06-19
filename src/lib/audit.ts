import { supabaseAdmin } from './supabase';

export type AuditEventType =
  | 'failed_login'
  | 'successful_login'
  | 'user_added'
  | 'user_modified'
  | 'data_modified'
  | 'password_changed'
  | 'system_error'
  | 'edit_request_sent'
  | 'newsletter_email_sent'
  | 'newsletter_reminder_sent'
  // One per reminder send *run* (not per recipient): records the subject + body
  // text and the run's counts, so past reminder texts can be browsed/reused.
  // NOT an email-sending event itself — deliberately excluded from
  // getEmailsSentInLast24h() (the per-recipient rows already cover the quota).
  | 'newsletter_reminder_batch'
  // One per Slack reminder post. Sends no email — deliberately NOT added to
  // getEmailsSentInLast24h() so it doesn't count against the email quota.
  | 'newsletter_reminder_slack_posted'
  // Subscription state changes. NOTE: these send no email — deliberately NOT
  // added to getEmailsSentInLast24h() so they don't count against the quota.
  | 'newsletter_subscribed'
  | 'newsletter_unsubscribed'
  | 'newsletter_resubscribed';

interface AuditLogEntry {
  event_type: AuditEventType;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
  session_id?: string;
}

export async function logAuditEvent({
  event_type,
  ip_address,
  user_agent,
  details,
  session_id
}: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        event_type,
        ip_address,
        user_agent,
        details,
        session_id
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

export async function getFailedLoginAttempts(
  ip_address: string, 
  timeWindowMinutes: number = 60
): Promise<number> {
  try {
    const cutoffTime = new Date(Date.now() - (timeWindowMinutes * 60 * 1000)).toISOString();
    
    const { count, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'failed_login')
      .eq('ip_address', ip_address)
      .gte('timestamp', cutoffTime);

    if (error) {
      console.error('Failed to get login attempts:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error checking failed attempts:', err);
    return 0;
  }
}

// Rolling 24h count of emails sent across every email-sending event type.
// Used for the newsletter quota warning. NOTE: any future email-sending event
// type MUST be added to this list or the quota will under-count.
export async function getEmailsSentInLast24h(): Promise<number> {
  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .in('event_type', [
        'edit_request_sent',
        'newsletter_email_sent',
        'newsletter_reminder_sent',
      ])
      .gte('timestamp', cutoffTime);

    if (error) {
      console.error('Failed to count emails sent in last 24h:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error counting emails sent in last 24h:', err);
    return 0;
  }
}

// Timestamp of the most recent reminder send (per-recipient rows exist for every
// real reminder run; test sends aren't logged). null when none has gone out.
export async function getLastReminderSentAt(): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('timestamp')
      .eq('event_type', 'newsletter_reminder_sent')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to load last reminder timestamp:', error);
      return null;
    }

    return data?.timestamp ?? null;
  } catch (err) {
    console.error('Error loading last reminder timestamp:', err);
    return null;
  }
}

// Timestamp of the most recent *successful* Slack reminder post. Filters on
// details.status so a failed attempt doesn't read as "sent". null when none.
export async function getLastSlackReminderAt(): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('timestamp')
      .eq('event_type', 'newsletter_reminder_slack_posted')
      .eq('details->>status', 'sent')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to load last Slack reminder timestamp:', error);
      return null;
    }

    return data?.timestamp ?? null;
  } catch (err) {
    console.error('Error loading last Slack reminder timestamp:', err);
    return null;
  }
}

// One per-recipient row from a send/reminder run, flattened from audit details.
export interface SendLogEntry {
  recipient_email: string;
  recipient_name?: string;
  status: 'sent' | 'failed';
  error_message?: string;
  timestamp: string;
}

function mapSendLog(
  rows: { details: Record<string, unknown> | null; timestamp: string }[]
): SendLogEntry[] {
  return rows
    .map((row) => {
      const d = row.details || {};
      return {
        recipient_email: typeof d.recipient_email === 'string' ? d.recipient_email : '',
        recipient_name: typeof d.recipient_name === 'string' ? d.recipient_name : undefined,
        status: d.status === 'failed' ? 'failed' : 'sent',
        error_message: typeof d.error_message === 'string' ? d.error_message : undefined,
        timestamp: row.timestamp,
      } as SendLogEntry;
    })
    .filter((e) => e.recipient_email);
}

// Recent reminder send attempts (newest first) — powers the reminder page's
// audit table and its "retry failed" set. Reminders aren't tied to an edition,
// so this is time-windowed rather than per-newsletter.
export async function getReminderSendLog(sinceHours = 24): Promise<SendLogEntry[]> {
  try {
    const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('details, timestamp')
      .eq('event_type', 'newsletter_reminder_sent')
      .gte('timestamp', cutoff)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Failed to load reminder send log:', error);
      return [];
    }
    return mapSendLog(data || []);
  } catch (err) {
    console.error('Error loading reminder send log:', err);
    return [];
  }
}

// Per-recipient send attempts for one newsletter (newest first) — powers the
// send page's audit table and its "retry failed" set. Scoped by newsletter_id
// (not time-windowed) so a re-send sees the issue's full history.
export async function getNewsletterSendLog(newsletterId: string): Promise<SendLogEntry[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('details, timestamp')
      .eq('event_type', 'newsletter_email_sent')
      .eq('details->>newsletter_id', newsletterId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Failed to load newsletter send log:', error);
      return [];
    }
    return mapSendLog(data || []);
  } catch (err) {
    console.error('Error loading newsletter send log:', err);
    return [];
  }
}

// One reminder send run, flattened from a 'newsletter_reminder_batch' event —
// the text that went out plus its counts. Powers the "previous reminders" list.
export interface ReminderTextEntry {
  subject: string;
  body: string;
  mode: string;
  sent: number;
  failed: number;
  total: number;
  reply_to?: string;
  timestamp: string;
}

// Recent reminder texts (newest first), count-limited rather than time-windowed
// — reminders are infrequent and the point is to look back over past wording.
export async function getReminderTextHistory(limit = 20): Promise<ReminderTextEntry[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('details, timestamp')
      .eq('event_type', 'newsletter_reminder_batch')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to load reminder text history:', error);
      return [];
    }

    return (data || []).map((row) => {
      const d = (row.details || {}) as Record<string, unknown>;
      return {
        subject: typeof d.subject === 'string' ? d.subject : '',
        body: typeof d.body === 'string' ? d.body : '',
        mode: typeof d.mode === 'string' ? d.mode : 'all',
        sent: typeof d.sent === 'number' ? d.sent : 0,
        failed: typeof d.failed === 'number' ? d.failed : 0,
        total: typeof d.total === 'number' ? d.total : 0,
        reply_to: typeof d.reply_to === 'string' ? d.reply_to : undefined,
        timestamp: row.timestamp,
      } as ReminderTextEntry;
    });
  } catch (err) {
    console.error('Error loading reminder text history:', err);
    return [];
  }
}

export function calculateBackoffDelay(attemptCount: number): number {
  if (attemptCount <= 3) return 0;

  // Exponential backoff: 2^(attempt-3) seconds, capped at 300 seconds (5 minutes)
  const delay = Math.pow(2, attemptCount - 3);
  return Math.min(delay, 300);
}

export async function getRecentEditRequestForResident(
  residentId: string,
  timeWindowHours: number = 24
): Promise<{ exists: boolean; sentAt?: Date }> {
  try {
    const cutoffTime = new Date(Date.now() - (timeWindowHours * 60 * 60 * 1000)).toISOString();

    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('timestamp')
      .eq('event_type', 'edit_request_sent')
      .contains('details', { resident_id: residentId })
      .gte('timestamp', cutoffTime)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Failed to check recent edit requests:', error);
      return { exists: false };
    }

    if (data && data.length > 0) {
      return { exists: true, sentAt: new Date(data[0].timestamp) };
    }

    return { exists: false };
  } catch (err) {
    console.error('Error checking recent edit requests:', err);
    return { exists: false };
  }
}
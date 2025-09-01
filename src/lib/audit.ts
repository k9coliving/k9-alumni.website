import { supabaseAdmin } from './supabase';

export type AuditEventType = 
  | 'failed_login'
  | 'successful_login'
  | 'user_added'
  | 'user_modified'
  | 'data_modified'
  | 'password_changed'
  | 'system_error';

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

export function calculateBackoffDelay(attemptCount: number): number {
  if (attemptCount <= 3) return 0;
  
  // Exponential backoff: 2^(attempt-3) seconds, capped at 300 seconds (5 minutes)
  const delay = Math.pow(2, attemptCount - 3);
  return Math.min(delay, 300);
}
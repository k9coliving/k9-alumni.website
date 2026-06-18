import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getActiveSubscribers } from '@/lib/subscribers';
import { getUnassignedSubmissions } from '@/lib/newsletter';
import { getEmailsSentInLast24h, getReminderSendLog } from '@/lib/audit';
import { resendDailyLimit } from '@/lib/resend';
import ReminderClient from './ReminderClient';

export const dynamic = 'force-dynamic';

export default async function ReminderPage() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/admin/newsletter/reminder');
  }

  const [subs, unassigned, sentLast24h, log] = await Promise.all([
    getActiveSubscribers(),
    getUnassignedSubmissions(),
    getEmailsSentInLast24h(),
    getReminderSendLog(),
  ]);

  // Skip subscribers who already posted to the upcoming edition.
  const posted = new Set(unassigned.map((s) => (s.email || '').toLowerCase()).filter(Boolean));
  const recipientCount = subs.filter((s) => !posted.has(s.email.toLowerCase())).length;

  return (
    <ReminderClient
      recipientCount={recipientCount}
      skippedAlreadyPosted={subs.length - recipientCount}
      quota={{ sentLast24h, limit: resendDailyLimit() }}
      defaultReplyTo={process.env.ADMIN_DEFAULT_REPLY_TO || ''}
      log={log}
    />
  );
}

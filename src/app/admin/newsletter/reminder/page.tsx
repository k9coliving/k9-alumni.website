import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getActiveSubscribers } from '@/lib/subscribers';
import { getUnassignedSubmissions, getEffectiveReplyTo } from '@/lib/newsletter';
import { getEmailsSentInLast24h, getReminderSendLog, getReminderTextHistory } from '@/lib/audit';
import { resendDailyLimit } from '@/lib/resend';
import { slackConfigured } from '@/lib/slack';
import ReminderClient from './ReminderClient';

export const dynamic = 'force-dynamic';

export default async function ReminderPage() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/admin/newsletter/reminder');
  }

  const [subs, unassigned, sentLast24h, log, history, replyTo] = await Promise.all([
    getActiveSubscribers(),
    getUnassignedSubmissions(),
    getEmailsSentInLast24h(),
    getReminderSendLog(),
    getReminderTextHistory(),
    getEffectiveReplyTo(),
  ]);

  // Skip subscribers who already posted to the upcoming edition.
  const posted = new Set(unassigned.map((s) => (s.email || '').toLowerCase()).filter(Boolean));
  const recipientCount = subs.filter((s) => !posted.has(s.email.toLowerCase())).length;

  return (
    <ReminderClient
      recipientCount={recipientCount}
      skippedAlreadyPosted={subs.length - recipientCount}
      quota={{ sentLast24h, limit: resendDailyLimit() }}
      replyTo={replyTo}
      log={log}
      history={history}
      slackConfigured={slackConfigured()}
    />
  );
}

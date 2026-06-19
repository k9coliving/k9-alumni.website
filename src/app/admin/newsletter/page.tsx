import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getUnassignedSubmissions, getAllNewsletters, getEffectiveReplyTo } from '@/lib/newsletter';
import { getEmailsSentInLast24h, getLastReminderSentAt } from '@/lib/audit';
import { resendDailyLimit } from '@/lib/resend';
import AdminNewsletterClient from './AdminNewsletterClient';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletter() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/admin/newsletter');
  }

  const [submissions, newsletters, sentLast24h, defaultReplyTo, lastReminderAt] = await Promise.all([
    getUnassignedSubmissions(),
    getAllNewsletters(),
    getEmailsSentInLast24h(),
    getEffectiveReplyTo(),
    getLastReminderSentAt(),
  ]);

  return (
    <AdminNewsletterClient
      submissions={submissions}
      newsletters={newsletters}
      quota={{ sentLast24h, limit: resendDailyLimit() }}
      defaultReplyTo={defaultReplyTo}
      lastReminderAt={lastReminderAt}
    />
  );
}

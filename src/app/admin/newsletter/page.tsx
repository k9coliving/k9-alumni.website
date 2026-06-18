import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getUnassignedSubmissions, getAllNewsletters } from '@/lib/newsletter';
import { getEmailsSentInLast24h } from '@/lib/audit';
import { resendDailyLimit } from '@/lib/resend';
import AdminNewsletterClient from './AdminNewsletterClient';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletter() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login?next=/admin/newsletter');
  }

  const [submissions, newsletters, sentLast24h] = await Promise.all([
    getUnassignedSubmissions(),
    getAllNewsletters(),
    getEmailsSentInLast24h(),
  ]);

  return (
    <AdminNewsletterClient
      submissions={submissions}
      newsletters={newsletters}
      quota={{ sentLast24h, limit: resendDailyLimit() }}
    />
  );
}

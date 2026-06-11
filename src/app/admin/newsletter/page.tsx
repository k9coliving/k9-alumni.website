import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getUnassignedSubmissions, getAllNewsletters } from '@/lib/newsletter';
import { getEmailsSentInLast24h } from '@/lib/audit';
import AdminNewsletterClient from './AdminNewsletterClient';

export const dynamic = 'force-dynamic';

function resendDailyLimit(): number {
  const raw = parseInt(process.env.RESEND_DAILY_LIMIT || '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 100;
}

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

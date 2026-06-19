import { redirect, notFound } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  getNewsletterById,
  getNewsletterSendRecipients,
  getEffectiveReplyTo,
  replyToOf,
} from '@/lib/newsletter';
import { getEmailsSentInLast24h, getNewsletterSendLog } from '@/lib/audit';
import { resendDailyLimit } from '@/lib/resend';
import SendClient from './SendClient';

export const dynamic = 'force-dynamic';

export default async function SendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!(await isAdminAuthenticated())) {
    redirect(`/admin/login?next=/admin/newsletter/${id}/send`);
  }

  const newsletter = await getNewsletterById(id);
  if (!newsletter) notFound();

  const [recipients, sentLast24h, log, replyToFallback] = await Promise.all([
    getNewsletterSendRecipients(newsletter),
    getEmailsSentInLast24h(),
    getNewsletterSendLog(id),
    getEffectiveReplyTo(),
  ]);

  return (
    <SendClient
      newsletter={{
        id: newsletter.id,
        title: newsletter.title,
        token: newsletter.token,
        status: newsletter.status,
        intro_heading: newsletter.intro_heading ?? null,
        intro_text: newsletter.intro_text ?? null,
        header_image_url: newsletter.header_image_url ?? null,
      }}
      recipientCount={recipients.length}
      quota={{ sentLast24h, limit: resendDailyLimit() }}
      replyTo={replyToOf(newsletter) || replyToFallback}
      log={log}
    />
  );
}

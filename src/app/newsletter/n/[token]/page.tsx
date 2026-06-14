import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getNewsletterByToken, getUpcomingEvents } from '@/lib/newsletter';
import NewsletterView from './NewsletterView';

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

// Always fetch fresh: a draft's preview must reflect the live set of unassigned
// submissions, not a cached snapshot.
export const dynamic = 'force-dynamic';

export default async function NewsletterByToken({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const result = await getNewsletterByToken(token);
  if (!result) {
    notFound();
  }

  const { newsletter, submissions } = result;
  const events = await getUpcomingEvents(3);

  // Rendered standalone — no site nav/header/footer. This is opened straight
  // from an email via its token and reads as its own self-contained page.
  return <NewsletterView newsletter={newsletter} submissions={submissions} events={events} />;
}

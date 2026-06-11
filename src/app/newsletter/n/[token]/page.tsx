import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { getNewsletterByToken, type NewsletterSubmissionRecord } from '@/lib/newsletter';

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

// Always fetch fresh: a draft's preview must reflect the live set of unassigned
// submissions, not a cached snapshot.
export const dynamic = 'force-dynamic';

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1">{label}</p>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}

function SubmissionCard({ s }: { s: NewsletterSubmissionRecord }) {
  const photos = s.photo_urls ?? [];

  return (
    <article className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-5">
      <header>
        <h3 className="text-2xl font-bold text-gray-900">{s.name}</h3>
        <p className="text-sm text-gray-500">{s.period_in_k9}</p>
      </header>

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {photos.map((url, i) => (
            <Image
              key={i}
              src={url}
              alt={`Photo ${i + 1} from ${s.name}`}
              width={240}
              height={240}
              className="w-40 h-40 object-cover rounded-lg shadow"
            />
          ))}
        </div>
      )}

      <Field label="What's up" value={s.whats_up} />
      <Field label="Where now" value={s.where_now} />
      <Field label="What do you need help with?" value={s.hold_my_hair} />
      {s.recommendation_link && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1">Recommends</p>
          <a
            href={s.recommendation_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 break-words"
          >
            {s.recommendation_link}
          </a>
          {s.recommendation_context && (
            <p className="text-gray-700 leading-relaxed mt-1 whitespace-pre-line">{s.recommendation_context}</p>
          )}
        </div>
      )}
      <Field label="A K9 happy story" value={s.happy_story} />
    </article>
  );
}

export default async function NewsletterByToken({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const result = await getNewsletterByToken(token);
  if (!result) {
    notFound();
  }

  const { newsletter, submissions } = result;

  return (
    <Layout>
      <div
        className="min-h-screen relative"
        style={{
          background:
            'radial-gradient(circle at 10px 10px, rgba(156, 163, 175, 0.15) 1px, transparent 1px)',
          backgroundColor: '#f9fafb',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {newsletter.status === 'draft' && (
            <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 text-center">
              Preview — this newsletter hasn&apos;t been sent yet. It shows the contributions collected so far.
            </div>
          )}

          <div className="page-header">
            <h1 className="page-header-title">{newsletter.title}</h1>
            <div className="page-header-divider"></div>
            {newsletter.intro_text && (
              <p className="page-header-subtitle whitespace-pre-line">{newsletter.intro_text}</p>
            )}
          </div>

          {submissions.length > 0 ? (
            <div className="space-y-10">
              {submissions.map((s) => (
                <SubmissionCard key={s.id} s={s} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">No contributions yet.</p>
          )}

          {newsletter.outro_text && (
            <div className="mt-12 text-center">
              <div className="page-header-divider"></div>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{newsletter.outro_text}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

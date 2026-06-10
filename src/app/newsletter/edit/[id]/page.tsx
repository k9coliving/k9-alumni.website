'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import NewsletterForm, {
  type NewsletterFormPayload,
  type NewsletterFormValues,
} from '@/components/NewsletterForm';

interface PublicSubmission {
  name: string;
  period_in_k9: string;
  whats_up: string;
  where_now: string | null;
  hold_my_hair: string | null;
  email: string | null;
  recommendation_link: string | null;
  recommendation_context: string | null;
  happy_story: string | null;
  photo_urls: string[];
  notify_for_next_newsletter: boolean;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'editable'; values: NewsletterFormValues }
  | { kind: 'saved' }
  | { kind: 'already_sent'; viewUrl: string | null }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };

// Maps the API's nullable public submission onto the form's all-string shape.
function toFormValues(s: PublicSubmission): NewsletterFormValues {
  return {
    name: s.name,
    period_in_k9: s.period_in_k9,
    whats_up: s.whats_up,
    where_now: s.where_now ?? '',
    hold_my_hair: s.hold_my_hair ?? '',
    email: s.email ?? '',
    recommendation_link: s.recommendation_link ?? '',
    recommendation_context: s.recommendation_context ?? '',
    happy_story: s.happy_story ?? '',
    notify_for_next_newsletter: s.notify_for_next_newsletter,
    photo_urls: s.photo_urls ?? [],
  };
}

function EditContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const token = searchParams.get('token') ?? '';

  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!token) {
        setState({ kind: 'not_found' });
        return;
      }
      try {
        const res = await fetch(`/api/newsletter/submit/${id}?token=${encodeURIComponent(token)}`);
        if (cancelled) return;

        if (res.status === 404) {
          setState({ kind: 'not_found' });
          return;
        }
        if (res.status === 409) {
          const data = await res.json().catch(() => ({}));
          setState({ kind: 'already_sent', viewUrl: data.viewUrl ?? null });
          return;
        }
        if (!res.ok) {
          setState({ kind: 'error', message: 'Failed to load your submission. Please try again.' });
          return;
        }

        const data = await res.json();
        setState({ kind: 'editable', values: toFormValues(data.submission) });
      } catch {
        if (!cancelled) {
          setState({ kind: 'error', message: 'Failed to load your submission. Please try again.' });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const handleSave = useCallback(
    async (payload: NewsletterFormPayload) => {
      const res = await fetch(`/api/newsletter/submit/${id}?token=${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setState({ kind: 'already_sent', viewUrl: data.viewUrl ?? null });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save changes. Please try again.');
      }

      setState({ kind: 'saved' });
    },
    [id, token]
  );

  const card = 'bg-white rounded-2xl shadow-lg p-8 text-center space-y-4';

  if (state.kind === 'loading') {
    return <div className={card}><p className="text-gray-500">Loading your submission…</p></div>;
  }

  if (state.kind === 'not_found') {
    return (
      <div className={card}>
        <div className="text-5xl">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900">We couldn&apos;t find that submission</h2>
        <p className="text-gray-600">
          This edit link looks invalid or has expired. If you submitted recently, check the email we
          sent you for the correct link.
        </p>
        <a href="/newsletter/submit" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
          Make a new submission →
        </a>
      </div>
    );
  }

  if (state.kind === 'already_sent') {
    return (
      <div className={card}>
        <div className="text-5xl">📬</div>
        <h2 className="text-2xl font-bold text-gray-900">This newsletter has already gone out</h2>
        <p className="text-gray-600">
          Your submission is now part of a published newsletter, so it can&apos;t be edited anymore.
        </p>
        {state.viewUrl && (
          <a href={state.viewUrl} className="inline-block text-blue-600 hover:text-blue-700 font-medium">
            Read the newsletter →
          </a>
        )}
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className={card}>
        <div className="text-5xl">😕</div>
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
        <p className="text-gray-600">{state.message}</p>
      </div>
    );
  }

  if (state.kind === 'saved') {
    return (
      <div className={card}>
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-900">Changes saved</h2>
        <p className="text-gray-600">Your submission has been updated. Thanks!</p>
        <a href="/newsletter" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
          ← Back to the newsletter page
        </a>
      </div>
    );
  }

  return <NewsletterForm initialValues={state.values} submitText="Save changes" onSubmit={handleSave} />;
}

export default function NewsletterEdit() {
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
          <div className="page-header">
            <h1 className="page-header-title">Edit your news</h1>
            <div className="page-header-divider"></div>
            <p className="page-header-subtitle">
              Update your contribution any time before the newsletter goes out.
            </p>
          </div>

          <Suspense fallback={<div className="bg-white rounded-2xl shadow-lg p-8 text-center"><p className="text-gray-500">Loading…</p></div>}>
            <EditContent />
          </Suspense>
        </div>
      </div>
    </Layout>
  );
}

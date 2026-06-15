'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import NewsletterForm, {
  type NewsletterFormPayload,
  type NewsletterFormValues,
} from '@/components/NewsletterForm';
import type { NewsletterPhoto } from '@/lib/newsletter';

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
  photos: NewsletterPhoto[];
  notify_for_next_newsletter: boolean;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'editable'; values: NewsletterFormValues }
  // Carries the freshly-saved values so "Continue editing" can re-open the form
  // pristine with the latest content.
  | { kind: 'saved'; values: NewsletterFormValues }
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
    photos: s.photos ?? [],
  };
}

function EditContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const token = searchParams.get('token') ?? '';

  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

      // Keep the saved values so the user can continue editing from where they
      // left off, falling back to what they just submitted if the response is
      // missing the echoed submission for any reason.
      const data = await res.json().catch(() => ({}));
      const savedValues = data.submission ? toFormValues(data.submission) : payload;
      setState({ kind: 'saved', values: savedValues });
    },
    [id, token]
  );

  const card = 'max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center space-y-4';

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
    const savedValues = state.values;
    return (
      <div className={card}>
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-900">Changes saved</h2>
        <p className="text-gray-600">Your submission has been updated. Thanks!</p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setDirty(false);
              setState({ kind: 'editable', values: savedValues });
            }}
            className="btn-primary px-5 py-2"
          >
            ← Back to editing
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {dirty && (
        <div className="sticky top-0 z-40 mb-6 animate-fadeInUp">
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-md">
            <span aria-hidden className="text-lg leading-none">💡</span>
            <p className="flex-1 text-sm font-medium text-blue-900">You have unsaved changes.</p>
            <button
              type="submit"
              form="newsletter-edit-form"
              disabled={submitting}
              className="btn-primary shrink-0 px-4 py-1.5 text-sm disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
      <NewsletterForm
        formId="newsletter-edit-form"
        initialValues={state.values}
        submitText="Save changes"
        onSubmit={handleSave}
        onDirtyChange={setDirty}
        onSubmittingChange={setSubmitting}
      />
    </>
  );
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="page-header max-w-2xl mx-auto">
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

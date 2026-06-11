'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import NewsletterForm, { type NewsletterFormPayload } from '@/components/NewsletterForm';

interface SubmitResult {
  editUrl: string;
  emailed: boolean;
}

export default function NewsletterSubmit() {
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (payload: NewsletterFormPayload) => {
    const res = await fetch('/api/newsletter/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to submit. Please try again.');
    }

    const data = await res.json();
    // Honeypot-tripped submissions return { success: true } with no editUrl —
    // show the same friendly confirmation so bots learn nothing.
    setResult({ editUrl: data.editUrl ?? '', emailed: !!data.emailed });
  };

  const copyEditLink = async () => {
    if (!result?.editUrl) return;
    try {
      await navigator.clipboard.writeText(result.editUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link is visible on-screen as a fallback.
    }
  };

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
            <h1 className="page-header-title">Once a K9er, Always a K9er</h1>
            <div className="page-header-divider"></div>
            <div className="page-header-subtitle space-y-4">
              <p>K9 is hard to explain. But we know you know.</p>
              <p>And that&apos;s a feeling we do not want to lose, even if we have left the house.</p>
              <p>Let&apos;s keep track of each other and make sure our paths keep crossing.</p>
              <p>
                XoXo,
                <br />
                Coliving Girl, your one and only source into the fabulous life of Alumni.
              </p>
              <p>
                K9 newsletter by and for K9ers, mostly aimed at alumni but current residents are
                very welcome to join! Share with us what you&apos;ve been up to, and find out where
                other current and past K9ers&apos; lives are taking them.
              </p>
            </div>
          </div>

          {result ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
              <div className="text-5xl">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900">Thank you for sharing!</h2>
              <p className="text-gray-600">
                We&apos;ve received your contribution to the next K9 newsletter.
              </p>

              {result.emailed && (
                <p className="text-gray-600">
                  We&apos;ve emailed you a link so you can edit it any time before the newsletter
                  goes out.
                </p>
              )}

              {result.editUrl && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-gray-500">
                    Want to change something later? Keep this edit link safe:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                    <input
                      type="text"
                      readOnly
                      value={result.editUrl}
                      className="form-input flex-1 text-sm"
                      onFocus={(e) => e.target.select()}
                    />
                    <button type="button" onClick={copyEditLink} className="btn-primary px-4 py-2 whitespace-nowrap">
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                </div>
              )}

              <a href="/newsletter" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
                ← Back to the newsletter page
              </a>
            </div>
          ) : (
            <NewsletterForm submitText="Share my news" onSubmit={handleSubmit} />
          )}
        </div>
      </div>
    </Layout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import NewsletterCallToAction from '@/components/NewsletterCallToAction';
import { FONT_HAND, PALETTE } from '@/components/newsletter/theme';

// Newsletter-aligned design tokens (shared with the landing, who-are-we, and
// K9 Family pages).
const C = {
  bg: '#FAF6F0',
  ink: '#1B2A41',
  accent: '#E1564D',
  body: '#6F695F',
};
const SERIF = 'var(--font-dm-serif), "DM Serif Display", serif';
const BODY = 'var(--font-nunito), "Nunito", system-ui, sans-serif';

// Playful icon that peeks from the corner of a quote's photo. Kept sparse — only
// every 3rd card gets one — so it stays a delight rather than clutter. Which icon
// is picked deterministically from the quote id, so it stays stable across
// renders (same set the K9 Family directory uses for its decorative badges).
const PHOTO_ICONS = ['heart-pink', 'mug', 'plant', 'airplane', 'camera', 'envelope', 'cat', 'dog-newspaper', 'bird'];
function photoIcon(id: string, index: number): string | null {
  if (index % 3 !== 0) return null;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PHOTO_ICONS[h % PHOTO_ICONS.length];
}

// Hand-drawn wavy underline, matching the who-are-we section dividers.
function WavyDivider({ className = '' }: { className?: string }) {
  return (
    <svg width="120" height="13" viewBox="0 0 120 13" fill="none" aria-hidden="true" className={className}>
      <path d="M3 8 Q 32 2 60 7 T 117 6" stroke={C.accent} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || name;

interface NewsletterQuote {
  id: string;
  resident_uuid: string | null;
  name: string;
  image_url: string | null;
  effective_image_url: string | null;
  quote: string;
  created_at: string;
  updated_at: string;
  residents?: {
    photo_url: string | null;
  };
}

export default function Newsletter() {
  const [quotes, setQuotes] = useState<NewsletterQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await fetch('/api/newsletter-quotes');
        if (response.ok) {
          const data = await response.json();
          setQuotes(data);
        }
      } catch (error) {
        console.error('Error fetching newsletter quotes:', error);
      } finally {
        setQuotesLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  return (
    <Layout>
      <div className="min-h-screen" style={{ backgroundColor: C.bg, fontFamily: BODY, color: C.ink }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="page-header !mb-10 flex flex-col items-center">
            <h1
              className="m-0"
              style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(52px,10vw,108px)', lineHeight: 0.98, letterSpacing: '-1px', color: C.ink }}
            >
              Newsletter
            </h1>
            <WavyDivider className="mt-3 mb-7" />
            <div className="max-w-3xl mx-auto text-left space-y-4">
              <p style={{ fontFamily: BODY, fontSize: '18px', lineHeight: 1.7, color: C.body }}>
                Remember those late-night kitchen conversations and weekend catch-ups that made K9 feel like home? Our quarterly newsletter brings that same energy to your inbox, sharing the adventures, milestones, and everyday moments of our extended K9 family.
              </p>
              <p style={{ fontFamily: BODY, fontSize: '18px', lineHeight: 1.7, color: C.body }}>
                We&apos;ll give you a heads-up a week before each newsletter goes out, so you can share whatever feels right—big news, small wins, or just letting everyone know where life has taken you lately. Both alumni and current residents are welcome to share, and we&apos;ll add you to the list when you join the resident list on The K9 Family. Staying connected should feel as natural as it did when we all lived under the same roof. ❤️
              </p>
            </div>
          </div>

          {/* Newsletter Quotes Section */}
          <div className="mb-16">
            <div className="flex flex-col items-center mb-10">
              <h2 className="text-4xl sm:text-5xl text-center m-0" style={{ fontFamily: SERIF, fontWeight: 400, color: C.ink }}>
                Letters from the past
              </h2>
              <WavyDivider className="mt-3" />
            </div>

            {quotesLoading ? (
              <div className="text-center py-12 space-y-6">
                <p style={{ fontFamily: BODY, color: C.body }}>Loading community updates...</p>
                <a
                  href="/newsletter/submit"
                  className="inline-block px-7 py-3 rounded-full font-semibold text-white transition-colors hover:brightness-95"
                  style={{ fontFamily: BODY, background: C.accent }}
                >
                  Write your news
                </a>
              </div>
            ) : quotes.length > 0 ? (
              <div className="space-y-7">
                {quotes.map((quote, index) => {
                  const palette = PALETTE[index % PALETTE.length];
                  const icon = photoIcon(quote.id, index);

                  return (
                    <div key={quote.id}>
                      <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 44px -32px rgba(22,41,76,0.32)' }}>
                        <div style={{ height: '7px', background: palette.accent }} />
                        <div style={{ padding: '26px 28px 28px' }}>
                          {/* Photo floats beside the letter, stacks above it on narrow
                              screens. When there's no photo, the letter takes full width. */}
                          {quote.effective_image_url && (
                            <div className="k9-member-photo" style={{ position: 'relative' }}>
                              <div style={{ borderRadius: '18px', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(22,41,76,0.05)' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={quote.effective_image_url} alt={`${quote.name} profile photo`} className="k9-photo-img" />
                              </div>
                              {icon && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={`/${icon}.png`} alt="" aria-hidden="true" className="nl-floaty" style={{ position: 'absolute', bottom: '-18px', left: '-18px', width: '64px', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(22,41,76,0.2))', zIndex: 2, pointerEvents: 'none' }} />
                              )}
                            </div>
                          )}

                          {/* Oversized opening quote mark in the card's accent colour. */}
                          <div aria-hidden="true" style={{ fontFamily: SERIF, fontSize: '64px', lineHeight: 0.5, color: palette.soft, marginTop: '8px' }}>
                            &ldquo;
                          </div>

                          {/* Letter body */}
                          <div style={{ margin: '6px 0 0' }}>
                            {quote.quote.split('\n').filter(para => para.trim()).map((paragraph, idx) => (
                              <p key={idx} style={{ fontSize: '17px', lineHeight: 1.7, color: '#3a4a66', margin: idx === 0 ? 0 : '12px 0 0' }}>
                                {paragraph}
                              </p>
                            ))}
                          </div>

                          {/* Signature */}
                          <div style={{ fontFamily: FONT_HAND, fontWeight: 700, fontSize: '32px', color: palette.deep, lineHeight: 1, marginTop: '18px' }}>
                            — {firstNameOf(quote.name)}
                          </div>

                          <div style={{ clear: 'both' }} />
                        </div>
                      </div>

                      {/* Show call-to-action after the third letter */}
                      {index === 2 && (
                        <NewsletterCallToAction className="mt-7" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p style={{ fontFamily: BODY, color: C.body }}>No community updates yet.</p>
              </div>
            )}

            {/* Show call-to-action after all quotes */}
            {!quotesLoading && quotes.length > 1 && (
              <NewsletterCallToAction className="mt-7" />
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { FONT_HAND, PALETTE, type Palette } from '@/components/newsletter/theme';

const SERIF = 'var(--font-dm-serif), "DM Serif Display", serif';
const BODY = 'var(--font-nunito), "Nunito", system-ui, sans-serif';

// Hand-drawn squiggly divider between entries, matching the site dividers.
function WavyDivider() {
  return (
    <div className="flex justify-center my-10">
      <svg width="90" height="11" viewBox="0 0 120 13" fill="none" aria-hidden="true">
        <path d="M3 8 Q 32 2 60 7 T 117 6" stroke="#D8CFC0" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Playful icon that peeks from the corner of a request's photo. Kept sparse —
// only every 3rd card gets one — so it stays a delight rather than clutter. Which
// icon is picked deterministically from the tip id, so it stays stable across
// renders (same set the newsletter / tips pages use for their decorative badges).
const PHOTO_ICONS = ['heart-pink', 'mug', 'plant', 'airplane', 'camera', 'envelope', 'cat', 'dog-newspaper', 'bird'];
function photoIcon(id: string, index: number): string | null {
  if (index % 3 !== 0) return null;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PHOTO_ICONS[h % PHOTO_ICONS.length];
}

// A larger decorative critter/plant that peeks from the margin beside each post.
// Picked deterministically from the id so it stays stable across renders.
const POST_DECOR = ['bird', 'cat-in-window', 'cat', 'plant'];
function postDecor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  // Shift the hash so it doesn't always agree with photoIcon's pick.
  return POST_DECOR[(h >> 3) % POST_DECOR.length];
}

interface Tip {
  id: string;
  submitter_name: string;
  title: string;
  description: string;
  external_link?: string;
  image_url?: string;
  image_alt?: string;
  is_hold_my_hair: boolean;
  priority: number;
  created_at: string;
}

interface HoldMyHairTipsListProps {
  refreshTrigger?: number;
}

interface HoldMyHairCardProps {
  tip: Tip;
  palette: Palette;
  index: number;
}

function HoldMyHairCard({ tip, palette, index }: HoldMyHairCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const icon = photoIcon(tip.id, index);

  return (
    <div>
      {/* Photo floats beside the request, stacks above it on narrow screens.
          When there's no image, the request simply takes full width. */}
      {tip.image_url && (
        <div className="k9-member-photo" style={{ position: 'relative' }}>
          <div style={{ borderRadius: '18px', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(22,41,76,0.05)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tip.image_url} alt={tip.image_alt || `Image for ${tip.title}`} className="k9-photo-img" />
          </div>
          {icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/${icon}.png`} alt="" aria-hidden="true" className="nl-floaty" style={{ position: 'absolute', bottom: '-18px', left: '-18px', width: '64px', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(22,41,76,0.2))', zIndex: 2, pointerEvents: 'none' }} />
          )}
        </div>
      )}

      {/* Title — a quiet one-line summary, not a heading — with the date after
          it, separated by a middot (as on the admin newsletter submissions). */}
      <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: '14px', color: '#9aa3b2', margin: '0 0 14px', lineHeight: 1.4 }}>
        {tip.title && <>{tip.title} · </>}
        {formatDate(tip.created_at)}
      </p>

      {/* Description — the main thing to catch the eye, in the handwritten font
          and the entry's accent colour. */}
      <div>
        {tip.description.split('\n').filter(para => para.trim()).map((paragraph, idx) => (
          <p key={idx} style={{ fontFamily: FONT_HAND, fontSize: '27px', lineHeight: 1.35, color: palette.deep, fontWeight: 600, margin: idx === 0 ? 0 : '8px 0 0' }}>{paragraph}</p>
        ))}
      </div>

      {/* External Link */}
      {tip.external_link && (
        <div style={{ marginTop: '14px' }}>
          <a
            href={tip.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
            style={{ color: palette.deep, wordBreak: 'break-all' }}
          >
            {(() => {
              const link = tip.external_link;
              // Handle mailto links
              if (link.startsWith('mailto:')) {
                const email = link.substring(7); // Remove 'mailto:' prefix
                return email.length > 50 ? email.substring(0, 50) + '...' : email;
              }
              // Handle regular URLs
              return link.length > 50 ? link.substring(0, 50) + '...' : link;
            })()}
          </a>
        </div>
      )}

      {/* Signature */}
      <div className="flex justify-end" style={{ marginTop: '16px' }}>
        <span style={{ fontFamily: FONT_HAND, fontWeight: 700, fontSize: '30px', color: palette.deep, lineHeight: 1 }}>— {tip.submitter_name}</span>
      </div>

      <div style={{ clear: 'both' }} />
    </div>
  );
}

export default function HoldMyHairTipsList({ refreshTrigger }: HoldMyHairTipsListProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await fetch('/api/tips-and-requests?type=holdmyhair');
        if (!response.ok) {
          throw new Error('Failed to fetch tips');
        }
        const data = await response.json();
        setTips(data);
      } catch (error) {
        console.error('Error fetching Hold My Hair tips:', error);
        setError('Failed to load support requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="text-center py-12" style={{ fontFamily: BODY }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#E1564D' }}></div>
        <p className="mt-4" style={{ color: '#6F695F' }}>Loading support requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" style={{ fontFamily: BODY }}>
        <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="font-medium hover:underline"
          style={{ color: '#E1564D' }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div className="text-center py-12" style={{ fontFamily: BODY }}>
        <div className="text-6xl mb-4">💕</div>
        <h3 className="text-2xl mb-2" style={{ fontFamily: SERIF, fontWeight: 400, color: '#1B2A41' }}>No support requests yet</h3>
        <p style={{ color: '#6F695F' }}>Be the first to share what you&apos;re going through or offer support to the community!</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {tips.map((tip, index) => {
        const decor = postDecor(tip.id);
        const onRight = index % 2 === 0;
        return (
          <div key={tip.id}>
            {index > 0 && <WavyDivider />}
            {/* Decorative critter peeking from the margin — only where there's
                room for it (hidden on narrower viewports). */}
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/${decor}.png`}
                alt=""
                aria-hidden="true"
                className="hidden lg:block"
                style={{
                  position: 'absolute',
                  top: '4px',
                  width: '108px',
                  height: 'auto',
                  filter: 'drop-shadow(0 6px 10px rgba(22,41,76,0.15))',
                  zIndex: 0,
                  pointerEvents: 'none',
                  ...(onRight ? { right: '-128px' } : { left: '-128px' }),
                }}
              />
              <HoldMyHairCard tip={tip} palette={PALETTE[index % PALETTE.length]} index={index} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
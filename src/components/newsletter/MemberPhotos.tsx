'use client';

import { type HTMLAttributes, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { NewsletterPhoto } from '@/lib/newsletter';
import { ASSETS, type Palette } from './theme';

const POLAROID_ROTATIONS = ['-5deg', '4deg', '-3deg', '5deg'];

// Floated photos for a life-update card: a big full-width lead photo (shown in
// full, never cropped) plus a strip of rotated "polaroids". Floats right so the
// story flows beside, then under, it; stacks above the text on narrow screens
// (see .nl-member-photos). When `zoomable`, clicking any photo opens a
// full-screen lightbox with prev/next + keyboard controls.
export default function MemberPhotos({
  photos,
  name,
  palette,
  cameraOn,
  unoptimized,
  stacked,
  zoomable = true,
}: {
  photos: NewsletterPhoto[];
  name: string;
  palette: Palette;
  cameraOn?: number;
  unoptimized?: boolean;
  stacked?: boolean;
  zoomable?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const count = photos.length;

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir: number) => setOpenIndex((i) => (i === null ? i : (i + dir + count) % count)),
    [count]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, close, step]);

  if (count === 0) return null;
  const lead = photos[0];
  const rest = photos.slice(1, 5);

  // Click/keyboard props that open the lightbox at a given photo index.
  const openProps = (index: number): HTMLAttributes<HTMLDivElement> =>
    zoomable
      ? {
          role: 'button',
          tabIndex: 0,
          'aria-label': `View photo ${index + 1} from ${name} larger`,
          onClick: () => setOpenIndex(index),
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpenIndex(index);
            }
          },
        }
      : {};

  const zoomCursor = zoomable ? 'zoom-in' : undefined;

  return (
    <div className={stacked ? 'nl-member-photos nl-member-photos-stacked' : 'nl-member-photos'}>
      <div
        {...openProps(0)}
        style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          background: palette.soft,
          boxShadow: 'inset 0 0 0 1px rgba(22,41,76,0.05)',
          cursor: zoomCursor,
        }}
      >
        {/* The lead photo is shown in full at its natural aspect — never
            cropped — so a portrait stays tall and a landscape stays wide. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lead.url} alt={`Photo from ${name}`} style={{ display: 'block', width: '100%', height: 'auto' }} />
        {cameraOn === 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${ASSETS}/camera.png`} alt="" style={{ position: 'absolute', top: '11px', right: '12px', width: '42px', height: 'auto', filter: 'drop-shadow(0 3px 5px rgba(22,41,76,0.18))', transform: 'rotate(-5deg)', zIndex: 2 }} />
        )}
      </div>

      {rest.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '18px', paddingLeft: '6px' }}>
          {rest.map((photo, i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                padding: '7px',
                borderRadius: '5px',
                boxShadow: '0 9px 18px -10px rgba(22,41,76,0.42)',
                transform: `rotate(${POLAROID_ROTATIONS[i % POLAROID_ROTATIONS.length]})`,
              }}
            >
              <div
                {...openProps(i + 1)}
                style={{ position: 'relative', width: '94px', height: '78px', borderRadius: '3px', overflow: 'hidden', background: palette.soft, cursor: zoomCursor }}
              >
                <Image src={photo.url} alt={`Photo ${i + 2} from ${name}`} fill sizes="94px" unoptimized={unoptimized} style={{ objectFit: 'cover', objectPosition: photo.focus ?? 'center' }} />
                {cameraOn === i + 1 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${ASSETS}/camera.png`} alt="" style={{ position: 'absolute', top: '6px', right: '6px', width: '25px', height: 'auto', filter: 'drop-shadow(0 2px 4px rgba(22,41,76,0.18))', transform: 'rotate(-5deg)', zIndex: 2 }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {openIndex !== null &&
        createPortal(
          <div
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={`Photo from ${name}`}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(8,12,24,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              style={{ position: 'absolute', top: '16px', right: '20px', width: '44px', height: '44px', borderRadius: '999px', border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', fontSize: '26px', lineHeight: 1, cursor: 'pointer' }}
            >
              ×
            </button>

            {count > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                aria-label="Previous photo"
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '48px', height: '48px', borderRadius: '999px', border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', fontSize: '30px', lineHeight: 1, cursor: 'pointer' }}
              >
                ‹
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[openIndex].url}
              alt={`Photo ${openIndex + 1} from ${name}`}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 24px 70px rgba(0,0,0,0.55)' }}
            />

            {count > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(1); }}
                aria-label="Next photo"
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '48px', height: '48px', borderRadius: '999px', border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', fontSize: '30px', lineHeight: 1, cursor: 'pointer' }}
              >
                ›
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

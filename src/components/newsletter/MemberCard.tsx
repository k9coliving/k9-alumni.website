import Image from 'next/image';
import type { NewsletterSubmissionRecord, NewsletterPhoto } from '@/lib/newsletter';
import { FONT_DISPLAY, FONT_HAND, INK, ASSETS, firstNameOf, type Palette } from './theme';

// ---------------------------------------------------------------------------
// A single member's life-update card. Shared by the public newsletter view and
// the submission form's live preview. In `preview` mode it renders without the
// camera badges and without a DOM id (no jump-to-member anchor), and images go
// through next/image unoptimized so freshly-picked blob: URLs render.
// ---------------------------------------------------------------------------

const POLAROID_ROTATIONS = ['-5deg', '4deg', '-3deg', '5deg'];

// Which photo (if any) gets the little camera badge, keyed by card position.
// Kept deliberately sparse — not every member, not every photo — and repeats
// every 6 cards. Mirrors the original design's camera placement.
const CAMERA_FOR: Record<number, number> = { 0: 0, 1: 3, 3: 2, 5: 1 };
const cameraPhotoFor = (cardIndex: number): number | undefined => CAMERA_FOR[cardIndex % 6];

// Floated photos: a big full-width lead photo (shown in full, never cropped)
// plus a strip of rotated "polaroids". Floats right so the story flows beside,
// then under, it. Stacks above the text on narrow screens (see .nl-member-photos).
function MemberPhotos({
  photos,
  name,
  palette,
  cameraOn,
  unoptimized,
  stacked,
}: {
  photos: NewsletterPhoto[];
  name: string;
  palette: Palette;
  cameraOn?: number;
  unoptimized?: boolean;
  // Force the photos to stack above the text (instead of floating beside it),
  // regardless of viewport — used by the narrow live-preview column.
  stacked?: boolean;
}) {
  if (photos.length === 0) return null;
  const lead = photos[0];
  const rest = photos.slice(1, 5);

  return (
    <div className={stacked ? 'nl-member-photos nl-member-photos-stacked' : 'nl-member-photos'}>
      <div
        style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          background: palette.soft,
          boxShadow: 'inset 0 0 0 1px rgba(22,41,76,0.05)',
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
              <div style={{ position: 'relative', width: '94px', height: '78px', borderRadius: '3px', overflow: 'hidden', background: palette.soft }}>
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
    </div>
  );
}

function MemberBlurb({ label, value, palette }: { label: string; value: string; palette: Palette }) {
  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: palette.deep, marginBottom: '5px' }}>
        {label}
      </div>
      <p style={{ fontSize: '15.5px', lineHeight: 1.62, color: '#3a4a66', margin: 0, whiteSpace: 'pre-line' }}>{value}</p>
    </div>
  );
}

const isUrl = (v: string) => /^https?:\/\//i.test(v.trim());
const prettyUrl = (v: string) => v.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');

// Renders a recommendation: the recommendation itself (recommendation_link —
// often a URL, sometimes just a title) as a smart link, with the description
// (recommendation_context) shown beneath it. Either field may be missing.
export function RecommendationBody({ link, context }: { link?: string | null; context?: string | null }) {
  const primary = link || context; // if no link, the description stands alone
  const description = link ? context : null;
  if (!primary) return null;

  const asLink = (v: string, color: string) =>
    isUrl(v) ? (
      <a href={v} target="_blank" rel="noopener noreferrer" style={{ color }}>
        {prettyUrl(v)}
      </a>
    ) : (
      v
    );

  return (
    <>
      {asLink(primary, INK)}
      {description && (
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#5b6b85', marginTop: '5px', lineHeight: 1.5, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
          {asLink(description, '#4a6fae')}
        </div>
      )}
    </>
  );
}

// Little decorative icon that peeks out of the top-right of a recommendation
// box. Both whether it shows (~40% of entries) and which icon are derived
// deterministically from the submission id, so the same result appears on both
// the member card's "Recommends" band and the recommendations board.
const RECOMMEND_ICONS = ['heart-pink', 'heart-blue', 'mug', 'plant', 'mountains', 'airplane', 'camera', 'envelope'];
const RECOMMEND_ICON_CHANCE = 40; // percent

function recommendIcon(id: string): string | null {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  if (h % 100 >= RECOMMEND_ICON_CHANCE) return null;
  return RECOMMEND_ICONS[Math.floor(h / 100) % RECOMMEND_ICONS.length];
}

export function RecommendIcon({ id }: { id: string }) {
  const icon = recommendIcon(id);
  if (!icon) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${ASSETS}/${icon}.png`}
      alt=""
      aria-hidden="true"
      style={{ position: 'absolute', top: '-14px', right: '-10px', width: '38px', height: 'auto', transform: 'rotate(-8deg)', filter: 'drop-shadow(0 4px 6px rgba(22,41,76,0.18))', zIndex: 1, pointerEvents: 'none' }}
    />
  );
}

export interface MemberCardProps {
  s: NewsletterSubmissionRecord;
  palette: Palette;
  // Position in the issue — drives the sparse camera-badge placement.
  index?: number;
  // Live form preview: drop the camera badges + DOM anchor and render images
  // unoptimized so blob: URLs from unsaved uploads display.
  preview?: boolean;
}

export default function MemberCard({ s, palette, index = 0, preview = false }: MemberCardProps) {
  const photos = s.photos ?? [];
  const first = firstNameOf(s.name);
  const cameraOn = preview ? undefined : cameraPhotoFor(index);

  return (
    <div
      id={preview ? undefined : `member-${s.id}`}
      style={{
        background: '#fff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 44px -32px rgba(22,41,76,0.32)',
        marginBottom: '26px',
        scrollMarginTop: '24px',
      }}
    >
      <div style={{ height: '7px', background: palette.accent }} />
      <div style={{ padding: '26px 28px 28px' }}>
        {/* Story flows around the floated photos, then reclaims full width below. */}
        <div>
          <MemberPhotos photos={photos} name={s.name} palette={palette} cameraOn={cameraOn} unoptimized={preview} stacked={preview} />

          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '30px', color: INK, margin: 0, lineHeight: 1.04 }}>
            {s.name}
          </h3>
          {s.where_now && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '9px', fontSize: '15px', fontWeight: 800, color: palette.deep }}>
              <span
                style={{
                  flex: 'none',
                  width: '11px',
                  height: '11px',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(45deg)',
                  background: palette.accent,
                  boxShadow: `0 0 0 3px ${palette.soft}`,
                }}
              />
              <span>{s.where_now}</span>
            </div>
          )}
          {s.period_in_k9 && (
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#6b7890', marginTop: '7px' }}>
              In K9: {s.period_in_k9}
            </div>
          )}
          {s.email && (
            <a
              href={`mailto:${s.email}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginTop: '9px', fontSize: '14px', fontWeight: 700, color: palette.deep, textDecoration: 'none', wordBreak: 'break-all' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ASSETS}/envelope.png`} alt="" style={{ width: '18px', height: 'auto', flex: 'none' }} />
              {s.email}
            </a>
          )}

          <p style={{ fontSize: '16px', lineHeight: 1.68, color: '#3a4a66', margin: '18px 0 0', whiteSpace: 'pre-line' }}>
            {s.whats_up}
          </p>

          <div style={{ fontFamily: FONT_HAND, fontWeight: 700, fontSize: '30px', color: palette.deep, lineHeight: 1, marginTop: '14px' }}>
            — {first}
          </div>

          <div style={{ clear: 'both' }} />
        </div>

        {s.happy_story && <MemberBlurb label="A K9 happy story" value={s.happy_story} palette={palette} />}
        {s.hold_my_hair && <MemberBlurb label="Could use a hand with" value={s.hold_my_hair} palette={palette} />}

        {(s.recommendation_link || s.recommendation_context) && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '14px', background: palette.soft, borderRadius: '16px', padding: '13px 17px', marginTop: '24px' }}>
            <RecommendIcon id={s.id} />
            <div style={{ flex: 'none', fontFamily: FONT_DISPLAY, fontSize: '11px', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', background: palette.accent, padding: '6px 11px', borderRadius: '9px' }}>
              Recommends
            </div>
            <div style={{ fontSize: '15px', color: INK, fontWeight: 800, lineHeight: 1.35, minWidth: 0, wordBreak: 'break-word' }}>
              <RecommendationBody link={s.recommendation_link} context={s.recommendation_context} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

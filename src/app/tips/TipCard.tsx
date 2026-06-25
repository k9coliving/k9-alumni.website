import { FONT_HAND, INK, type Palette } from '@/components/newsletter/theme';

const SERIF = 'var(--font-dm-serif), "DM Serif Display", serif';

// Playful icon that peeks from the corner of a tip's photo. Kept sparse — only
// every 3rd card gets one — so it stays a delight rather than clutter. Which icon
// is picked deterministically from the tip id, so it stays stable across renders
// (same set the newsletter / K9 Family pages use for their decorative badges).
const PHOTO_ICONS = ['heart-pink', 'mug', 'plant', 'airplane', 'camera', 'envelope', 'cat', 'dog-newspaper', 'bird'];
function photoIcon(id: string, index: number): string | null {
  if (index % 3 !== 0) return null;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PHOTO_ICONS[h % PHOTO_ICONS.length];
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

interface TipCardProps {
  tip: Tip;
  palette: Palette;
  index: number;
  hideHoldMyHairBadge?: boolean;
}

export default function TipCard({ tip, palette, index, hideHoldMyHairBadge = false }: TipCardProps) {
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
    <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 44px -32px rgba(22,41,76,0.32)' }}>
      <div style={{ height: '7px', background: palette.accent }} />
      <div style={{ padding: '26px 28px 28px' }}>
        {/* Photo floats beside the tip, stacks above it on narrow screens.
            When there's no image, the tip simply takes full width. */}
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

        {/* Title + date */}
        <h4 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '28px', color: INK, margin: 0, lineHeight: 1.08 }}>{tip.title}</h4>
        <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#6b7890', marginTop: '6px' }}>{formatDate(tip.created_at)}</p>

        {/* Hold My Hair Badge */}
        {tip.is_hold_my_hair && !hideHoldMyHairBadge && (
          <div className="flex items-center gap-2" style={{ marginTop: '12px' }}>
            <span className="text-lg">🔥</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: '#FBE2E4', color: '#C2545E' }}>
              Hold My Hair
            </span>
          </div>
        )}

        {/* Description */}
        <div style={{ margin: '16px 0 0' }}>
          {tip.description.split('\n').filter(para => para.trim()).map((paragraph, idx) => (
            <p key={idx} style={{ fontSize: '16px', lineHeight: 1.68, color: '#3a4a66', margin: idx === 0 ? 0 : '12px 0 0' }}>{paragraph}</p>
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
        <div style={{ fontFamily: FONT_HAND, fontWeight: 700, fontSize: '30px', color: palette.deep, lineHeight: 1, marginTop: '16px', textAlign: 'right' }}>
          — {tip.submitter_name}
        </div>

        <div style={{ clear: 'both' }} />
      </div>
    </div>
  );
}

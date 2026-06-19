// Presentational chrome for the rendered newsletter — the top bar, masthead,
// welcome note, and footer. Extracted from NewsletterView so the public page and
// the admin dashboard live-preview render the exact same markup and can't drift.
//
// These are pure (no hooks, no data fetching), so they work in both the server
// component (NewsletterView) and the client preview (DraftPreview).

import { FONT_DISPLAY, FONT_BODY, FONT_HAND, INK, ASSETS, PALETTE } from './theme';
import type { FeaturedItem } from '@/lib/newsletter';

// Default intro shown when a newsletter has no intro_text of its own. Lives here
// (not inline) so the public view and the dashboard preview share one copy.
export const DEFAULT_INTRO =
  "K9 is hard to explain. But we know you know.\nAnd that's a feeling we do not want to lose, even if we have left the house.\n\nLet's keep track of each other and make sure our paths keep crossing.\n\nThese are updates shared by former K9ers themselves. No edits. If you want to get in touch feel free to do so using the contact provided.";

// Default heading above the intro, shown when a newsletter sets no intro_heading.
export const DEFAULT_INTRO_HEADING = 'Hello again, friends.';

// Per-issue masthead image, falling back to the default gathering photo in
// Supabase storage (storage base URL + a known filename). The private photo is
// never bundled in the repo. NEXT_PUBLIC_SUPABASE_STORAGE_URL is public, so this
// resolves the same way on the server and the client.
export function resolveHeaderImage(headerImageUrl?: string | null): string | null {
  if (headerImageUrl) return headerImageUrl;
  const storageBase = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL;
  return storageBase ? `${storageBase}/newsletter-header.jpg` : null;
}

export function IssueTopBar({ issueLabel }: { issueLabel: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '18px', color: INK }}>K9 Newsletter</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#9aa6bd', letterSpacing: '.14em', textTransform: 'uppercase', marginLeft: '2px' }}>
          Alumni Edition
        </span>
      </div>
      <div style={{ fontSize: '13px', fontWeight: 800, color: '#5B7FD4', letterSpacing: '.08em', textTransform: 'uppercase' }}>{issueLabel}</div>
    </div>
  );
}

export function Masthead({ title, headerImage }: { title: string; headerImage: string | null }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', marginTop: '10px', padding: '26px 6px 18px' }}>
      <div style={{ flex: '1 1 430px', minWidth: '290px' }}>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(40px,6vw,60px)', lineHeight: 0.98, color: INK, margin: '0 0 22px', letterSpacing: '-0.012em', textWrap: 'balance' }}>
          {title}
        </h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F6C44C', borderRadius: '38px 30px 40px 28px / 26px 38px 24px 36px', padding: '9px 26px', boxShadow: '0 12px 24px -14px rgba(231,169,47,0.95)' }}>
          <span style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontWeight: 800, fontSize: '18px', color: '#1c2f54', lineHeight: 1.2 }}>
            Together, we make our community thrive.
          </span>
        </div>
        <p style={{ fontSize: '19px', lineHeight: 1.5, color: '#3a4a66', fontWeight: 600, margin: '20px 0 0', maxWidth: '30ch', textWrap: 'pretty' }}>
          Updates, stories, and highlights from around the K9 family.
        </p>
      </div>

      {/* illustration cluster */}
      <div style={{ flex: '1 1 360px', minWidth: '290px', position: 'relative', height: '380px' }}>
        <div style={{ position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-47%)', width: '320px', height: '290px', background: '#DCE6F7', opacity: 0.65, borderRadius: '46% 54% 57% 43% / 49% 44% 56% 51%' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${ASSETS}/airplane.png`} alt="" className="nl-drift" style={{ position: 'absolute', top: '-18px', right: '6px', width: '120px', height: 'auto', zIndex: 4 }} />
        <div style={{ position: 'absolute', top: '34px', left: '50%', transform: 'translateX(-50%)', width: 'min(420px, 90%)', height: '300px', borderRadius: '26px', overflow: 'hidden', border: '6px solid #fff', boxShadow: '0 18px 30px -6px rgba(22,41,76,0.28)', zIndex: 2, background: 'linear-gradient(135deg, #EAF0FB, #DCE6F7)' }}>
          {headerImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={headerImage} alt="K9 friends gathered together" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% center', display: 'block' }} />
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${ASSETS}/mug.png`} alt="" style={{ position: 'absolute', bottom: '6px', left: 'calc(50% - min(210px, 45%) - 85px)', width: '113px', height: 'auto', filter: 'drop-shadow(0 12px 16px rgba(22,41,76,0.12))', zIndex: 3 }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${ASSETS}/plant.png`} alt="" style={{ position: 'absolute', bottom: '0', right: 'calc(50% - min(210px, 45%) - 45px)', width: '112px', height: 'auto', filter: 'drop-shadow(0 12px 16px rgba(22,41,76,0.12))', zIndex: 3 }} />
      </div>
    </div>
  );
}

export function WelcomeNote({ heading, introText }: { heading?: string | null; introText?: string | null }) {
  return (
    <div style={{ background: '#fff', borderRadius: '24px', padding: '30px 34px', marginTop: '26px', boxShadow: '0 18px 40px -30px rgba(22,41,76,0.3)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-26px', right: '-18px', width: '130px', height: '130px', borderRadius: '50%', background: '#FBEBC2', opacity: 0.55 }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#E7A92F', marginBottom: '8px' }}>A note to begin</div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '30px', color: INK, margin: '0 0 12px', lineHeight: 1.1 }}>{heading?.trim() || DEFAULT_INTRO_HEADING}</h2>
        <p style={{ fontSize: '17px', lineHeight: 1.7, margin: 0, maxWidth: '62ch', textWrap: 'pretty', whiteSpace: 'pre-line' }}>
          {introText || DEFAULT_INTRO}
        </p>
        <div style={{ fontFamily: FONT_HAND, fontSize: '26px', color: '#5B7FD4', marginTop: '16px', lineHeight: 1.1 }}>
          With love,
          <br />
          <span style={{ color: INK }}>— the K9 crew</span>
        </div>
      </div>
    </div>
  );
}

// Group plain text into runs of consecutive lines of the same kind — "quote"
// (lines starting with ">") or "text" — with blank lines breaking the run. Used
// by both the page and email renderers so they treat quotes identically.
function textBlocks(text: string): { type: 'quote' | 'text'; lines: string[] }[] {
  const blocks: { type: 'quote' | 'text'; lines: string[] }[] = [];
  let cur: { type: 'quote' | 'text'; lines: string[] } | null = null;
  for (const line of text.split('\n')) {
    if (line.trim() === '') {
      cur = null;
      continue;
    }
    const isQuote = line.trimStart().startsWith('>');
    const content = isQuote ? line.replace(/^\s*>\s?/, '') : line;
    const type = isQuote ? 'quote' : 'text';
    if (!cur || cur.type !== type) {
      cur = { type, lines: [] };
      blocks.push(cur);
    }
    cur.lines.push(content);
  }
  return blocks;
}

// Lightweight rich text: a run of lines starting with ">" renders as a styled
// pull-quote; everything else as paragraphs. Keeps admin copy plain-text simple
// while allowing a quote anywhere.
function renderRichText(text: string) {
  return textBlocks(text).map((b, i) =>
    b.type === 'quote' ? (
      <blockquote
        key={i}
        style={{ margin: i === 0 ? 0 : '14px 0 0', padding: '6px 0 6px 18px', borderLeft: '4px solid #e5e7eb', fontStyle: 'italic', color: '#46587a', fontSize: '17px', lineHeight: 1.6, whiteSpace: 'pre-line' }}
      >
        {b.lines.join('\n')}
      </blockquote>
    ) : (
      <p key={i} style={{ fontSize: '16px', lineHeight: 1.65, color: '#3a4a66', margin: i === 0 ? 0 : '12px 0 0', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
        {b.lines.join('\n')}
      </p>
    )
  );
}

// Shared by the email renderer too (it can't import from a server bundle cleanly,
// but this module is pure) — exported for newsletterEmail's paragraphs().
export { textBlocks };

// Optional editorial highlights for an issue (book rec, news, anniversary). One
// accent card per item; the card colour cycles through the palette. Shared by the
// public view and the dashboard preview. Renders nothing when there are none.
export function FeaturedSection({ items }: { items: FeaturedItem[] }) {
  if (!items.length) return null;
  return (
    <>
      <div style={{ margin: '50px 0 20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#E7A92F', marginBottom: '7px' }}>
          A few things worth a mention
        </div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '30px', color: INK, margin: 0 }}>From the K9 crew</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {items.map((item, i) => {
          const p = PALETTE[i % PALETTE.length];
          return (
            <div key={i} style={{ background: '#fff', borderRadius: '20px', padding: '22px 24px', boxShadow: '0 16px 38px -28px rgba(22,41,76,0.42)', borderLeft: `5px solid ${p.accent}` }}>
              {item.image_url && (
                // Mirrors a resident post: photo floats beside the text (stacks on
                // narrow screens) and is shown at its full natural aspect, never cropped.
                <div className="nl-member-photos">
                  <div style={{ borderRadius: '18px', overflow: 'hidden', background: p.soft, boxShadow: 'inset 0 0 0 1px rgba(22,41,76,0.05)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt="" style={{ display: 'block', width: '100%', height: 'auto' }} />
                  </div>
                </div>
              )}
              {item.eyebrow && (
                <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: p.deep, marginBottom: '6px' }}>
                  {item.eyebrow}
                </div>
              )}
              <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '22px', color: INK, margin: '0 0 8px', lineHeight: 1.2 }}>
                {item.title}
              </h3>
              {item.body && renderRichText(item.body)}
              <div style={{ clear: 'both' }} />
            </div>
          );
        })}
      </div>
    </>
  );
}

export function NewsletterFooter({ outroText, issueLabel }: { outroText?: string | null; issueLabel: string }) {
  return (
    <div style={{ position: 'relative', marginTop: '60px', padding: '56px 22px 40px', background: '#E3EDD6', overflow: 'hidden' }}>
      <svg viewBox="0 0 980 70" preserveAspectRatio="none" style={{ position: 'absolute', top: '-1px', left: 0, width: '100%', height: '70px', display: 'block' }} aria-hidden="true">
        <path d="M0,40 C160,5 330,5 490,30 C650,55 820,55 980,22 L980,0 L0,0 Z" fill="#FAF4E4" />
      </svg>
      <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${ASSETS}/mountains.png`} alt="" className="nl-footer-deco" style={{ position: 'absolute', left: '17px', bottom: '8px', width: '120px', height: 'auto', opacity: 0.85 }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${ASSETS}/camera.png`} alt="" className="nl-footer-deco" style={{ position: 'absolute', right: '40px', bottom: '10px', width: '74px', height: 'auto', opacity: 0.9, transform: 'rotate(-6deg)' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${ASSETS}/envelope.png`} alt="" className="nl-floaty" style={{ width: '76px', height: 'auto', display: 'inline-block' }} />
        {outroText && (
          <p style={{ fontSize: '17px', lineHeight: 1.7, color: '#3a4a66', fontWeight: 600, margin: '14px auto 0', maxWidth: '60ch', whiteSpace: 'pre-line', textWrap: 'pretty' }}>
            {outroText}
          </p>
        )}
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '32px', color: INK, margin: '14px 0 8px', lineHeight: 1.12, textWrap: 'balance' }}>
          Together, we make our community thrive.
        </h2>
        <p style={{ fontSize: '17px', fontWeight: 600, color: '#557A40', margin: '0 0 22px' }}>Your corner of the world belongs in the next issue.</p>
        <a href="/newsletter/submit" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: INK, color: '#fff', fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '16px', padding: '14px 26px', borderRadius: '999px', textDecoration: 'none', boxShadow: '0 16px 30px -16px rgba(22,41,76,0.7)' }}>
          Share your update <span style={{ fontSize: '18px' }}>→</span>
        </a>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${ASSETS}/heart-pink.png`} alt="" style={{ width: '46px', height: 'auto', display: 'block', margin: '40px auto 0' }} />
        <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#3a4a66', fontWeight: 600, margin: '8px auto 0', maxWidth: '52ch', textWrap: 'pretty' }}>
          Stay connected at{' '}
          <a href="https://alumni.k9coliving.com/" style={{ color: INK, fontWeight: 800, textDecoration: 'underline' }}>
            alumni.k9coliving.com
          </a>
          {' '}— alumni directory, tips &amp; help, and a calendar for events.
          <span style={{ display: 'block', marginTop: '2px', fontSize: '13px', fontWeight: 600, color: '#7FA968' }}>
            password for access on Slack, in the #alumni channel description
          </span>
        </p>
        <div style={{ marginTop: '18px', fontSize: '13px', fontWeight: 700, color: '#7FA968', letterSpacing: '.06em' }}>
          K9 Newsletter · {issueLabel}
        </div>
      </div>
    </div>
  );
}

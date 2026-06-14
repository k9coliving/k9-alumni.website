import Image from 'next/image';
import type {
  NewsletterRecord,
  NewsletterSubmissionRecord,
  NewsletterEventRecord,
} from '@/lib/newsletter';

// ---------------------------------------------------------------------------
// Design tokens (ported from the "Nest" Canva design)
// ---------------------------------------------------------------------------

const FONT_DISPLAY = "var(--font-baloo2), 'Baloo 2', system-ui, sans-serif";
const FONT_BODY = "var(--font-nunito), 'Nunito', system-ui, sans-serif";
const FONT_HAND = "var(--font-caveat), 'Caveat', cursive";

const INK = '#16294C';
const ASSETS = '/newsletter/assets';

interface Palette {
  accent: string;
  soft: string;
  deep: string;
}

const PALETTE: Palette[] = [
  { accent: '#5B7FD4', soft: '#E0E8F8', deep: '#39539E' }, // blue
  { accent: '#E7A92F', soft: '#FBEBC2', deep: '#B97E10' }, // yellow
  { accent: '#EA8088', soft: '#FBE2E4', deep: '#C2545E' }, // pink
  { accent: '#7FA968', soft: '#E3EDD6', deep: '#557A40' }, // green
];

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || name;

// ---------------------------------------------------------------------------
// Section eyebrow + heading
// ---------------------------------------------------------------------------

function SectionHead({ kicker, title, color }: { kicker: string; title: string; color: string }) {
  return (
    <div style={{ margin: '50px 0 20px' }}>
      <div
        style={{
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          color,
          marginBottom: '7px',
        }}
      >
        {kicker}
      </div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '30px', color: INK, margin: 0 }}>
        {title}
      </h2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floated photos for a life-update card: a big 16:10 lead photo plus a strip of
// rotated "polaroids". Floats right so the member's story flows beside, then
// under, it. Stacks above the text on narrow screens (see .nl-member-photos).
// ---------------------------------------------------------------------------

const POLAROID_ROTATIONS = ['-5deg', '4deg', '-3deg', '5deg'];

function MemberPhotos({ photos, name, palette }: { photos: string[]; name: string; palette: Palette }) {
  if (photos.length === 0) return null;
  const lead = photos[0];
  const rest = photos.slice(1, 5);

  return (
    <div className="nl-member-photos">
      <div
        style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          aspectRatio: '16 / 10',
          background: palette.soft,
          boxShadow: 'inset 0 0 0 1px rgba(22,41,76,0.05)',
        }}
      >
        <Image src={lead} alt={`Photo from ${name}`} fill sizes="(max-width: 680px) 100vw, 446px" style={{ objectFit: 'cover' }} />
      </div>

      {rest.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '18px', paddingLeft: '6px' }}>
          {rest.map((url, i) => (
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
                <Image src={url} alt={`Photo ${i + 2} from ${name}`} fill sizes="94px" style={{ objectFit: 'cover' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A single member's life update
// ---------------------------------------------------------------------------

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

function LifeUpdateCard({ s, palette }: { s: NewsletterSubmissionRecord; palette: Palette }) {
  const photos = s.photo_urls ?? [];
  const first = firstNameOf(s.name);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 44px -32px rgba(22,41,76,0.32)',
        marginBottom: '26px',
      }}
    >
      <div style={{ height: '7px', background: palette.accent }} />
      <div style={{ padding: '26px 28px 28px' }}>
        {/* Story flows around the floated photos, then reclaims full width below. */}
        <div>
          <MemberPhotos photos={photos} name={s.name} palette={palette} />

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
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#8390a6', marginTop: '6px' }}>{s.period_in_k9}</div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: palette.soft, borderRadius: '16px', padding: '13px 17px', marginTop: '24px' }}>
            <div style={{ flex: 'none', fontFamily: FONT_DISPLAY, fontSize: '11px', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', background: palette.accent, padding: '6px 11px', borderRadius: '9px' }}>
              Recommends
            </div>
            <div style={{ fontSize: '15px', color: INK, fontWeight: 800, lineHeight: 1.35, minWidth: 0, wordBreak: 'break-word' }}>
              {s.recommendation_link ? (
                <a href={s.recommendation_link} target="_blank" rel="noopener noreferrer" style={{ color: INK }}>
                  {s.recommendation_context || s.recommendation_link}
                </a>
              ) : (
                s.recommendation_context
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save-the-dates row
// ---------------------------------------------------------------------------

function EventRow({ e, palette, last }: { e: NewsletterEventRecord; palette: Palette; last: boolean }) {
  const d = new Date(e.start_datetime);
  const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const meta = [e.location, e.duration].filter(Boolean).join(' · ');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '16px 18px', borderBottom: last ? 'none' : '1px solid #F1ECDC' }}>
      <div style={{ flex: 'none', width: '74px', textAlign: 'center', background: palette.soft, borderRadius: '14px', padding: '9px 0' }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '12px', letterSpacing: '.1em', color: palette.deep }}>{mon}</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '24px', color: INK, lineHeight: 1 }}>{day}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '19px', color: INK }}>{e.title}</div>
        {meta && <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#7a879e', marginTop: '2px' }}>{meta}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function NewsletterView({
  newsletter,
  submissions,
  events,
}: {
  newsletter: NewsletterRecord;
  submissions: NewsletterSubmissionRecord[];
  events: NewsletterEventRecord[];
}) {
  const issueLabel = new Date(newsletter.sent_at || newsletter.created_at || Date.now()).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const landed = submissions.filter((s) => s.where_now);
  const recs = submissions.filter((s) => s.recommendation_link || s.recommendation_context);

  // Per-issue masthead image, falling back to the default gathering photo in
  // Supabase storage (same convention as the team photos / homepage moving
  // image: storage base URL + a known filename). The private photo is never
  // bundled in the repo.
  const storageBase = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL;
  const headerImage = newsletter.header_image_url || (storageBase ? `${storageBase}/newsletter-header.jpg` : null);

  return (
    <div style={{ minHeight: '100vh', background: '#FAF4E4', fontFamily: FONT_BODY, color: '#34466A' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '26px 22px 0' }}>
        {newsletter.status === 'draft' && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 text-center">
            Preview — this newsletter hasn&apos;t been sent yet. It shows the contributions collected so far.
          </div>
        )}

        {/* top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '18px', color: INK }}>K9 Newsletter</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#9aa6bd', letterSpacing: '.14em', textTransform: 'uppercase', marginLeft: '2px' }}>
              Alumni Edition
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#5B7FD4', letterSpacing: '.08em', textTransform: 'uppercase' }}>{issueLabel}</div>
        </div>

        {/* masthead */}
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', marginTop: '10px', padding: '26px 6px 18px' }}>
          <div style={{ flex: '1 1 430px', minWidth: '290px' }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 'clamp(40px,6vw,60px)', lineHeight: 0.98, color: INK, margin: '0 0 22px', letterSpacing: '-0.012em', textWrap: 'balance' }}>
              {newsletter.title}
            </h1>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#F6C44C', borderRadius: '14px', padding: '9px 18px', boxShadow: '0 12px 24px -14px rgba(231,169,47,0.95)' }}>
              <span style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontWeight: 800, fontSize: '18px', color: '#1c2f54', lineHeight: 1.2 }}>
                Together, we make our community thrive.
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ASSETS}/heart-pink.png`} alt="" style={{ width: '25px', height: 'auto', display: 'block', flex: 'none' }} />
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
            <img src={`${ASSETS}/mug.png`} alt="" style={{ position: 'absolute', bottom: '6px', left: 'calc(50% - min(210px, 45%) - 85px)', width: '150px', height: 'auto', filter: 'drop-shadow(0 12px 16px rgba(22,41,76,0.12))', zIndex: 3 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${ASSETS}/plant.png`} alt="" style={{ position: 'absolute', bottom: '0', right: 'calc(50% - min(210px, 45%) - 45px)', width: '112px', height: 'auto', filter: 'drop-shadow(0 12px 16px rgba(22,41,76,0.12))', zIndex: 3 }} />
          </div>
        </div>

        {/* welcome note */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '30px 34px', marginTop: '26px', boxShadow: '0 18px 40px -30px rgba(22,41,76,0.3)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-26px', right: '-18px', width: '130px', height: '130px', borderRadius: '50%', background: '#FBEBC2', opacity: 0.55 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#E7A92F', marginBottom: '8px' }}>A note to begin</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '30px', color: INK, margin: '0 0 12px', lineHeight: 1.1 }}>Hello again, friends.</h2>
            <p style={{ fontSize: '17px', lineHeight: 1.7, margin: 0, maxWidth: '62ch', textWrap: 'pretty', whiteSpace: 'pre-line' }}>
              {newsletter.intro_text ||
                "It's been a while since we all shared a kitchen, but the group chat never really went quiet. This issue is the whole table catching up at once — where everyone landed, what's keeping you busy, and the little things worth passing on. Pour something warm and scroll slow."}
            </p>
            <div style={{ fontFamily: FONT_HAND, fontSize: '26px', color: '#5B7FD4', marginTop: '16px', lineHeight: 1.1 }}>
              With love,
              <br />
              <span style={{ color: INK }}>— the K9 crew</span>
            </div>
          </div>
        </div>

        {submissions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7a879e', padding: '48px 0', fontSize: '17px', fontWeight: 600 }}>No contributions yet.</p>
        ) : (
          <>
            {/* life updates */}
            <SectionHead kicker="The whole table, catching up" title="Life updates" color="#5B7FD4" />
            {submissions.map((s, i) => (
              <LifeUpdateCard key={s.id} s={s} palette={PALETTE[i % PALETTE.length]} />
            ))}

            {/* recommendations board */}
            {recs.length > 0 && (
              <>
                <SectionHead kicker="Worth passing on" title="The recommendations board" color="#E7A92F" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {recs.map((s, i) => {
                    const p = PALETTE[i % PALETTE.length];
                    return (
                      <div key={s.id} style={{ background: '#fff', borderRadius: '18px', padding: '18px 20px', boxShadow: '0 14px 32px -26px rgba(22,41,76,0.4)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 'none', fontFamily: FONT_DISPLAY, fontSize: '11px', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: p.deep, background: p.soft, padding: '6px 10px', borderRadius: '9px' }}>
                          Pick
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '15.5px', fontWeight: 800, color: INK, lineHeight: 1.32, wordBreak: 'break-word' }}>
                            {s.recommendation_link ? (
                              <a href={s.recommendation_link} target="_blank" rel="noopener noreferrer" style={{ color: INK }}>
                                {s.recommendation_context || s.recommendation_link}
                              </a>
                            ) : (
                              s.recommendation_context
                            )}
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#8390a6', marginTop: '3px' }}>
                            — {firstNameOf(s.name)}
                            {s.where_now ? `, ${s.where_now}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* where we landed */}
            {landed.length > 0 && (
              <>
                <SectionHead kicker="Pins on the map" title="Where we all landed" color="#7FA968" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '11px' }}>
                  {landed.map((s, i) => {
                    const p = PALETTE[i % PALETTE.length];
                    return (
                      <div key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#fff', borderRadius: '999px', padding: '9px 17px 9px 13px', boxShadow: '0 10px 24px -20px rgba(22,41,76,0.5)', fontWeight: 800, fontSize: '14.5px', color: INK }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: p.accent, boxShadow: `0 0 0 3px ${p.soft}` }} />
                        {s.where_now}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* save the dates */}
        {events.length > 0 && (
          <>
            <SectionHead kicker="Get it in the calendar" title="Save the dates" color="#EA8088" />
            <div style={{ background: '#fff', borderRadius: '22px', padding: '10px 8px', boxShadow: '0 18px 40px -32px rgba(22,41,76,0.34)' }}>
              {events.map((e, i) => (
                <EventRow key={e.id} e={e} palette={PALETTE[i % PALETTE.length]} last={i === events.length - 1} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* footer */}
      <div style={{ position: 'relative', marginTop: '60px', padding: '56px 22px 40px', background: '#E3EDD6', overflow: 'hidden' }}>
        <svg viewBox="0 0 980 70" preserveAspectRatio="none" style={{ position: 'absolute', top: '-1px', left: 0, width: '100%', height: '70px', display: 'block' }} aria-hidden="true">
          <path d="M0,40 C160,5 330,5 490,30 C650,55 820,55 980,22 L980,0 L0,0 Z" fill="#FAF4E4" />
        </svg>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${ASSETS}/heart-pink.png`} alt="" className="nl-floaty" style={{ width: '46px', height: 'auto', display: 'inline-block' }} />
          {newsletter.outro_text && (
            <p style={{ fontSize: '17px', lineHeight: 1.7, color: '#3a4a66', fontWeight: 600, margin: '14px auto 0', maxWidth: '60ch', whiteSpace: 'pre-line', textWrap: 'pretty' }}>
              {newsletter.outro_text}
            </p>
          )}
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '32px', color: INK, margin: '14px 0 8px', lineHeight: 1.12, textWrap: 'balance' }}>
            Together, we make our community thrive.
          </h2>
          <p style={{ fontSize: '17px', fontWeight: 600, color: '#557A40', margin: '0 0 22px' }}>Your corner of the world belongs in the next issue.</p>
          <a href="/newsletter/submit" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: INK, color: '#fff', fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '16px', padding: '14px 26px', borderRadius: '999px', textDecoration: 'none', boxShadow: '0 16px 30px -16px rgba(22,41,76,0.7)' }}>
            Share your update <span style={{ fontSize: '18px' }}>→</span>
          </a>
          <div style={{ marginTop: '30px', fontSize: '13px', fontWeight: 700, color: '#7FA968', letterSpacing: '.06em' }}>
            K9 Newsletter · {issueLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

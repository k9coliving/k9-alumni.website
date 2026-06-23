import Layout from '@/components/Layout';
import Image from 'next/image';

// Design tokens for the newsletter-aligned landing page (from the handoff design).
const C = {
  bg: '#FAF6F0',
  ink: '#1B2A41',
  accent: '#E1564D',
  body: '#6F695F',
  card: '#FBF7F1',
  cardBorder: '#ECE3D5',
  section: '#F5EEE2',
};

// Public Supabase storage bucket base (e.g. .../object/public/images) — same
// pattern used elsewhere for remote images; host is allowlisted in next.config.ts.
const STORAGE = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL;

const SERIF = 'var(--font-dm-serif), "DM Serif Display", serif';
const BODY = 'var(--font-nunito), "Nunito", system-ui, sans-serif';
const HAND = 'var(--font-caveat), "Caveat", cursive';
// Matches the newsletter's FONT_DISPLAY (Baloo 2) — used for the footer-style goals box.
const DISPLAY = 'var(--font-baloo2), "Baloo 2", system-ui, sans-serif';

const linkStyle = {
  color: C.accent,
  fontWeight: 600,
  textDecoration: 'underline',
  textDecorationColor: 'rgba(225,86,77,.45)',
} as const;

// The six "ways to stay connected". Relocation is still a work in progress
// (disabled in the nav too), so it renders as a non-clickable "coming soon" tile.
const cards = [
  {
    href: '/thek9family',
    img: '/hi_from_windows.png',
    w: 582,
    h: 624,
    maxW: '92%',
    maxH: 118,
    title: 'Meet Alumni',
    body: 'Find and connect with fellow K9ers around the world.',
  },
  {
    href: '/events',
    img: '/calendar.png',
    w: 1357,
    h: 679,
    maxW: '78%',
    maxH: 118,
    blend: true,
    title: 'Upcoming Gatherings',
    body: 'Discover events and casual get-togethers near you.',
  },
  {
    href: '/relocation',
    soon: true,
    img: '/suitcase.png',
    w: 1536,
    h: 1024,
    maxW: '90%',
    maxH: 118,
    title: 'Moving Somewhere New?',
    body: 'Get tips, advice and warm introductions from alumni.',
  },
  {
    href: '/newsletter',
    img: '/envelope.png',
    w: 360,
    h: 305,
    maxW: '62%',
    maxH: 108,
    title: 'Newsletter',
    body: 'Catch up on stories, updates and good news from the pack.',
  },
  {
    href: '/holdmyhair',
    img: '/hands2.png',
    w: 1536,
    h: 1024,
    maxW: '92%',
    maxH: 104,
    title: 'Hold my Hair',
    body: 'Ask the community or lend a helping hand.',
  },
  {
    href: '/tips',
    img: '/lightbulb.png',
    w: 1024,
    h: 1024,
    maxW: '64%',
    maxH: 118,
    title: 'Tips & Offers',
    body: 'Share what you know and find things that might help.',
  },
];

// Hand-drawn underline beneath section headings.
function Squiggle({ width = 120 }: { width?: number }) {
  return (
    <svg width={width} height="13" viewBox="0 0 120 13" fill="none" className="mt-1.5">
      <path d="M3 8 Q 32 2 60 7 T 117 6" stroke={C.accent} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

function CardInner({ card }: { card: (typeof cards)[number] }) {
  return (
    <>
      <div className="flex items-center justify-center mb-3.5" style={{ height: 118 }}>
        <Image
          src={card.img}
          alt=""
          width={card.w}
          height={card.h}
          className="card-img object-contain rounded-2xl"
          style={{
            height: 'auto',
            width: 'auto',
            maxHeight: card.maxH,
            maxWidth: card.maxW,
            mixBlendMode: card.blend ? 'multiply' : undefined,
          }}
        />
      </div>
      <h3 className="mb-1.5" style={{ fontFamily: BODY, fontWeight: 800, fontSize: 20, color: C.ink }}>
        {card.title}
      </h3>
      <p className="flex-1" style={{ fontFamily: BODY, fontSize: 15, lineHeight: 1.5, color: C.body }}>
        {card.body}
      </p>
      <div className="mt-4 leading-none" style={{ fontSize: 22, color: C.accent }}>
        {card.soon ? (
          <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 700, opacity: 0.7 }}>Coming soon</span>
        ) : (
          '→'
        )}
      </div>
    </>
  );
}

export default function Home() {
  const cardClass =
    'flex flex-col rounded-[20px] p-7 pb-6 transition-transform duration-200';
  const cardStyle = {
    background: C.card,
    border: `1px solid ${C.cardBorder}`,
    boxShadow: '0 1px 2px rgba(40,30,20,.03)',
  } as const;

  return (
    <Layout>
      <div style={{ background: C.bg, fontFamily: BODY, color: C.ink }}>
        {/* ===== HERO ===== */}
        <section className="max-w-[1040px] mx-auto px-5 sm:px-14 text-center pt-6 pb-8">
          <h1
            className="m-0"
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: 'clamp(52px,10vw,108px)',
              lineHeight: 0.98,
              letterSpacing: '-1px',
              color: C.ink,
            }}
          >
            Welcome back
            {/* Wrapper carries the downward nudge; the float animation's own
                transform lives on the image, so the two don't clobber each other. */}
            <span className="inline-block align-[-18%] ml-1.5" style={{ transform: 'translateY(15px)' }}>
              <Image
                src="/heart-pink.png"
                alt=""
                width={360}
                height={503}
                className="nl-bob block"
                style={{ height: 'clamp(58px,10vw,112px)', width: 'auto' }}
              />
            </span>
          </h1>
          <p
            className="mx-auto mt-5"
            style={{ fontFamily: BODY, fontSize: 'clamp(16px,2.2vw,20px)', lineHeight: 1.55, opacity: 0.82, maxWidth: 480 }}
          >
            Whether you left last month or five years ago,
            <br />
            you&apos;re still part of the story.
          </p>

          <div className="max-w-[900px] mx-auto mt-4 sm:mt-6">
            <Image
              src="/hero2.png"
              alt="K9 alumni gathered together"
              width={1494}
              height={776}
              priority
              className="w-full h-auto block"
            />
          </div>
        </section>

        {/* ===== INTRO ===== */}
        <section className="max-w-[1040px] mx-auto px-5 sm:px-14 pt-6 sm:pt-10 text-center">
          <p
            className="mx-auto"
            style={{ fontFamily: BODY, fontSize: 'clamp(16px,2vw,19px)', lineHeight: 1.7, color: C.body, maxWidth: 640 }}
          >
            Whether you&apos;ve been a K9er for a few months or many years, moving out is never easy. We are on a
            journey to build a strong alumni network, so the K9 magic lives on, inside and outside the walls of the
            house.
          </p>
        </section>

        {/* ===== WAYS TO STAY CONNECTED ===== */}
        <section className="max-w-[1100px] mx-auto px-5 sm:px-14 pt-8 sm:pt-12">
          <div className="text-center mb-8 sm:mb-10 flex flex-col items-center">
            <h2 className="m-0" style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(30px,5vw,46px)', color: C.ink }}>
              Ways to stay connected
            </h2>
            <Squiggle width={120} />
          </div>

          <div className="grid gap-[22px]" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(278px,1fr))' }}>
            {cards.map((card) =>
              card.soon ? (
                <div key={card.title} className={cardClass} style={cardStyle}>
                  <CardInner card={card} />
                </div>
              ) : (
                <a
                  key={card.title}
                  href={card.href}
                  className={`${cardClass} card-lift hover:-translate-y-1`}
                  style={cardStyle}
                >
                  <CardInner card={card} />
                </a>
              )
            )}
          </div>
        </section>

        {/* ===== WHY WE'RE HERE ===== */}
        <section className="mt-12 sm:mt-20" style={{ background: C.section }}>
          <div className="max-w-[1100px] mx-auto px-5 sm:px-14 pt-12 sm:pt-[72px]">
            <div className="flex flex-wrap gap-8 sm:gap-14 items-center">
              <div className="flex-1 min-w-[300px]" style={{ flexBasis: '340px' }}>
                <h2 className="m-0" style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(30px,5vw,46px)', color: C.ink }}>
                  Why we&apos;re here
                </h2>
                <p
                  className="mt-4"
                  style={{ fontFamily: BODY, fontSize: 'clamp(15px,1.8vw,17px)', lineHeight: 1.7, color: C.body, maxWidth: 460 }}
                >
                  The friendships and connections you&apos;ve built at K9 🏠 don&apos;t end when you move out. Here,
                  you&apos;ll find familiar faces in new cities, continue the conversations 💬 that started over shared
                  meals, and keep being part of each other&apos;s stories. From catching up over coffee ☕ when
                  someone&apos;s in town, to sharing life updates and adventures — we&apos;re still the same community,
                  just spread across different places 🌍.
                </p>
              </div>

              {/* polaroid collage */}
              <div className="flex-1 min-w-[300px] relative" style={{ flexBasis: '340px', minHeight: 'clamp(290px,34vw,360px)' }}>
                <Polaroid left="0%" top="14%" rotate={-8} tint="#E0E8F8" width="clamp(150px,20vw,200px)" img={`${STORAGE}/balcony.jpg`} caption="Remote work 💻" />
                <Polaroid left="32%" top="0%" rotate={2} tint="#FBE2E4" width="clamp(160px,22vw,218px)" z={2} tape img={`${STORAGE}/dinner.jpg`} caption="Sharing food" />
                <Polaroid right="-1%" top="30%" rotate={6} tint="#E3EDD6" width="clamp(140px,18vw,184px)" img={`${STORAGE}/ski.jpg`} caption="Ski trip ⛷️" />
              </div>
            </div>

            {/* fuller intro copy */}
            <div>
              <Image
                src="/mug.png"
                alt=""
                width={168}
                height={132}
                className="mug-jiggle block mx-auto mb-8"
              />
              <p style={{ fontFamily: BODY, fontSize: 'clamp(15px,1.8vw,17px)', lineHeight: 1.7, color: C.body }}>
                If you&apos;re still a resident, no need to introduce yourself again 👋.{' '}
                <a href="/events" style={linkStyle}>Share events</a> 🎉 where alumni are welcome and join any existing
                events. Build new connections with alumni and make use of the{' '}
                <a href="/tips" style={linkStyle}>tips and resources</a> 💡 shared here. Tell us how life has been
                treating you via the <a href="/newsletter" style={linkStyle}>newsletter</a> 📝 and keep up with what
                alumni are up to. Don&apos;t hesitate to{' '}
                <a href="/holdmyhair" style={linkStyle}>ask for what you need</a> from the wider K9 family.
              </p>
            </div>
          </div>

          {/* Full-bleed footer-style goals band: spans the page edge to edge and
              flush to the bottom (no rounding/side margins), with the newsletter
              footer's wavy top carved from the section colour above. */}
          <div className="relative w-full mt-12 sm:mt-16 px-6 pt-16 pb-14 text-center overflow-hidden" style={{ background: '#E3EDD6' }}>
            <svg
              viewBox="0 0 980 70"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ position: 'absolute', top: -1, left: 0, width: '100%', height: 48, display: 'block' }}
            >
              <path d="M0,40 C160,5 330,5 490,30 C650,55 820,55 980,22 L980,0 L0,0 Z" fill={C.section} />
            </svg>
            <Image src="/plant.png" alt="" width={58} height={74} className="nl-floaty block mx-auto" />
            <h3 className="mt-3" style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(22px,3.6vw,30px)', color: C.ink, lineHeight: 1.15 }}>
              We have three main goals
            </h3>
            <div className="mt-4 space-y-2 mx-auto" style={{ fontFamily: BODY, fontSize: 'clamp(15px,1.8vw,17px)', lineHeight: 1.7, color: '#3a4a66', fontWeight: 600, maxWidth: '46ch' }}>
              <p className="m-0">💌&nbsp;&nbsp;Stay in touch on and offline</p>
              <p className="m-0">🤗&nbsp;&nbsp;Build relationships between alumni and current residents</p>
              <p className="m-0">🤲&nbsp;&nbsp;Support each other emotionally, professionally and in any other way possible</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function Polaroid({
  left,
  right,
  top,
  rotate,
  tint,
  width,
  z,
  tape,
  img,
  caption,
}: {
  left?: string;
  right?: string;
  top: string;
  rotate: number;
  tint: string;
  width: string;
  z?: number;
  tape?: boolean;
  img: string;
  caption?: string;
}) {
  return (
    <div
      className="absolute bg-white"
      style={{
        left,
        right,
        top,
        transform: `rotate(${rotate}deg)`,
        padding: '9px 9px 0',
        boxShadow: '0 12px 26px rgba(40,30,20,.18)',
        width,
        zIndex: z,
      }}
    >
      {tape && (
        <div
          className="absolute"
          style={{ top: -12, left: '50%', marginLeft: -30, width: 60, height: 22, background: 'rgba(210,180,140,.4)', transform: 'rotate(-4deg)' }}
        />
      )}
      <div className="relative" style={{ aspectRatio: '1 / 0.9', background: tint }}>
        <Image src={img} alt="" fill sizes="(max-width: 640px) 50vw, 220px" className="object-cover" />
      </div>
      {caption ? (
        <div className="text-center" style={{ fontFamily: HAND, fontWeight: 600, fontSize: 'clamp(15px,1.9vw,20px)', color: C.ink, padding: '7px 4px 11px' }}>
          {caption}
        </div>
      ) : (
        <div style={{ height: 34 }} />
      )}
    </div>
  );
}

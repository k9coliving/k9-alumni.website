import {
  featuredOf,
  issueLabelOf,
  type NewsletterRecord,
  type NewsletterSubmissionRecord,
  type NewsletterEventRecord,
} from '@/lib/newsletter';
import {
  FONT_DISPLAY,
  FONT_BODY,
  INK,
  PALETTE,
  firstNameOf,
  type Palette,
} from '@/components/newsletter/theme';
import {
  IssueTopBar,
  Masthead,
  WelcomeNote,
  FeaturedSection,
  NewsletterFooter,
  resolveHeaderImage,
} from '@/components/newsletter/sections';
import MemberCard, { RecommendIcon, RecommendationBody } from '@/components/newsletter/MemberCard';

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
  const issueLabel = issueLabelOf(newsletter.sent_at || newsletter.created_at);

  const landed = submissions.filter((s) => s.where_now);
  const recs = submissions.filter((s) => s.recommendation_link || s.recommendation_context);

  const headerImage = resolveHeaderImage(newsletter.header_image_url);
  const featured = featuredOf(newsletter);

  return (
    <div style={{ minHeight: '100vh', background: '#FAF4E4', fontFamily: FONT_BODY, color: '#34466A' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '26px 22px 0' }}>
        {newsletter.status === 'draft' && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 text-center">
            Preview — this newsletter hasn&apos;t been sent yet. It shows the contributions collected so far.
          </div>
        )}

        <IssueTopBar issueLabel={issueLabel} />
        <Masthead title={newsletter.title} headerImage={headerImage} />
        <WelcomeNote heading={newsletter.intro_heading} introText={newsletter.intro_text} />

        {submissions.length === 0 ? (
          <>
            <p style={{ textAlign: 'center', color: '#7a879e', padding: '48px 0', fontSize: '17px', fontWeight: 600 }}>No contributions yet.</p>
            <FeaturedSection items={featured} />
          </>
        ) : (
          <>
            {/* life updates */}
            <SectionHead kicker="Around the kitchen table" title="Life updates" color="#5B7FD4" />
            {submissions.map((s, i) => (
              <MemberCard key={s.id} s={s} palette={PALETTE[i % PALETTE.length]} index={i} />
            ))}

            {/* featured highlights */}
            <FeaturedSection items={featured} />

            {/* recommendations board */}
            {recs.length > 0 && (
              <>
                <SectionHead kicker="Worth passing on" title="The recommendations board" color="#E7A92F" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {recs.map((s, i) => {
                    const p = PALETTE[i % PALETTE.length];
                    return (
                      <div key={s.id} style={{ position: 'relative', background: '#fff', borderRadius: '18px', padding: '18px 20px', boxShadow: '0 14px 32px -26px rgba(22,41,76,0.4)', borderLeft: `4px solid ${p.accent}` }}>
                        <RecommendIcon id={s.id} />
                        <div style={{ fontSize: '15.5px', fontWeight: 800, color: INK, lineHeight: 1.32, wordBreak: 'break-word' }}>
                          <RecommendationBody link={s.recommendation_link} context={s.recommendation_context} />
                        </div>
                        <a href={`#member-${s.id}`} className="nl-reclink" style={{ display: 'inline-block', fontSize: '13.5px', fontWeight: 700, color: '#8390a6', marginTop: '8px', textDecoration: 'none', cursor: 'pointer' }}>
                          — {firstNameOf(s.name)}
                          {s.where_now ? `, ${s.where_now}` : ''}
                        </a>
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
                      <a key={s.id} href={`#member-${s.id}`} className="nl-pin" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#fff', borderRadius: '999px', padding: '9px 17px 9px 13px', boxShadow: '0 10px 24px -20px rgba(22,41,76,0.5)', fontWeight: 800, fontSize: '14.5px', color: INK, textDecoration: 'none', cursor: 'pointer' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: p.accent, boxShadow: `0 0 0 3px ${p.soft}` }} />
                        {s.where_now}
                      </a>
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

      <NewsletterFooter outroText={newsletter.outro_text} issueLabel={issueLabel} />
    </div>
  );
}

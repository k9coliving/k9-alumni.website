'use client';

import { FONT_BODY } from './theme';
import { IssueTopBar, Masthead, WelcomeNote, FeaturedSection, NewsletterFooter, resolveHeaderImage } from './sections';
import AutoScale from './AutoScale';
import type { FeaturedItem } from '@/lib/newsletter';

// Live preview of the parts of the newsletter the admin controls from the draft
// form — top bar, masthead (heading + header image), the intro welcome note, and
// the footer. Renders the same shared chrome as the public page, scaled to fit
// the dashboard. The submissions body isn't edited here, so it's shown as a
// placeholder between the welcome note and footer; the "Preview →" link renders
// the real contributions.
export default function DraftPreview({
  title,
  introHeading,
  introText,
  outroText,
  headerImageUrl,
  featured,
  issueLabel,
}: {
  title: string;
  introHeading: string;
  introText: string;
  outroText: string;
  headerImageUrl: string;
  featured: FeaturedItem[];
  issueLabel: string;
}) {
  const headerImage = resolveHeaderImage(headerImageUrl || null);

  return (
    <AutoScale>
      <div style={{ background: '#FAF4E4', fontFamily: FONT_BODY, color: '#34466A' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', padding: '26px 22px 0' }}>
          <IssueTopBar issueLabel={issueLabel} />
          <Masthead title={title.trim() || 'Your newsletter title'} headerImage={headerImage} />
          <WelcomeNote heading={introHeading} introText={introText} />
          <div
            style={{
              margin: '44px 0 18px',
              border: '2px dashed #CBB994',
              borderRadius: '22px',
              padding: '44px 24px',
              textAlign: 'center',
              color: '#7a879e',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: 700 }}>… resident updates go here</div>
            <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '6px' }}>
              Submissions collected for this issue render here in the sent newsletter.
            </div>
          </div>
          <FeaturedSection items={featured} />
        </div>
        <NewsletterFooter outroText={outroText} issueLabel={issueLabel} />
      </div>
    </AutoScale>
  );
}

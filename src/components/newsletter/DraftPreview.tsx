'use client';

import { FONT_BODY } from './theme';
import { IssueTopBar, Masthead, WelcomeNote, NewsletterFooter, resolveHeaderImage } from './sections';
import AutoScale from './AutoScale';

// Live preview of the parts of the newsletter the admin controls from the draft
// form — top bar, masthead (heading + header image), the intro welcome note, and
// the footer. Renders the same shared chrome as the public page, scaled to fit
// the dashboard. The submissions body is intentionally omitted; it isn't edited
// here, and the "Preview →" link shows the full thing.
export default function DraftPreview({
  title,
  introHeading,
  introText,
  outroText,
  headerImageUrl,
  issueLabel,
}: {
  title: string;
  introHeading: string;
  introText: string;
  outroText: string;
  headerImageUrl: string;
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
        </div>
        <NewsletterFooter outroText={outroText} issueLabel={issueLabel} />
      </div>
    </AutoScale>
  );
}

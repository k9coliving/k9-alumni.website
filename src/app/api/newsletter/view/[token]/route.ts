import { NextRequest, NextResponse } from 'next/server';
import { getNewsletterByToken, type NewsletterSubmissionRecord } from '@/lib/newsletter';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Public read-facing shape — strips internal fields (ip/user_agent/edit_token/
// newsletter_id) before sending submissions to the client.
function publicSubmission(s: NewsletterSubmissionRecord) {
  return {
    id: s.id,
    name: s.name,
    period_in_k9: s.period_in_k9,
    whats_up: s.whats_up,
    where_now: s.where_now ?? null,
    hold_my_hair: s.hold_my_hair ?? null,
    email: s.email ?? null,
    recommendation_link: s.recommendation_link ?? null,
    recommendation_context: s.recommendation_context ?? null,
    happy_story: s.happy_story ?? null,
    photo_urls: s.photo_urls ?? [],
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const ip = getClientIp(request);
  const limit = rateLimit(`newsletter-view:${ip}`, RATE_LIMITS.viewNewsletter.limit, RATE_LIMITS.viewNewsletter.windowMs);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests.', retryAfter: limit.retryAfterSeconds }, { status: 429 });
  }

  try {
    const { token } = await params;

    const result = await getNewsletterByToken(token);
    // 404 on miss, indistinguishable from a wrong token. Serves any status —
    // the token is the gate. Drafts return live unassigned submissions (the
    // admin preview); sent newsletters return their frozen submissions.
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { newsletter, submissions } = result;
    return NextResponse.json({
      newsletter: {
        title: newsletter.title,
        intro_text: newsletter.intro_text ?? null,
        outro_text: newsletter.outro_text ?? null,
        status: newsletter.status,
        sent_at: newsletter.sent_at ?? null,
      },
      submissions: submissions.map(publicSubmission),
    });
  } catch (error) {
    logger.error('Newsletter view failed', {
      endpoint: 'newsletter/view/[token]',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to load newsletter.' }, { status: 500 });
  }
}

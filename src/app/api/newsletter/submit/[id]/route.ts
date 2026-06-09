import { NextRequest, NextResponse } from 'next/server';
import {
  getSubmissionById,
  getNewsletterById,
  updateSubmission,
  parseSubmissionInput,
  timingSafeEqualStr,
  type NewsletterSubmissionRecord,
} from '@/lib/newsletter';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://alumni.k9coliving.com';
}

// Only the form-facing fields — never expose ip/user_agent/edit_token.
function publicSubmissionFields(s: NewsletterSubmissionRecord) {
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
    notify_for_next_newsletter: s.notify_for_next_newsletter ?? false,
  };
}

// Resolves the submission only if the token matches. Returns null for both
// "not found" and "wrong token" so the two are indistinguishable to callers.
async function authorize(
  id: string,
  token: string
): Promise<NewsletterSubmissionRecord | null> {
  const submission = await getSubmissionById(id);
  const stored = submission?.edit_token?.token;
  if (!submission || !stored || !timingSafeEqualStr(stored, token)) {
    return null;
  }
  return submission;
}

async function alreadySentResponse(newsletterId: string) {
  const newsletter = await getNewsletterById(newsletterId);
  return NextResponse.json(
    {
      editable: false,
      reason: 'already_sent',
      viewUrl: newsletter ? `${baseUrl()}/newsletter/n/${newsletter.token}` : null,
    },
    { status: 409 }
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const limit = rateLimit(`newsletter-edit:${ip}`, RATE_LIMITS.editSubmission.limit, RATE_LIMITS.editSubmission.windowMs);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests.', retryAfter: limit.retryAfterSeconds }, { status: 429 });
  }

  try {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get('token') || '';

    const submission = await authorize(id, token);
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (submission.newsletter_id) {
      return alreadySentResponse(submission.newsletter_id);
    }

    return NextResponse.json({ editable: true, submission: publicSubmissionFields(submission) });
  } catch (error) {
    logger.error('Newsletter submission fetch failed', {
      endpoint: 'newsletter/submit/[id]',
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to load submission.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const limit = rateLimit(`newsletter-edit:${ip}`, RATE_LIMITS.editSubmission.limit, RATE_LIMITS.editSubmission.windowMs);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests.', retryAfter: limit.retryAfterSeconds }, { status: 429 });
  }

  try {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get('token') || '';

    const submission = await authorize(id, token);
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (submission.newsletter_id) {
      return alreadySentResponse(submission.newsletter_id);
    }

    const raw = (await request.json()) as Record<string, unknown>;
    const parsed = parseSubmissionInput(raw);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // No email is sent on edit (only on initial submission).
    const result = await updateSubmission(id, parsed.value);
    if (!result.updated) {
      if (result.reason === 'already_sent' && submission.newsletter_id) {
        return alreadySentResponse(submission.newsletter_id);
      }
      // Scooped between authorize and write, or vanished.
      return NextResponse.json({ editable: false, reason: 'already_sent' }, { status: 409 });
    }

    logger.info('Newsletter submission edited', {
      endpoint: 'newsletter/submit/[id]',
      submissionId: id,
    });

    return NextResponse.json({ editable: true, submission: publicSubmissionFields(result.updated) });
  } catch (error) {
    logger.error('Newsletter submission edit failed', {
      endpoint: 'newsletter/submit/[id]',
      method: 'PATCH',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to save changes.' }, { status: 500 });
  }
}

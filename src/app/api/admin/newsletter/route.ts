import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import { createNewsletter } from '@/lib/newsletter';
import { logger } from '@/lib/logger';

const MAX_LEN = 10_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t ? t.slice(0, MAX_LEN) : undefined;
}

// Create a draft newsletter.
export async function POST(request: NextRequest) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const raw = (await request.json()) as Record<string, unknown>;
    const title = clean(raw.title);
    if (!title) {
      return NextResponse.json({ error: 'A title is required.' }, { status: 400 });
    }

    const replyTo = clean(raw.email_reply_to);
    if (replyTo && !EMAIL_RE.test(replyTo)) {
      return NextResponse.json({ error: 'Reply-to must be a valid email.' }, { status: 400 });
    }

    const newsletter = await createNewsletter({
      title,
      ...(raw.intro_heading !== undefined ? { intro_heading: clean(raw.intro_heading) ?? null } : {}),
      intro_text: clean(raw.intro_text) ?? null,
      outro_text: clean(raw.outro_text) ?? null,
      ...(raw.header_image_url !== undefined ? { header_image_url: clean(raw.header_image_url) ?? null } : {}),
      ...(raw.email_reply_to !== undefined ? { email_reply_to: replyTo ?? null } : {}),
    });

    logger.info('Newsletter draft created', { endpoint: 'admin/newsletter', newsletterId: newsletter.id });
    return NextResponse.json({ newsletter });
  } catch (error) {
    logger.error('Newsletter draft creation failed', {
      endpoint: 'admin/newsletter',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to create draft.' }, { status: 500 });
  }
}

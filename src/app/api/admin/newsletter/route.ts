import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import { createNewsletter } from '@/lib/newsletter';
import { logger } from '@/lib/logger';

const MAX_LEN = 10_000;

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

    const newsletter = await createNewsletter({
      title,
      intro_text: clean(raw.intro_text) ?? null,
      outro_text: clean(raw.outro_text) ?? null,
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

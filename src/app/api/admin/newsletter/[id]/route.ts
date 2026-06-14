import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import { getNewsletterById, updateNewsletter } from '@/lib/newsletter';
import { logger } from '@/lib/logger';

const MAX_LEN = 10_000;

function clean(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t ? t.slice(0, MAX_LEN) : undefined;
}

// Edit a draft newsletter's editorial fields. Blocked once sent.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const existing = await getNewsletterById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (existing.status === 'sent') {
      return NextResponse.json({ error: 'This newsletter has already been sent.' }, { status: 409 });
    }

    const raw = (await request.json()) as Record<string, unknown>;
    const title = clean(raw.title);
    if (raw.title !== undefined && !title) {
      return NextResponse.json({ error: 'A title is required.' }, { status: 400 });
    }

    const updated = await updateNewsletter(id, {
      ...(title !== undefined ? { title } : {}),
      ...(raw.intro_text !== undefined ? { intro_text: clean(raw.intro_text) ?? null } : {}),
      ...(raw.outro_text !== undefined ? { outro_text: clean(raw.outro_text) ?? null } : {}),
      ...(raw.header_image_url !== undefined ? { header_image_url: clean(raw.header_image_url) ?? null } : {}),
    });

    logger.info('Newsletter draft updated', { endpoint: 'admin/newsletter/[id]', newsletterId: id });
    return NextResponse.json({ newsletter: updated });
  } catch (error) {
    logger.error('Newsletter draft update failed', {
      endpoint: 'admin/newsletter/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to update draft.' }, { status: 500 });
  }
}

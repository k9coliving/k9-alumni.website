import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import { setSubmissionPinned } from '@/lib/newsletter';
import { logger } from '@/lib/logger';

// Shared handler for both verbs: POST pins ("Send to top"), DELETE unpins.
async function setPinned(request: NextRequest, id: string, pinned: boolean) {
  const result = await setSubmissionPinned(id, pinned);
  if (!result.updated) {
    if (result.reason === 'not_found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'This submission is part of a sent newsletter.' }, { status: 409 });
  }

  logger.info(pinned ? 'Admin pinned submission' : 'Admin unpinned submission', {
    endpoint: 'admin/submissions/[id]/pin',
    submissionId: id,
  });
  return NextResponse.json({ submission: result.updated });
}

// Send a submission to the top of the next newsletter.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    return await setPinned(request, id, true);
  } catch (error) {
    logger.error('Admin submission pin failed', {
      endpoint: 'admin/submissions/[id]/pin',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to pin submission.' }, { status: 500 });
  }
}

// Remove a submission's pin, returning it to natural order.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    return await setPinned(request, id, false);
  } catch (error) {
    logger.error('Admin submission unpin failed', {
      endpoint: 'admin/submissions/[id]/pin',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to unpin submission.' }, { status: 500 });
  }
}

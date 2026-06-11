import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import { updateSubmission, deleteSubmission, parseSubmissionInput } from '@/lib/newsletter';
import { logAuditEvent } from '@/lib/audit';
import { getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Edit any unassigned submission (correction). Reuses the same validation as the
// public form, so all required fields must be present.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const raw = (await request.json()) as Record<string, unknown>;
    const parsed = parseSubmissionInput(raw);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await updateSubmission(id, parsed.value);
    if (!result.updated) {
      if (result.reason === 'not_found') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      // already part of a sent newsletter — frozen
      return NextResponse.json({ error: 'This submission is part of a sent newsletter.' }, { status: 409 });
    }

    logger.info('Admin edited submission', { endpoint: 'admin/submissions/[id]', submissionId: id });
    return NextResponse.json({ submission: result.updated });
  } catch (error) {
    logger.error('Admin submission edit failed', {
      endpoint: 'admin/submissions/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to save changes.' }, { status: 500 });
  }
}

// Hard-delete a submission (spam / correction).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    await deleteSubmission(id);

    await logAuditEvent({
      event_type: 'data_modified',
      ip_address: getClientIp(request),
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: { scope: 'admin', action: 'delete_submission', submission_id: id },
    });

    logger.info('Admin deleted submission', { endpoint: 'admin/submissions/[id]', submissionId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Admin submission delete failed', {
      endpoint: 'admin/submissions/[id]',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to delete submission.' }, { status: 500 });
  }
}

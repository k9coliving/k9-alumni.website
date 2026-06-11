import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import { getUnassignedSubmissions } from '@/lib/newsletter';
import { logger } from '@/lib/logger';

// List the submissions not yet assigned to a newsletter (the pool for the next
// edition). Admin sees full records.
export async function GET(request: NextRequest) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const submissions = await getUnassignedSubmissions();
    return NextResponse.json({ submissions });
  } catch (error) {
    logger.error('Admin submissions list failed', {
      endpoint: 'admin/submissions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to load submissions.' }, { status: 500 });
  }
}

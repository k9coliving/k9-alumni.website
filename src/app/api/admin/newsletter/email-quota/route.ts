import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api-auth';
import { getEmailsSentInLast24h } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function getResendDailyLimit(): number {
  const raw = parseInt(process.env.RESEND_DAILY_LIMIT || '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 100;
}

// Rolling 24h email quota: how many we've sent and how many remain.
export async function GET(request: NextRequest) {
  const denied = await requireAdminAuth(request);
  if (denied) return denied;

  try {
    const sentLast24h = await getEmailsSentInLast24h();
    const limit = getResendDailyLimit();
    const remaining = Math.max(0, limit - sentLast24h);
    return NextResponse.json({ sentLast24h, limit, remaining });
  } catch (error) {
    logger.error('Email quota lookup failed', {
      endpoint: 'admin/newsletter/email-quota',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to load quota.' }, { status: 500 });
  }
}

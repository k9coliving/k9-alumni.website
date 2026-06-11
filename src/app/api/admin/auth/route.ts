import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminToken } from '@/lib/admin-auth';
import { timingSafeEqualStr } from '@/lib/newsletter';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const limit = rateLimit(`admin-login:${ip}`, RATE_LIMITS.adminLogin.limit, RATE_LIMITS.adminLogin.windowMs);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.', retryAfter: limit.retryAfterSeconds },
      { status: 429 }
    );
  }

  try {
    if (!ADMIN_PASSWORD) {
      logger.error('Admin login attempted but ADMIN_PASSWORD is not configured', {
        endpoint: 'admin/auth',
      });
      return NextResponse.json({ error: 'Admin login is not configured.' }, { status: 500 });
    }

    const { password } = (await request.json()) as { password?: unknown };

    // Constant-time compare so response timing doesn't leak the password.
    const ok = typeof password === 'string' && timingSafeEqualStr(password, ADMIN_PASSWORD);

    if (!ok) {
      await logAuditEvent({
        event_type: 'failed_login',
        ip_address: ip,
        user_agent: userAgent,
        details: { reason: 'invalid_admin_password', endpoint: 'admin/auth' },
      });
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('k9-admin-token', createAdminToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    await logAuditEvent({
      event_type: 'successful_login',
      ip_address: ip,
      user_agent: userAgent,
      details: { scope: 'admin', endpoint: 'admin/auth' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Admin login failed', {
      endpoint: 'admin/auth',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}

// Logout — clears the admin cookie.
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('k9-admin-token');
  return NextResponse.json({ success: true });
}

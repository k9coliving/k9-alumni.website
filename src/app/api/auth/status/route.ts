import { NextRequest, NextResponse } from 'next/server';
import { getFailedLoginAttempts, calculateBackoffDelay } from '@/lib/audit';
import { logger, logApiRequest, logApiError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Log incoming auth status request
  logApiRequest(request, {
    endpoint: 'auth/status',
    operation: 'check_rate_limit'
  });

  try {
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] :
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const failedAttempts = await getFailedLoginAttempts(ip);
    const requiredDelay = calculateBackoffDelay(failedAttempts);

    const response = {
      isRateLimited: requiredDelay > 0,
      retryAfter: requiredDelay,
      attempts: failedAttempts,
      requireEmail: failedAttempts >= 10
    };

    // Log auth status check for operational monitoring
    logger.info('Auth status checked', {
      endpoint: 'auth/status',
      method: 'GET',
      ip_address: ip,
      user_agent: userAgent,
      failed_attempts: failedAttempts,
      is_rate_limited: response.isRateLimited,
      requires_email: response.requireEmail,
      retry_after: requiredDelay,
      duration: Date.now() - startTime
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    return NextResponse.json(response);

  } catch (error) {
    // Enhanced error logging
    logApiError(request, error as Error, {
      endpoint: 'auth/status',
      operation: 'check_rate_limit',
      duration: Date.now() - startTime
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
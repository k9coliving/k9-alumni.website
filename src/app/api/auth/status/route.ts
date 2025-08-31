import { NextRequest, NextResponse } from 'next/server';
import { getFailedLoginAttempts, calculateBackoffDelay } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';

    const failedAttempts = await getFailedLoginAttempts(ip);
    const requiredDelay = calculateBackoffDelay(failedAttempts);

    return NextResponse.json({
      isRateLimited: requiredDelay > 0,
      retryAfter: requiredDelay,
      attempts: failedAttempts,
      requireEmail: failedAttempts >= 10
    });

  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
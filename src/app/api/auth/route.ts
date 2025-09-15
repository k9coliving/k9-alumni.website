import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { logAuditEvent, getFailedLoginAttempts, calculateBackoffDelay } from '@/lib/audit';
import { logger, logApiRequest, logApiError } from '@/lib/logger';

const SITE_PASSWORD = process.env.SITE_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

function createAuthToken(): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  const payload = {
    authenticated: true,
    timestamp: Date.now(),
  };
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  
  return `${header}.${body}.${signature}`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Log incoming authentication request
  logApiRequest(request, {
    endpoint: 'auth',
    operation: 'login_attempt'
  });

  try {
    if (!JWT_SECRET) {
      logApiError(request, new Error('JWT_SECRET not configured'), {
        endpoint: 'auth',
        operation: 'config_check',
        duration: Date.now() - startTime
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      return NextResponse.json(
        { error: 'Server configuration error: missing JWT secret environment variable' },
        { status: 500 }
      );
    }

    const { password, email } = await request.json();
    
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (password === SITE_PASSWORD) {
      // Get failed attempts for logging purposes
      const failedAttempts = await getFailedLoginAttempts(ip);
      // Log successful login
      await logAuditEvent({
        event_type: 'successful_login',
        ip_address: ip,
        user_agent: userAgent,
        details: {
          previous_failed_attempts: failedAttempts,
          email: email || null
        }
      });

      // Log successful authentication for operational monitoring
      logger.info('Authentication successful', {
        endpoint: 'auth',
        method: 'POST',
        ip_address: ip,
        user_agent: userAgent,
        previous_failed_attempts: failedAttempts,
        has_email: !!email,
        duration: Date.now() - startTime
      });

      // Set authentication cookie with signed token
      const response = NextResponse.json({ success: true });
      const authToken = createAuthToken();

      const cookieStore = await cookies();
      cookieStore.set('k9-auth-token', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      return response;
    } else {
      // Check for rate limiting ONLY for wrong passwords
      const failedAttempts = await getFailedLoginAttempts(ip);
      const requiredDelay = calculateBackoffDelay(failedAttempts);
      
      // Require email after 10 failed attempts
      if (failedAttempts >= 10 && !email) {
        return NextResponse.json(
          { 
            error: 'Email required',
            requireEmail: true,
            message: 'Please provide your email address for identification purposes'
          },
          { status: 400 }
        );
      }
      
      // Validate email format if provided (after 10+ attempts)
      if (failedAttempts >= 10 && email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return NextResponse.json(
            { 
              error: 'Invalid email format',
              requireEmail: true,
              message: 'Please provide a valid email address'
            },
            { status: 400 }
          );
        }
      }
      
      if (requiredDelay > 0) {
        await logAuditEvent({
          event_type: 'failed_login',
          ip_address: ip,
          user_agent: userAgent,
          details: {
            reason: 'rate_limited',
            attempts: failedAttempts,
            required_delay: requiredDelay,
            email: email || null
          }
        });

        // Log rate limiting for operational monitoring
        logger.warn('Authentication rate limited', {
          endpoint: 'auth',
          method: 'POST',
          ip_address: ip,
          user_agent: userAgent,
          failed_attempts: failedAttempts,
          required_delay: requiredDelay,
          has_email: !!email,
          duration: Date.now() - startTime
        });

        await new Promise(resolve => setTimeout(resolve, 10));
        return NextResponse.json(
          {
            error: 'Too many failed attempts',
            retryAfter: requiredDelay,
            message: `Please wait ${requiredDelay} seconds before trying again`
          },
          { status: 429 }
        );
      }

      // Log failed login attempt
      await logAuditEvent({
        event_type: 'failed_login',
        ip_address: ip,
        user_agent: userAgent,
        details: {
          reason: 'invalid_password',
          attempts: failedAttempts + 1,
          email: email || null
        }
      });

      // Log failed authentication for operational monitoring
      logger.warn('Authentication failed - invalid password', {
        endpoint: 'auth',
        method: 'POST',
        ip_address: ip,
        user_agent: userAgent,
        failed_attempts: failedAttempts + 1,
        will_require_email: failedAttempts + 1 >= 10,
        has_email: !!email,
        duration: Date.now() - startTime
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      return NextResponse.json(
        {
          error: 'Invalid password',
          requireEmail: failedAttempts + 1 >= 10
        },
        { status: 401 }
      );
    }
  } catch (error) {
    // Enhanced error logging
    logApiError(request, error as Error, {
      endpoint: 'auth',
      operation: 'login_attempt',
      duration: Date.now() - startTime
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
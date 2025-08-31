import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { logAuditEvent, getFailedLoginAttempts, calculateBackoffDelay } from '@/lib/audit';

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
  try {
    if (!JWT_SECRET) {
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
      
      // Set authentication cookie with signed token
      const response = NextResponse.json({ success: true });
      const authToken = createAuthToken();
      
      const cookieStore = await cookies();
      cookieStore.set('k9-auth-token', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

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
      
      return NextResponse.json(
        { 
          error: 'Invalid password',
          requireEmail: failedAttempts + 1 >= 10
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from './auth';
import { logAuditEvent } from './audit';

export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  try {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      // Log unauthorized API access attempt
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      await logAuditEvent({
        event_type: 'failed_login',
        ip_address: ip,
        user_agent: userAgent,
        details: { 
          reason: 'unauthorized_api_access',
          endpoint: request.url,
          method: request.method
        }
      });

      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Authentication required to access this endpoint' 
        },
        { status: 401 }
      );
    }

    return null; // Authentication successful, continue with request
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
  }
}

export async function withAuth<T extends any[]>(
  request: NextRequest,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  ...args: T
): Promise<NextResponse> {
  const authResponse = await requireAuth(request);
  
  if (authResponse) {
    return authResponse; // Return auth error
  }
  
  return handler(request, ...args); // Continue with authenticated request
}
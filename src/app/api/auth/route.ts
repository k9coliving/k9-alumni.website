import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

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

    const { password } = await request.json();

    if (password === SITE_PASSWORD) {
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
      return NextResponse.json(
        { error: 'Invalid password' },
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
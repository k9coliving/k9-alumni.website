import { cookies } from 'next/headers';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;

// Mints the admin session token. Carries an `admin: true` claim — distinct from
// the site token's `authenticated: true` — so the two credentials are NOT
// interchangeable even though they share JWT_SECRET. Without this, a valid site
// cookie (the shared alumni password is widely known) could be renamed to
// k9-admin-token and pass the admin check.
export function createAdminToken(): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  const payload = {
    admin: true,
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

function verifyAdminToken(token: string): boolean {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const [header, body, signature] = token.split('.');

    if (!header || !body || !signature) {
      return false;
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return false;
    }

    // Require the admin claim specifically — a site token (authenticated: true)
    // must NOT validate here.
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.admin === true;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('k9-admin-token');

  if (!adminCookie?.value) {
    return false;
  }

  return verifyAdminToken(adminCookie.value);
}

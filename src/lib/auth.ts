import { cookies } from 'next/headers';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;

function verifyAuthToken(token: string): boolean {
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
    
    // Verify payload
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('k9-auth-token');
  
  if (!authCookie?.value) {
    return false;
  }
  
  return verifyAuthToken(authCookie.value);
}
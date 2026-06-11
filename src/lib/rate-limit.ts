import { NextRequest } from 'next/server';

// In-memory per-IP rate limiter. Best-effort only: state lives in a single
// lambda instance, so on Vercel it filters obvious bursts but is NOT a hard
// guarantee across distributed instances. Good enough to blunt spam/brute-force;
// not a substitute for real abuse protection.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Per-route limits (see newsletter plan Phase 2).
export const RATE_LIMITS = {
  submit: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 / IP / hour
  uploadImage: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 / IP / hour
  viewNewsletter: { limit: 30, windowMs: 60 * 1000 }, // 30 / IP / minute
  editSubmission: { limit: 30, windowMs: 60 * 1000 }, // 30 / IP / minute (edit token brute-force defence)
  adminLogin: { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 / IP / 15 min (admin password brute-force defence)
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

let lastSweep = Date.now();

// Lazily drop expired buckets so the map can't grow unbounded across many IPs.
function maybeSweep(now: number): void {
  if (now - lastSweep < 60_000) {
    return;
  }
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  maybeSweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

// Shared client-IP extraction, matching the existing pattern in auth/upload routes.
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown';
}

import { Resend } from 'resend';

// Shared Resend wiring for all newsletter mail (submissions, sends, reminders).
export const resendClient = new Resend(process.env.RESEND_API_KEY);

export const NEWSLETTER_FROM = 'K9 Alumni <noreply@mail.k9coliving.com>';

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://alumni.k9coliving.com';
}

// Resend's daily send cap, used for the quota warning. Bump after upgrading the
// Resend plan via RESEND_DAILY_LIMIT.
export function resendDailyLimit(): number {
  const raw = parseInt(process.env.RESEND_DAILY_LIMIT || '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 100;
}

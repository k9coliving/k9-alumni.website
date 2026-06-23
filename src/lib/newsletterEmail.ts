// Inline-styled HTML for newsletter reminder emails. Styled to echo the
// rendered newsletter — warm cream backdrop, a white card, the K9 wordmark, a
// yellow tagline pill and a rounded CTA — while staying email-safe: inline
// styles only, web-safe font stacks (custom fonts don't load in mail clients),
// no external CSS and no absolute positioning. Pure (no server deps) so the
// admin page can import it for a live preview.

import { DEFAULT_INTRO, DEFAULT_INTRO_HEADING, resolveHeaderImage, textBlocks } from '@/components/newsletter/sections';
import type { FeaturedItem } from '@/lib/newsletter';

const INK = '#16294C';
const YELLOW = '#F6C44C';
const GREEN_BAND = '#E3EDD6';
const BLUE = '#2563eb';
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Defaults — used when the admin leaves a field blank, and as the initial
// values for the Send-a-reminder form. The subject doubles as the heading.
export const DEFAULT_REMINDER_SUBJECT = 'The next K9 newsletter — add your news 🐾';
export const DEFAULT_REMINDER_BODY =
  "Got news to share? A new chapter, a small win, a recommendation, a photo — " +
  "whatever you're up to, the pack would love to hear it.\n\n" +
  'Add your post before this issue goes out:';

// Decorative illustrations from /public, shown (centered) below the CTA.
// Limited to the two that fit a "send us your news" nudge.
export const REMINDER_IMAGE_FILES = ['airplane.png', 'envelope.png'];

export function pickReminderImage(): string {
  return REMINDER_IMAGE_FILES[Math.floor(Math.random() * REMINDER_IMAGE_FILES.length)];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Render admin-entered plain text as HTML: blank lines split paragraphs, single
// newlines become <br>, and a block whose first line starts with "> " becomes a
// styled pull-quote. Escaped so the admin can't break (or inject) markup.
function paragraphs(text: string): string {
  return textBlocks(text)
    .map((b) => {
      const html = b.lines.map(escapeHtml).join('<br>');
      if (b.type === 'quote') {
        return `<blockquote style="margin:16px 0; padding:6px 0 6px 16px; border-left:4px solid #e5e7eb; font-style:italic; color:#46587a; font-size:16px; line-height:1.6;">${html}</blockquote>`;
      }
      return `<p style="font-size:16px; line-height:1.7; color:#3a4a66; margin:0 0 16px;">${html}</p>`;
    })
    .join('');
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0 8px;">
    <a href="${href}" style="display:inline-block; background:${BLUE}; color:#ffffff; font-weight:700; font-size:16px; padding:13px 28px; text-decoration:none; border-radius:999px;">${label} →</a>
  </p>`;
}

export interface ReminderEmailArgs {
  // Subject line; also rendered as the heading inside the email.
  heading: string;
  // Body message (plain text; blank lines become paragraphs).
  bodyText: string;
  submitUrl: string;
  unsubscribeUrl: string;
  // Absolute URL of the decorative image shown under the heading (relative is OK
  // for the same-origin preview). When omitted, no image is rendered.
  imageUrl?: string;
}

export function buildReminderEmailHtml({
  heading,
  bodyText,
  submitUrl,
  unsubscribeUrl,
  imageUrl,
}: ReminderEmailArgs): string {
  const safeHeading = escapeHtml(heading.trim() || DEFAULT_REMINDER_SUBJECT);
  const body = paragraphs(bodyText.trim() || DEFAULT_REMINDER_BODY);

  return `<div style="padding:24px 12px; font-family:${FONT};">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 18px 40px -30px rgba(22,41,76,0.5);">

    <!-- top bar -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:24px 32px 0; font-size:18px; font-weight:800; color:${INK};">
          K9 Newsletter
        </td>
        <td style="padding:24px 32px 0; text-align:right; font-size:12px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#9aa6bd;">
          Alumni Edition
        </td>
      </tr>
    </table>

    <!-- body -->
    <div style="padding:24px 32px 28px;">
      <h1 style="font-size:26px; line-height:1.2; color:${INK}; font-weight:800; margin:0 0 16px;">${safeHeading}</h1>
      ${body}
      ${button(submitUrl, 'Add my news')}
      ${imageUrl ? `<div style="text-align:center; margin:32px 0 22px;"><img src="${imageUrl}" alt="" width="120" style="width:120px; height:auto; display:inline-block;" /></div>` : ''}
    </div>

    <!-- footer band -->
    <div style="background:${GREEN_BAND}; padding:24px 32px; text-align:center;">
      <p style="font-size:14px; line-height:1.6; color:#3a4a66; font-weight:600; margin:0;">
        Stay connected at
        <a href="https://alumni.k9coliving.com/" style="color:${INK}; font-weight:800; text-decoration:underline;">alumni.k9coliving.com</a>
        — directory, tips &amp; help, and an events calendar.
      </p>
      <p style="color:#7c8aa3; font-size:12px; margin:16px 0 0;">
        You're receiving this because you're subscribed to the K9 newsletter.
        <a href="${unsubscribeUrl}" style="color:#7c8aa3;">Unsubscribe</a>.
      </p>
    </div>

  </div>
</div>`;
}

// Slim "Don't miss" teaser of the issue's featured highlights — eyebrow + title
// (+ optional small image, short body), email-safe. Empty string when none.
function featuredStrip(items: FeaturedItem[]): string {
  if (!items.length) return '';
  const cards = items
    .map((it) => {
      const img = it.image_url
        ? `<td valign="top" style="padding:0 14px 0 0; width:84px;"><img src="${it.image_url}" alt="" width="84" style="width:84px; height:84px; object-fit:cover; border-radius:10px; display:block;" /></td>`
        : '';
      const eyebrow = it.eyebrow
        ? `<div style="font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#E7A92F; margin:0 0 4px;">${escapeHtml(it.eyebrow)}</div>`
        : '';
      const body = it.body ? `<div style="margin:6px 0 0;">${paragraphs(it.body)}</div>` : '';
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 0 14px;">
        <tr>
          ${img}
          <td valign="top">
            ${eyebrow}
            <div style="font-size:17px; font-weight:800; color:${INK}; line-height:1.25;">${escapeHtml(it.title)}</div>
            ${body}
          </td>
        </tr>
      </table>`;
    })
    .join('');
  return `<div style="border-top:1px solid #eef0f4; margin:20px 0 0; padding:18px 0 0;">
    <div style="font-size:12px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:#E7A92F; margin:0 0 12px;">Don't miss</div>
    ${cards}
  </div>`;
}

export interface NewsletterEmailArgs {
  title: string;
  introHeading?: string | null;
  introText?: string | null;
  // Raw per-issue header image (or null); resolved to the default masthead here.
  headerImageUrl?: string | null;
  // Optional featured highlights, shown as a slim teaser above the Read button.
  featured?: FeaturedItem[];
  // The token page that renders the full newsletter.
  readUrl: string;
  // Present for subscriber recipients (→ unsubscribe footer). Omit for
  // contributor-only recipients (→ "you submitted a post" explanatory line).
  unsubscribeUrl?: string;
}

// Announcement email for a newsletter send: masthead + title + intro + a "Read
// the newsletter" button to the token page (NOT the full issue inline — the
// token page renders that). Same email-safe constraints as the reminder.
export function buildNewsletterEmailHtml({
  title,
  introHeading,
  introText,
  headerImageUrl,
  featured,
  readUrl,
  unsubscribeUrl,
}: NewsletterEmailArgs): string {
  const safeTitle = escapeHtml(title.trim() || 'The K9 Newsletter');
  const safeHeading = escapeHtml((introHeading || '').trim() || DEFAULT_INTRO_HEADING);
  const intro = paragraphs((introText || '').trim() || DEFAULT_INTRO);
  const masthead = resolveHeaderImage(headerImageUrl ?? null);
  const featuredHtml = featuredStrip(featured ?? []);

  // Subscribers get an unsubscribe link; contributor-only recipients get a line
  // explaining the one-off (they're not on the ongoing list).
  const footerNote = unsubscribeUrl
    ? `You're receiving this because you're subscribed to the K9 newsletter. <a href="${unsubscribeUrl}" style="color:#7c8aa3;">Unsubscribe</a>.`
    : `You're receiving this because you submitted a post to this newsletter.`;

  return `<div style="padding:24px 12px; font-family:${FONT};">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 18px 40px -30px rgba(22,41,76,0.5);">

    <!-- top bar -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:24px 32px 0; font-size:18px; font-weight:800; color:${INK};">
          K9 Newsletter
        </td>
        <td style="padding:24px 32px 0; text-align:right; font-size:12px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#9aa6bd;">
          Alumni Edition
        </td>
      </tr>
    </table>

    <!-- masthead image -->
    ${masthead ? `<div style="padding:18px 32px 0;"><img src="${masthead}" alt="" width="536" style="width:100%; height:auto; max-height:240px; object-fit:cover; border-radius:14px; display:block;" /></div>` : ''}

    <!-- body -->
    <div style="padding:22px 32px 28px;">
      <h1 style="font-size:30px; line-height:1.15; color:${INK}; font-weight:800; margin:0 0 14px;">${safeTitle}</h1>
      <div style="display:inline-block; background:${YELLOW}; border-radius:999px; padding:7px 18px; font-style:italic; font-weight:800; font-size:14px; color:#1c2f54; margin:0 0 18px;">
        Together, we make our community thrive.
      </div>
      <h2 style="font-size:20px; line-height:1.2; color:${INK}; font-weight:800; margin:0 0 10px;">${safeHeading}</h2>
      ${intro}
      ${featuredHtml}
      ${button(readUrl, 'Read the newsletter')}
    </div>

    <!-- footer band -->
    <div style="background:${GREEN_BAND}; padding:24px 32px; text-align:center;">
      <p style="font-size:14px; line-height:1.6; color:#3a4a66; font-weight:600; margin:0;">
        Stay connected at
        <a href="https://alumni.k9coliving.com/" style="color:${INK}; font-weight:800; text-decoration:underline;">alumni.k9coliving.com</a>
        — directory, tips &amp; help, and an events calendar.
      </p>
      <p style="color:#7c8aa3; font-size:12px; margin:16px 0 0;">
        ${footerNote}
      </p>
    </div>

  </div>
</div>`;
}

// Inline-styled HTML for newsletter emails. Kept simple and table-free — a
// centered column with a button — so it renders consistently across clients.

const WRAP_OPEN =
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">';
const WRAP_CLOSE = '</div>';

function button(href: string, label: string): string {
  return `<p style="margin: 28px 0;">
    <a href="${href}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">${label}</a>
  </p>`;
}

function unsubscribeFooter(unsubscribeUrl: string): string {
  return `<p style="color: #9ca3af; font-size: 12px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
    You're receiving this because you're subscribed to the K9 newsletter.
    <a href="${unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a>.
  </p>`;
}

export interface ReminderEmailArgs {
  submitUrl: string;
  unsubscribeUrl: string;
}

export function buildReminderEmailHtml({ submitUrl, unsubscribeUrl }: ReminderEmailArgs): string {
  return `${WRAP_OPEN}
    <h2 style="color: #1f2937;">The next K9 newsletter is coming together 🐾</h2>
    <p>Got news to share? A new chapter, a small win, a recommendation, a photo —
       whatever you're up to, the pack would love to hear it.</p>
    <p>Add your post before this issue goes out:</p>
    ${button(submitUrl, 'Add my news')}
    <p style="color: #6b7280; font-size: 14px;">Already shared something? Thank you — no need to do anything.</p>
    ${unsubscribeFooter(unsubscribeUrl)}
  ${WRAP_CLOSE}`;
}

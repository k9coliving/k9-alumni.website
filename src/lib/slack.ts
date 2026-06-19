// Thin wrapper around a Slack Incoming Webhook. The webhook URL (server-only,
// not NEXT_PUBLIC) is bound to a single channel chosen when the webhook is
// created in Slack — the app just posts text to it.

export function slackConfigured(): boolean {
  return !!process.env.SLACK_WEBHOOK_URL;
}

// Post a mrkdwn message to the configured channel. Never throws — a network or
// Slack-side error comes back as { ok: false, error } so callers can log it.
export async function postToSlack(text: string): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    return { ok: false, error: 'SLACK_WEBHOOK_URL is not set.' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    // Incoming webhooks return 200 with the body "ok" on success; anything else
    // is a failure (e.g. "invalid_payload", "no_service" with a 4xx).
    const body = (await res.text()).trim();
    if (!res.ok || body !== 'ok') {
      return { ok: false, error: body || `Slack returned ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Slack request failed' };
  }
}

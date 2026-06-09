# Newsletter feature — implementation plan

## Overview

Add a real newsletter workflow to the alumni website:

1. A **public submission form** at `/newsletter/submit` where residents contribute to the next newsletter (name, period in K9, photos, "What's up", "Where?", "Hold my hair", "Get in touch", recommendation link + context, "A K9 happy story").
2. **Token-protected newsletter editions** at `/newsletter/n/[token]` — compiled from approved submissions, also sent by email.
3. The existing `/newsletter` teaser page stays as-is (minor link tweak).

The form page and per-token newsletter pages are publicly accessible (no site password) — each newsletter is protected only by its token.

## Decisions

| Topic | Decision |
|---|---|
| Edit window | Submitters can edit as many times as they want, until their submission is part of a sent newsletter |
| Photo count | Max 5 per submission |
| Moderation | Submissions auto-approved (no moderation status) |
| Ordering in newsletter | First submitted, first displayed — no manual reordering |
| Slug | Not used — token only |
| Admin composition | No composition step — just preview / send (the token URL is the preview) |
| Send behaviour | Sending a newsletter scoops up all un-assigned submissions into it — atomic, at send time |
| Field limits | Plain text, very generous soft limits (users should never hit them) |
| Required fields | `name`, `period_in_k9`, `whats_up`. Everything else optional |
| SEO | No indexing for either page |
| Admin access | Separate `ADMIN_PASSWORD`, distinct from the site password |
| Email provider | Reuse Resend. Sender: `noreply@mail.k9coliving.com`. Reply-to filled in by admin per send |
| Resident decoupling | Submission form does not pre-fill from residents |
| Newsletter recipients | Residents with `involvement_level` in (`full-engagement`, `newsletter-only`, `team-member`) **or** `is_team_member = true`. Not `database-only`, not `other` |
| Quota warning | Warn if the send would exceed Resend daily limit (rolling 24h). Don't block |
| Slack reminders | Deferred to later |
| Send email on edit | Only on initial submission, not on subsequent edits |

---

## Phase 0 — Environment & infrastructure

### New env vars

Add to `.env.local` and `.env.local.example`:

```
ADMIN_PASSWORD=...                      # separate from SITE_PASSWORD
ADMIN_DEFAULT_REPLY_TO=...              # optional; pre-fills the reply-to input
RESEND_DAILY_LIMIT=100                  # bump after upgrading Resend plan
```

Update `NEXT_PUBLIC_NEWSLETTER_FORM_URL` in Vercel + `.env.local` to `https://alumni.k9coliving.com/newsletter/submit` after deploy.

### Supabase storage

Reuse the existing `images` bucket. Newsletter uploads go under the `newsletter/` prefix (e.g. `newsletter/{random}_{timestamp}.jpg`).

### SEO

Disallow crawling of both newsletter paths:
- `robots.txt` (or `src/app/robots.ts`): `Disallow: /newsletter/submit` and `Disallow: /newsletter/n/`
- Each page also exports Next metadata with `robots: { index: false, follow: false }`

---

## Phase 1 — Database migrations

Run against Supabase via the SQL editor. Save the SQL for the record (no migration tool in use).

### `newsletters` (create first — FK target)

```sql
CREATE TABLE newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sent_at timestamptz,

  token text UNIQUE NOT NULL,
  title text NOT NULL,
  intro_text text,
  outro_text text,

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent'))
);
CREATE INDEX idx_newsletters_token ON newsletters(token);
```

### `newsletter_submissions`

```sql
CREATE TABLE newsletter_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  name text NOT NULL,
  period_in_k9 text NOT NULL,
  whats_up text NOT NULL,

  where_now text,
  hold_my_hair text,
  email text,
  recommendation_link text,
  recommendation_context text,
  happy_story text,
  photo_urls text[] DEFAULT '{}',

  notify_for_next_newsletter boolean DEFAULT false,

  edit_token jsonb,
  newsletter_id uuid REFERENCES newsletters(id) ON DELETE SET NULL,

  submission_ip text,
  user_agent text
);

CREATE INDEX idx_newsletter_submissions_newsletter_id
  ON newsletter_submissions(newsletter_id);
CREATE INDEX idx_newsletter_submissions_created_at
  ON newsletter_submissions(created_at DESC);
```

### Resident table

No migration needed. Newsletter opt-in is already captured in `residents.preferences` (`involvement_level` + `is_team_member`).

### Audit log

No schema change. Two new event types are added in code (see Phase 2).

---

## Phase 2 — Shared backend pieces

### `src/lib/newsletter.ts` (new)

Data-access layer, style matching `src/lib/supabase.ts`:

- `createSubmission(data)`
- `getSubmissionById(id)`
- `updateSubmission(id, patch)` — only allowed if `newsletter_id IS NULL`
- `setSubmissionEditToken(id, token)` — no expiry; token persists until inclusion
- `verifySubmissionEditToken(id, token)` — constant-time compare
- `getUnassignedSubmissions()` — `newsletter_id IS NULL`, ordered by `created_at ASC`
- `getNewsletterByToken(token)` — newsletter + ordered submissions, serves **any** status. Branches on status: `draft` returns the live set of unassigned submissions (preview of what will go out); `sent` returns submissions `WHERE newsletter_id = <id>`. Both ordered `created_at ASC`
- `createNewsletter(draft)`
- `finalizeAndSendNewsletter(id)` — scoop transaction run at send time: sets `status='sent'`, `sent_at=now()`, and `UPDATE newsletter_submissions SET newsletter_id=$1 WHERE newsletter_id IS NULL`. Runs **before** the email loop so content is frozen; email failures are handled by retry, not by rolling this back. No-op on the scoop if the newsletter is already `sent`
- `getNewsletterSubscribedResidents()` — the recipient query below
- `getPastSubmittersWantingReminders()` — distinct emails from submissions where `notify_for_next_newsletter = true`
- `resolveRecipients(manualEmails)` — unions the two sources with manual additions, dedupes by lowercased email

Recipient query:

```ts
supabaseAdmin
  .from('residents')
  .select('id, name, email')
  .not('email', 'is', null)
  .or([
    'preferences->>involvement_level.eq.full-engagement',
    'preferences->>involvement_level.eq.newsletter-only',
    'preferences->>involvement_level.eq.team-member',
    'preferences->>is_team_member.eq.true',
  ].join(','));
```

### `src/lib/admin-auth.ts` (new)

Clone of `src/lib/auth.ts`, keyed on `ADMIN_PASSWORD`, cookie `k9-admin-token`. Reuse `JWT_SECRET`. Export `isAdminAuthenticated()`.

**Token claim distinction (security-critical):** the admin token payload carries `{ admin: true }` and `verifyAdminToken` requires `payload.admin === true` — *not* `authenticated === true`. The site token uses `{ authenticated: true }`. Both are signed with the same `JWT_SECRET`, so without distinct claims a valid site token (the shared alumni password is widely known) could be copied into the `k9-admin-token` cookie and pass admin checks. Distinct claims make the two credentials non-interchangeable. The two gates are independent: admin pages require only the admin cookie; an admin login grants no site access and vice-versa.

### `src/lib/api-auth.ts` (modify)

Add `requireAdminAuth(request)` alongside the existing `requireAuth`.

### `src/lib/audit.ts` (modify)

Extend `AuditEventType`:

```ts
| 'newsletter_email_sent'
| 'newsletter_reminder_sent'
```

`details` shape for both:

```ts
{
  newsletter_id: string | null,   // null for reminders
  recipient_email: string,
  recipient_name?: string,
  recipient_source: 'resident_subscribed' | 'past_submitter' | 'manual',
  resend_message_id?: string,
  status: 'sent' | 'failed',
  error_message?: string,
  reply_to: string,
}
```

New helper:

```ts
export async function getEmailsSentInLast24h(): Promise<number>
```

Counts `audit_logs` rows with `event_type IN ('edit_request_sent', 'newsletter_email_sent', 'newsletter_reminder_sent')` where `timestamp >= now() - interval '24 hours'`. Rolling window, not UTC-midnight. Any future email-sending event type must be added here.

### `src/lib/rate-limit.ts` (new, or inline)

In-memory per-IP limiter. Best-effort on Vercel (per-lambda-instance), still filters obvious bursts:

- `/api/newsletter/submit`: 5 / IP / hour
- `/api/newsletter/upload-image`: 20 / IP / hour
- `/api/newsletter/view/[token]`: 30 / IP / minute (brute-force defence)

---

## Phase 3 — Public API routes

### `POST /api/newsletter/submit`

Public (no `requireAuth`). Rate-limited. Honeypot field (reject if `website` is non-empty).

- Validate required: `name`, `period_in_k9`, `whats_up`
- Soft cap field lengths at 10,000 chars (DoS guard, never surfaced to the user)
- Cap `photo_urls.length <= 5`
- Generate `edit_token` with `crypto.randomUUID()`
- Insert row
- If `email` provided, send Resend email with edit link `${BASE_URL}/newsletter/edit/${id}?token=${editToken}`
- Return `{ id, editUrl }`

### `GET /api/newsletter/submit/[id]` and `PATCH /api/newsletter/submit/[id]`

Public but token-gated via `?token=...`. Constant-time compare.

- Reject if `newsletter_id IS NOT NULL` (already published — not editable)
- No token expiry
- PATCH updates fields. GET returns current values for re-populating the form
- No email on edit

### `POST /api/newsletter/upload-image`

Public, rate-limited.

- Stores under `newsletter/` prefix
- Strips EXIF via Sharp (decode → `.rotate()` to bake in orientation → re-encode; re-encoding drops all metadata incl. GPS). Add `sharp` to `package.json` (not currently installed; ~17 MB native libvips binary per platform, Apache-2.0, also used by Next.js). Leave `limitInputPixels` at its safe default (~268 MP) to block decompression bombs — the 3 MB byte cap alone doesn't bound decoded pixel count
- Max 3 MB per file
- Validates image MIME
- Returns `{ url }`

### `GET /api/newsletter/view/[token]`

Public, rate-limited. Looks up newsletter by token, **any status** — the token is the access gate, not the status. 404 on miss (indistinguishable from wrong token). Render depends on status: `draft` returns the live set of unassigned submissions (this is the admin preview — no separate endpoint); `sent` returns submissions `WHERE newsletter_id = <id>`. Both ordered `created_at ASC`.

---

## Phase 4 — Public pages

### `src/app/newsletter/submit/page.tsx` (new)

Full-page form (not a modal). Uses `Layout`, `FormField`, `FormButtons`. Fields:

- Name *(required)*
- Period in K9 *(required, free text)*
- What's up *(required, textarea)*
- Where? *(optional)*
- Hold my hair *(optional, textarea)*
- Get in touch — email *(optional)*
- Recommendation link *(optional)*
- Context for link *(optional, textarea)*
- A K9 happy story *(optional, textarea)*
- Photos *(optional, up to 5)* — loop of 5 `ImageUpload` slots or "add another" pattern
- "Notify me when the next newsletter is coming" *(checkbox)*
- Hidden honeypot `website` field

Metadata: `robots: { index: false, follow: false }`.

On success: confirmation screen with edit link (copyable) and "we've emailed it to you" note when email was provided.

### `src/app/newsletter/edit/[id]/page.tsx` (new)

Reads `?token=...`. Fetches via GET, pre-fills form, PATCHes on save. If server returns "already published, not editable", show a friendly message pointing at the published newsletter.

### `src/app/newsletter/n/[token]/page.tsx` (new)

Server component. Fetches newsletter + submissions server-side (works for both `draft` and `sent` — admins preview a draft by opening its token URL directly). Renders read-only view styled after `/newsletter`'s "Letters from the past" but richer — all eight fields per submission, photos inline. `noindex` metadata.

### `src/app/newsletter/page.tsx` (modify)

- Line 80: replace `mailto:cami@k9coliving.com?subject=Newsletter Update` with `<a href="/newsletter/submit">`.
- Leave `NewsletterCallToAction` alone — it already reads `NEXT_PUBLIC_NEWSLETTER_FORM_URL`. Just update the env var in Vercel.

---

## Phase 5 — Admin (scope-tight)

### Auth

- `src/app/admin/login/page.tsx` (new) — login form gated by `ADMIN_PASSWORD`. Same shape as the site `PasswordGate`.
- `src/app/api/admin/auth/route.ts` (new) — sets `k9-admin-token` cookie.

### `src/app/admin/newsletter/page.tsx` (new)

Protected by `isAdminAuthenticated()`. Three sections:

1. **Unassigned submissions** — list with all fields visible, edit/delete per row.
2. **Create next newsletter** — form with `title`, `intro_text`, `outro_text`. Buttons:
   - "Save draft" — creates draft, no submissions assigned yet.
   - "Preview" — opens the token-view page (`/newsletter/n/[token]`) for the draft. No special endpoint: a draft renders its live set of unassigned submissions, so the preview *is* the real page.

   There is no separate "Publish" step — finalisation (scoop + `status='sent'`) happens atomically when the newsletter is sent (see send page).
3. **Past newsletters** — list with token links + "Send" button per newsletter.

Also surfaces the **email quota widget** (sent in last 24h / `RESEND_DAILY_LIMIT`).

Note on preview: `/api/newsletter/view/[token]` serves drafts too (gated by token), so admin preview is just the public token URL rendered through the same view component — no admin-only preview endpoint.

### `src/app/admin/newsletter/[id]/send/page.tsx` (new)

- **Reply-to email input** (required, pre-filled from `ADMIN_DEFAULT_REPLY_TO` if set). Validated before Send is enabled.
- Recipient list preview, grouped by source:
  - "Residents opted in" (from the recipient query)
  - "Past submitters who want reminders" (distinct emails, dedupe against residents)
  - "Manual additions" (textarea)
- **Quota status strip** above Send:
  - *Green*: `sentLast24h + recipients ≤ limit`
  - *Yellow*: recipients alone under limit, but combined exceeds — "⚠ This would exceed your Resend daily limit. X sent in last 24h, N to send now, limit Y. About (N − remaining) will fail."
  - *Red*: `recipients > limit` — "⚠ Recipient count exceeds entire daily limit. Split the send."
  - Warning only; never blocks.
- **Send button** → calls `POST /api/admin/newsletter/[id]/send`. Backend first runs `finalizeAndSendNewsletter` (scoop + `status='sent'` + `sent_at`, atomic) to freeze content, then sends Resend calls sequentially with ~100 ms spacing, logging every recipient to `audit_logs` (success or failure). On a re-send the scoop is skipped (already `sent`) and only the chosen recipients are mailed — supports "retry failed only".
- Below Send: table of `audit_logs` entries for this newsletter (`event_type='newsletter_email_sent'`, `details.newsletter_id = id`). Supports "retry failed only".

### `src/app/admin/newsletter/reminder/page.tsx` (new)

Same pattern as `/send` but for reminders. Email body: "The next newsletter is going out soon — add your news at `/newsletter/submit`." Logged as `newsletter_reminder_sent` with `details.newsletter_id = null`.

### Admin API routes (all `requireAdminAuth`)

- `POST /api/admin/newsletter` — create draft
- `PATCH /api/admin/newsletter/[id]` — edit draft
- `POST /api/admin/newsletter/[id]/send` — finalise (scoop + `status='sent'`) then send, log per-recipient
- `POST /api/admin/newsletter/reminder/send` — reminders, log
- `GET /api/admin/newsletter/[id]/recipients` — recipient preview
- `GET /api/admin/newsletter/email-quota` — `{ sentLast24h, limit, remaining }`
- `GET /api/admin/submissions` — list with filters
- `PATCH /api/admin/submissions/[id]` — edit any submission
- `DELETE /api/admin/submissions/[id]` — delete (spam / correction)

---

## Phase 6 — Existing code changes

1. `src/app/newsletter/page.tsx:80` — replace `mailto:` anchor with `/newsletter/submit`.
2. `.env.local.example` — add `ADMIN_PASSWORD`, `ADMIN_DEFAULT_REPLY_TO`, `RESEND_DAILY_LIMIT`.
3. Vercel env — set `NEXT_PUBLIC_NEWSLETTER_FORM_URL=https://alumni.k9coliving.com/newsletter/submit`.
4. `robots.txt` (or `src/app/robots.ts`) — disallow `/newsletter/submit` and `/newsletter/n/`.
5. `src/lib/audit.ts` — extend `AuditEventType` and add `getEmailsSentInLast24h()`.

Navigation link for `/newsletter/submit`: leave out by default to keep nav clean. Revisit if discoverability is a problem.

---

## Phase 7 — Rollout order

1. Run SQL migrations against Supabase (dev then prod).
2. Ship Phase 2 (lib) + Phase 3 (public API) + Phase 4 (public pages). Test submission E2E locally.
3. Ship Phase 5 (admin), gated by `ADMIN_PASSWORD`. Test draft → preview → send to your own email only.
4. Update `NEXT_PUBLIC_NEWSLETTER_FORM_URL` in Vercel.
5. Apply Phase 6 code edit on the teaser page.
6. Dry-run end-to-end: submit → preview draft → send to yourself.
7. Announce submission form to alumni via existing channels.

---

## Deferred (not in this build)

- Optional "Lock" step (freeze submissions before sending) to close the small preview→send race — only if it ever bites
- Slack reminder integration
- Public archive teaser of past newsletter intros
- Markdown rendering of submission fields
- Resident-to-submission pre-fill by email match
- Display-order editing within a newsletter
- Slug-based newsletter URLs
- Moderation workflow (submissions are auto-approved for now)
- Auto-cross-posting "Hold my hair" newsletter entries to `/holdmyhair`

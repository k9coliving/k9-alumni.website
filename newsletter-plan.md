# Newsletter feature — implementation plan

## Overview

Add a real newsletter workflow to the alumni website:

1. A **public submission form** at `/newsletter/submit` where residents contribute to the next newsletter (name, period in K9, photos, "What's up", "Where?", "Hold my hair", "Get in touch", recommendation link + context, "A K9 happy story").
2. **Token-protected newsletter editions** at `/newsletter/n/[token]` — compiled from approved submissions, also sent by email.
3. The existing `/newsletter` teaser page stays as-is (minor link tweak).

The form page and per-token newsletter pages are publicly accessible (no site password) — each newsletter is protected only by its token.

## Post-launch additions (2026-06-20)

The core feature shipped (Phases 1–5c + send). These were built on top, all on `main`:

- **Reminder email spruce-up** (`6e8aabf`): editable subject/heading + message on the Send-a-reminder page, a live HTML preview, on-brand email HTML (`lib/newsletterEmail.ts` → `buildReminderEmailHtml`), a random decorative image (airplane/envelope), and a "previous reminders" history (audit `newsletter_reminder_batch`, `getReminderTextHistory`) with a reuse button.
- **Slack reminder posting** (`cf1f653`): "Post to Slack" button on the reminder page → `POST /api/admin/newsletter/reminder/slack` → Slack Incoming Webhook (`lib/slack.ts`). Body-only (no subject); `@channel/@here/@everyone` are rewritten to `<!channel>` etc. so they actually ping. Needs `SLACK_WEBHOOK_URL` (in `.env.local` + Vercel). Audit: `newsletter_reminder_slack_posted` (deliberately NOT counted in the email quota). **Slack reminders are now DONE — was deferred.**
- **Featured highlights** (`bdf11ae`): up to 3 admin-curated highlights per issue (book rec / Slack news / anniversary), stored in `newsletters.data.featured` jsonb — **no migration**. `FeaturedItem` + `sanitizeFeatured`/`featuredOf` in `lib/newsletter.ts`; shared `FeaturedSection` (`components/newsletter/sections.tsx`) renders on the token page and the draft live preview; the image follows the resident-post floated layout (full natural aspect, never cropped); admin editor supports add/remove/**reorder (↑)** + image upload; slim teaser in the announcement email. Public section title: **"From the K9 crew"** (kicker "A few things worth a mention").
- **Quote syntax**: in admin-authored text (featured body, intro, reminder body), lines starting with `>` render as a light-gray pull-quote on both page and email. Shared grouping `textBlocks()` in `sections.tsx`, used by `renderRichText` (page) and `paragraphs()` (email).

**Gotcha reaffirmed this session:** after editing `lib/*` or shared components (e.g. `sections.tsx`), **restart `npm run dev`**. Stale Turbopack served the old `lib/newsletter` and caused both a 500 on save (missing `sanitizeFeatured`) and missing quote rendering. `npm run build` is a separate process and does NOT refresh the dev server.

---

## Build status (historical — feature COMPLETE as of 2026-06-20)

**All phases done.** Send + reminder (5c) shipped; see "Post-launch additions" at the top for what was built on top. Only open items are the manual prod/testing steps below — NOT code.

| Phase | Status | Commit |
|---|---|---|
| 1 — DB migrations | ✅ Done — both tables live in **production** Supabase (no dev DB on this project) | (run manually in SQL editor) |
| 2 — Shared lib | ✅ Done | `00709dd` |
| 3 — Public API routes | ✅ Done — build green, Sharp EXIF-strip verified | `e0459d7` |
| 4 — Public pages | ✅ Done — deployed + tested | `c79555b` (+ copy polish `19fbe75`, `d141ef4`) |
| 5a — Admin auth | ✅ Done — login flow verified (401/cookie/redirect) | `4707a43` |
| 5b — Admin dashboard + submissions | ✅ Done — dashboard SSRs, build green | `f391731` |
| 5c — Admin send + reminder | ✅ Done — reminder `076a535`, send `0115196` (auth smoke-tested; not yet live-tested with a real Resend send) | — |
| 6 — Existing code edits | 🟡 Partial (teaser link done; robots.ts covered by static `robots.txt`; env-example done) | — |

### Open items (manual, Cami owns — no code left)
- ⬜ **Live dry run:** test-to-self from `/admin/newsletter/[id]/send` before any real send (single shared prod DB + real Resend).
- ⬜ **Vercel env:** set `SLACK_WEBHOOK_URL` (Slack button), confirm `NEXT_PUBLIC_BASE_URL`, verify `mail.k9coliving.com` in Resend, set `RESEND_DAILY_LIMIT`.
- ⬜ **Schema cleanup:** drop `newsletter_submissions.notify_for_future_newsletters` by hand once the subscriber-model deploy is confirmed live.
- ℹ️ Schema added by hand this work: `newsletters.data jsonb`, `newsletters.intro_heading text` (featured highlights live in `data.featured`).

### What exists now
- **Lib:** `admin-auth.ts`, `newsletter.ts` (data layer + `parseSubmissionInput` + `timingSafeEqualStr`; **email now required** in `parseSubmissionInput`; + `updateNewsletter`, `getAllNewsletters`, `deleteSubmission`), `rate-limit.ts` (+ `adminLogin` limit), `api-auth.ts` (`requireAdminAuth`), `audit.ts` (`getEmailsSentInLast24h`).
- **Public API:** `POST /api/newsletter/submit`, `GET|PATCH /api/newsletter/submit/[id]`, `POST /api/images/upload` (Sharp metadata-strip), `GET /api/newsletter/view/[token]`.
- **Public pages:** submit / edit / `n/[token]` view. Shared `NewsletterForm.tsx` (multi-file `MultiImageDrop.tsx`, honeypot, email required). Copy in the K9er/"Coliving Girl" voice.
- **Admin (5a/5b):**
  - `POST|DELETE /api/admin/auth` — login (constant-time `ADMIN_PASSWORD`, `k9-admin-token` with `{admin:true}` claim) / logout.
  - `admin/login/page.tsx`, server-gated `admin/newsletter/page.tsx` + `AdminNewsletterClient.tsx` — quota widget, create-draft form, unassigned-submissions list (delete + edit-via-public-token-page), newsletters list with preview + send links.
  - Admin API (all `requireAdminAuth`): `POST /api/admin/newsletter`, `PATCH /api/admin/newsletter/[id]`, `GET /api/admin/newsletter/email-quota`, `GET /api/admin/submissions`, `PATCH|DELETE /api/admin/submissions/[id]`.
- **Gate:** `AuthProvider.tsx` bypasses the site password for `/newsletter/submit`, `/newsletter/edit/*`, `/newsletter/n/*`, **and `/admin/*`** (admin has its own gate).
- **Seed data note:** ✅ The 3 test submissions (`*.test@example.com`) have been deleted from prod. The "K9 Newsletter — Test Draft" row is being **kept and repurposed as the first real newsletter** — Cami to update its title/intro/outro via the admin draft form. A draft renders the live set of unassigned submissions and `finalizeAndSendNewsletter` scoops them at send time, so it will contain exactly the real submissions present when sent.

### Start of next session — Phase 5c (send + reminder)

The send/reminder UI + backend. The hard part is the Resend send loop + quota math; everything it depends on already exists.

**Already available to build on:**
- `finalizeAndSendNewsletter(id)` in `newsletter.ts` — atomic scoop (assign all unassigned → `newsletter_id`, set `status='sent'`, `sent_at`); idempotent no-op if already sent (supports re-send / retry-failed).
- `resolveRecipients(manualEmails)` in `newsletter.ts` — unions opted-in residents + reminder-wanting past submitters + manual, deduped by lowercased email, tagged by source.
- `getEmailsSentInLast24h()` + the quota math already in `admin/newsletter/email-quota` route (`resendDailyLimit()` helper duplicated in the dashboard page — consider lifting to lib).
- `audit.ts` event types `newsletter_email_sent` / `newsletter_reminder_sent` already exist and are already counted by `getEmailsSentInLast24h()`.
- Resend client pattern: see `src/app/api/newsletter/submit/route.ts` (`new Resend(process.env.RESEND_API_KEY)`, `from: 'K9 Alumni <noreply@mail.k9coliving.com>'`).

**To build (full spec in "Phase 5 — Admin" → send/reminder sections below):**
1. `GET /api/admin/newsletter/[id]/recipients` — recipient preview grouped by source.
2. `POST /api/admin/newsletter/[id]/send` — `finalizeAndSendNewsletter` first (freeze), then Resend calls sequentially ~100 ms apart, **log every recipient** to `audit_logs` (success or failure) as `newsletter_email_sent` with `details.newsletter_id`. Reply-to from request (required). Supports "retry failed only" (re-send skips the scoop, mails only chosen recipients).
3. `POST /api/admin/newsletter/reminder/send` — same pattern, body "next newsletter coming, add your news at /newsletter/submit", logged `newsletter_reminder_sent` with `details.newsletter_id = null`.
4. `admin/newsletter/[id]/send/page.tsx` — reply-to input (prefill `ADMIN_DEFAULT_REPLY_TO`), recipient preview by source, quota strip (green/yellow/red, warning-only never blocks), Send button, audit-log table below with retry-failed.
5. `admin/newsletter/reminder/page.tsx` — same shape for reminders.
   - **Note:** the dashboard already links to `/admin/newsletter/[id]/send` and `/admin/newsletter/reminder` — these 404 until built.
6. ✅ Real `ADMIN_PASSWORD` set in Vercel (local `.env.local` still uses a throwaway `devadmin123`). Test send to **your own email only** (prod DB + real Resend).

### Then Phase 6 (remaining)
- ~~robots~~ ✅ **Already covered** — a pre-existing `public/robots.txt` blanket-disallows the whole site (`Disallow: /`), which is stricter than the per-path rule originally planned and covers the public newsletter + admin routes. No `robots.ts` needed (it would conflict with the static file and be weaker). 
- `.env.local.example` — ✅ `ADMIN_PASSWORD`, `ADMIN_DEFAULT_REPLY_TO`, `RESEND_DAILY_LIMIT`, `NEXT_PUBLIC_BASE_URL` all present.
- Vercel (your action): set `ADMIN_PASSWORD`, `NEXT_PUBLIC_NEWSLETTER_FORM_URL=<domain>/newsletter/submit`, confirm `NEXT_PUBLIC_BASE_URL`.

### ⚠️ TODO / reminders before next session ends (Cami's notes)
- [ ] **`git push`** — 3 newsletter commits (`2725623`, `00709dd`, `e0459d7`) are **local only, not pushed yet**.
- [ ] **Verify Vercel deploy still works** after push — confirm the live site builds and existing pages still work (the new routes are inert until Phase 4 wires UI to them, but the `sharp` dep is new in the bundle).
- [ ] **Investigate npm vulnerabilities** — `npm install sharp` reported 26 vulns (2 low, 11 moderate, 13 high). These appear **repo-wide / pre-existing**, not sharp-specific, but confirm with `npm audit` and triage.
- [x] ✅ Real **`ADMIN_PASSWORD`** set in Vercel. (`.env.local` keeps the throwaway `devadmin123` for local dev; `JWT_SECRET` already present.)
- [ ] **No live E2E test yet** — deliberately skipped, since hitting `submit` writes to the prod DB and there's no admin delete path until Phase 5. Do the submit→preview→send dry-run once Phase 5 exists (test sends to your own email only).

### Gotchas to remember
- **Single prod DB, no dev** — anything that writes (esp. test submissions, sends) hits production. Keep test sends to your own email.
- **ESLint is broken in this repo** (flat-config + `eslint-config-next` compat crash; `next lint` removed in Next 16). Use `npx tsc --noEmit` + `npm run build` as the gates. Worth fixing separately.
- **Next 16 dynamic route params are async** — handlers use `{ params }: { params: Promise<{...}> }` and must `await params`.
- **Stale dev server after editing server modules** — the Turbopack dev server can keep serving *old* compiled `lib/`/route code after a Fast Refresh full-reload (triggered by a runtime error). Symptom seen 2026-06-15: a PATCH returned `200` and logged success but wrote the *old* column and ignored the new field — because the running server still had the pre-edit `parseSubmissionInput`/`updateSubmission`. `npm run build` is a separate process and does **not** refresh it. **Fix: restart the dev server** (`npm run dev`) after editing server-side modules when behaviour looks stale. Especially relevant when a change spans code **and** a DB schema change.
- **Migrations live in `migrations/*.sql`, run by hand in the Supabase SQL editor** (established 2026-06-15; no migration tooling). Because dev and prod share **one** Supabase, **code and schema must ship together** — a column rename/drop breaks the currently-deployed code until the new code deploys, and breaks new code until the SQL is run. Commit + run the SQL + (locally) restart the dev server close together.
- **Newsletter render is shared** — the public newsletter view and the submission-form live preview both render `src/components/newsletter/MemberCard.tsx` (tokens in `theme.ts`, photos+lightbox in the client `MemberPhotos.tsx`). Change the card there once; `preview` prop drops camera badges/anchor, forces the stacked photo layout, and disables the lightbox.

---

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
| Required fields | `name`, `period_in_k9`, `whats_up`, **`email`** (made required in Phase 4 copy pass — it's the newsletter delivery + edit-link address; enforced client + server in `parseSubmissionInput`). Everything else optional |
| SEO | No indexing for either page |
| Admin access | Separate `ADMIN_PASSWORD`, distinct from the site password |
| Email provider | Reuse Resend. Sender: `noreply@mail.k9coliving.com`. Reply-to filled in by admin per send |
| Resident decoupling | Submission form does not pre-fill from residents |
| Newsletter recipients | Residents with `involvement_level` in (`full-engagement`, `newsletter-only`, `team-member`) **or** `is_team_member = true`. Not `database-only`, not `other` |
| Quota warning | Warn if the send would exceed Resend daily limit (rolling 24h). Don't block |
| Slack reminders | ✅ Done (2026-06-20) — Incoming Webhook (`SLACK_WEBHOOK_URL`), "Post to Slack" on the reminder page. See Post-launch additions. |
| Send email on edit | Only on initial submission, not on subsequent edits |

---

## Phase 0 — Environment & infrastructure

### New env vars

Add to `.env.local` and `.env.local.example`:

```
ADMIN_PASSWORD=...                      # separate from SITE_PASSWORD
ADMIN_DEFAULT_REPLY_TO=...              # optional; pre-fills the reply-to input
RESEND_DAILY_LIMIT=100                  # bump after upgrading Resend plan
SLACK_WEBHOOK_URL=...                   # Slack Incoming Webhook for "Post to Slack" reminders (2026-06-20)
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
  -- Array of { url, focus? } objects. `focus` is a CSS object-position keyword
  -- (3x3 preset grid) controlling the crop; absent means centred. The lead
  -- photo is simply index 0.
  photos jsonb NOT NULL DEFAULT '[]',

  notify_for_future_newsletters boolean DEFAULT false,

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
- `getPastSubmittersWantingReminders()` — distinct emails from submissions where `notify_for_future_newsletters = true`
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
- `/api/images/upload`: 20 / IP / hour
- `/api/newsletter/view/[token]`: 30 / IP / minute (brute-force defence)

---

## Phase 3 — Public API routes

### `POST /api/newsletter/submit`

Public (no `requireAuth`). Rate-limited. Honeypot field (reject if `website` is non-empty).

- Validate required: `name`, `period_in_k9`, `whats_up`
- Soft cap field lengths at 10,000 chars (DoS guard, never surfaced to the user)
- Cap `photos.length <= 5`
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

### `POST /api/images/upload`

Canonical metadata-stripping image uploader (renamed from `/api/newsletter/upload-image` in Phase 4 to decouple the name from the use case — DB images can move onto it later). Public, rate-limited.

- Stores under `newsletter/` prefix (hardcoded via `STORAGE_PREFIX` for now; TODO param when DB images move here)
- Strips EXIF via Sharp (decode → `.rotate()` to bake in orientation → re-encode; re-encoding drops all metadata incl. GPS). Add `sharp` to `package.json` (not currently installed; ~17 MB native libvips binary per platform, Apache-2.0, also used by Next.js). Leave `limitInputPixels` at its safe default (~268 MP) to block decompression bombs — the byte cap alone doesn't bound decoded pixel count
- Max 5 MB per file (consistent with `/api/upload-image`)
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
4. ~~`robots.txt` — disallow `/newsletter/submit` and `/newsletter/n/`.~~ ✅ Already covered by the pre-existing `public/robots.txt` (`Disallow: /` — whole site). No change needed; do NOT add `src/app/robots.ts` (conflicts with the static file).
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
- ~~Slack reminder integration~~ ✅ Done 2026-06-20 (see Post-launch additions)
- Public archive teaser of past newsletter intros
- Markdown rendering of submission fields
- Resident-to-submission pre-fill by email match
- Display-order editing within a newsletter
- Slug-based newsletter URLs
- Moderation workflow (submissions are auto-approved for now)
- Auto-cross-posting "Hold my hair" newsletter entries to `/holdmyhair`

---

# Newsletter subscription model — single source of truth (planned 2026-06-15, build tomorrow)

> Self-contained spec. Decisions are settled with Cami; build in the phase order below, one commit per phase, `npm run build` before each commit. **Public repo — placeholders only in docs/examples.**

## Problem being solved
Newsletter subscription state is currently **fragmented and inferred**, with no authoritative unsubscribe and no consent audit:
1. `newsletter_submissions.notify_for_future_newsletters` (a boolean **per submission row** — a 3× submitter has it in 3 rows).
2. `residents.preferences.involvement_level` ∈ {`full-engagement`, `newsletter-only`, `team-member`} **or** `preferences.is_team_member = true` — i.e. consent is inferred from *role/engagement* fields.

`resolveRecipients()` unions these two (+ admin manual emails) at send time. Problems: consent overloaded onto role fields (can't unsubscribe a team member without changing their role); no single authoritative unsubscribe; no unsubscribe link; no audit trail.

## Key finding that de-risks this
**The send flow (Phase 5c) was never built.** `resolveRecipients`, `getNewsletterSubscribedResidents`, `getPastSubmittersWantingReminders` are **not called anywhere** outside `lib/newsletter.ts`. There is no send route, no send page, no email-with-recipients yet. So we are **defining the recipient model fresh**, not refactoring a live pipeline.

## Decision: Option A — dedicated `newsletter_subscribers` table as the single source of truth
The other places become **writers into** this table, never parallel readers. Sends read only this table.

### Schema
```sql
create table newsletter_subscribers (
  email             text primary key,           -- normalized lowercase
  name              text,
  status            text not null default 'subscribed',  -- 'subscribed' | 'unsubscribed'
  source            text,                        -- 'resident' | 'submission' | 'manual' | 'import'
  resident_id       uuid references residents(id) on delete set null,
  unsubscribe_token text unique not null,        -- for one-click unsubscribe links
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unsubscribed_at   timestamptz
);
create index idx_newsletter_subscribers_status on newsletter_subscribers(status);
```
(Store email normalized to lowercase as the PK; keep original-cased display in `name` only. Generate `unsubscribe_token` with `crypto.randomUUID()` or similar.)

### One-time backfill (in the same migration)
Insert from today's two derived sources, **subscribed residents win** the row (they carry `name` + `resident_id`), past submitters fill the rest. Dedup by lowercased email. Every row gets a token. Source tag set accordingly. (Write this as SQL using the same `involvement_level`/`is_team_member` criteria currently in `getNewsletterSubscribedResidents`, plus `newsletter_submissions` where `notify_for_future_newsletters = true`.)

## The rules that make it work
- **Sends read only `newsletter_subscribers` where `status='subscribed'`.**
- **Writers upsert, but NEVER auto-resurrect an unsubscribe.** If an automated opt-in (form checkbox, resident create/edit, manual add) targets an email whose status is `unsubscribed`, do **not** silently re-subscribe. Instead return a `needs_resubscribe_confirm` signal and let the UI ask the person to confirm.
- **Unsubscribe is authoritative and explicit** — via the token link or admin only.

### Subscribe state machine (applies to newsletter form + resident create/edit)
For an incoming email `E` with opt-in intent:
- `E` not in table → create `subscribed`. → audit `newsletter_subscribed`
- `E` already `subscribed` → no-op.
- `E` is `unsubscribed` → **do not auto-resubscribe.** Return `needs_resubscribe_confirm`; UI prompts *"You unsubscribed before — resubscribe?"*; on confirm hit the resubscribe endpoint → set `subscribed`. → audit `newsletter_resubscribed`

Unsubscribe (token or admin) → set `status='unsubscribed'`, `unsubscribed_at=now()`. → audit `newsletter_unsubscribed`

## `notify_for_future_newsletters` column → DROP it
The form checkbox drives `newsletter_subscribers` keyed by the **email entered in the form**:
- **New submission, box checked:** subscribe that email (or `needs_resubscribe_confirm` if previously unsubscribed).
- **New submission, box unchecked:** **no-op** (must not unsubscribe — box defaults off, person may have subscribed via residents).
- **Edit form:** prefill the box from that email's current subscriber status. Checking → subscribe (with resubscribe-confirm if needed). **Unchecking → unsubscribe** (their own entry, explicit — confirmed with Cami).
- Migration drops the column **after** backfill has read it.

## Resident wiring (no new checkbox — confirmed)
- On resident **self-create** and **self-edit to a subscribable state** (same `involvement_level`/`is_team_member` criteria as `getNewsletterSubscribedResidents`), upsert the subscriber (source `resident`, set `resident_id`, `name`, `email`).
- **De-opting DOES unsubscribe (confirmed with Cami, reverses the earlier default).** If a resident self-edits their `involvement_level`/`is_team_member` away from a subscribable state, treat it as an explicit unsubscribe: set `status='unsubscribed'`, `unsubscribed_at=now()`, audit `newsletter_unsubscribed` (actor `self`, source `resident`). Rationale: the newsletter has its own specific involvement entry — not choosing it means they don't want the newsletter.
  - **UI:** show an **info message under the involvement control** when the selected setting would not receive the newsletter — e.g. *"With this setting you won't receive the K9 newsletter — saving will unsubscribe you."* Not a blocker, just makes the consequence visible (so it's informed, not silent).
- If the email already exists as `unsubscribed`, the resident create flow does a **second-step confirmation** (same resubscribe prompt) instead of silently re-subscribing.

## Audit logging (Cami explicitly wants this clear)
Extend `AuditEventType` in `src/lib/audit.ts`:
```
| 'newsletter_subscribed'
| 'newsletter_unsubscribed'
| 'newsletter_resubscribed'
```
`details` shape: `{ email, source: 'submission'|'resident'|'manual'|'import', actor: 'self'|'admin', resident_id?, submission_id? }`. Every status change in `lib/subscribers.ts` calls `logAuditEvent`. **Do NOT add these to `getEmailsSentInLast24h()`** — no email is sent, they must not count against the send quota.

## Components to build
- **`src/lib/subscribers.ts`** (new):
  - `upsertSubscriber({ email, name?, source, resident_id? }) → { result: 'created' | 'already_subscribed' | 'needs_resubscribe_confirm' }` (normalizes email; logs audit on create).
  - `resubscribe(email, { actor, source }) ` → set subscribed + audit `newsletter_resubscribed`.
  - `unsubscribeByToken(token, { actor })` / `unsubscribeByEmail(email, { actor })` → audit `newsletter_unsubscribed`.
  - `getActiveSubscribers() → { email, name }[]`.
  - `getSubscriberByToken(token)`, `listSubscribers({ status? })` (admin).
- **`resolveRecipients()`** → `getActiveSubscribers()` + manual emails (manual upserts as `source:'manual'`). **Retire** `getNewsletterSubscribedResidents` + `getPastSubmittersWantingReminders` (unused — safe to remove).
- **Public unsubscribe:** `GET /api/newsletter/unsubscribe` (or a route handler) keyed by `?token=`, + a friendly `/newsletter/unsubscribe` page (confirm + done states). Ready for the eventual email footer link (wired when Phase 5c send is built). Likely needs to be added to `AuthProvider` public-path bypass list (like the other `/newsletter/*` public pages).
- **Resubscribe endpoint:** confirm-by-email from the form success page / resident step 2. [Open security note below.]
- **Admin subscribers page** under `/admin/newsletter` (or a tab): list + filter by status + unsubscribe/resubscribe buttons (admin actor in audit). All `requireAdminAuth`.

## Build order (one commit per phase; migration runs in Supabase between/with deploys)
1. ✅ **Schema + lib + audit + repoint** (done 2026-06-18) — `newsletter_subscribers` table SQL run by hand in Supabase (NOT stored as a migration file — this project does schema by hand); `lib/subscribers.ts` (`upsertSubscriber`/`resubscribe`/`unsubscribeByToken`/`unsubscribeByEmail`/`getActiveSubscribers`/`getSubscriberByToken`/`listSubscribers`); `AuditEventType` += `newsletter_subscribed`/`_unsubscribed`/`_resubscribed` (NOT counted in `getEmailsSentInLast24h`); `resolveRecipients` now reads `getActiveSubscribers` + manual; dead `getNewsletterSubscribedResidents`/`getPastSubmittersWantingReminders` removed; `RecipientSource` now `'subscriber' | 'manual'`. No UI. tsc + build green. **Inert until Phase 5c send is built (resolveRecipients has no caller yet).**
2. ✅ **Unsubscribe surfaces** (done 2026-06-18) — public `/newsletter/unsubscribe` page (confirm→done/already/error states) + `GET|POST /api/newsletter/unsubscribe?token=` (GET shows email for confirm, POST performs it — POST-not-GET so email link-prefetchers can't auto-unsubscribe; added to `AuthProvider` public-path bypass + `RATE_LIMITS.unsubscribe`). Admin: `/admin/newsletter/subscribers` (list + status filter + unsubscribe/resubscribe, linked from the dashboard header) and `GET|PATCH /api/admin/subscribers` (`requireAdminAuth`, admin-actor audit). tsc + build green; endpoints smoke-tested (404/400/401/200).
3. ✅ **Newsletter form writer** (code done 2026-06-18) — checkbox now drives `newsletter_subscribers` (form field renamed `notify_for_future_newsletters` → `subscribe`). POST submit: checked → `upsertSubscriber` (source `submission`), unchecked → NO-OP (never unsubscribes — may be subscribed via residents). PATCH edit: checked → subscribe, unchecked → `unsubscribeByEmail` (explicit). GET edit returns `subscribed` to prefill the box (`getSubscriberStatus`). Never silently revives an unsubscribe → returns `needsResubscribeConfirm`; submit + edit success screens show `ResubscribePrompt` → public `POST /api/newsletter/resubscribe` (rate-limited, `RATE_LIMITS.resubscribe`). All `notify_*` code refs removed; tsc + build green.
   - ⚠️ **DB column drop is a SEPARATE manual step, AFTER this deploys** (currently-live code still uses the column): `alter table newsletter_submissions drop column notify_for_future_newsletters;` — run by hand in Supabase. Harmless to leave until then (inserts omit it; default fills in).
4. ✅ **Resident writer** (done 2026-06-18) — `/api/residents` POST create + PUT self-edit now write `newsletter_subscribers` (source `resident`). Subscribable involvement (`isSubscribableInvolvement` in new pure `lib/newsletterEligibility.ts`, shared client+server) → `upsertSubscriber`; on edit a non-subscribable involvement → `unsubscribeByEmail` (explicit de-opt, actor `self`). Never silently revives → API returns `needsResubscribeConfirm`; `K9FamilyClient` asks via confirm() then hits `POST /api/newsletter/resubscribe` (now accepts `source: 'resident'`). `ProfileForm` shows an amber info message under the involvement select when the choice won't receive the newsletter. tsc + build green.

## Resolved decisions (settled with Cami 2026-06-18)
- **Resubscribe endpoint security:** ✅ **(a) — keep it simple.** Confirm resubscribe by raw email; low risk for an alumni list (worst case someone gets re-added and clicks unsubscribe once). No token gate, no double opt-in.
- **De-opting involvement** on a resident: ✅ **YES, unsubscribe.** (Reverses the earlier "default no.") The involvement selector has its own newsletter-relevant entry; switching away is an explicit signal. Show an info message under the control warning the user, and audit `newsletter_unsubscribed`. See "Resident wiring" above.
- **Manual-add path:** ✅ **Inform the admin** when the email previously unsubscribed — surface the resubscribe-confirm so the admin sees *"this user chose to unsubscribe"* before re-adding (don't silently resurrect).

## Migration SQL to write (Phase 1 + Phase 3)
- ~~`migrations/*.sql`~~ — **this project does schema by hand**, no migration files. Phase 1 table SQL already run in Supabase. Phase 3 drop (`alter table newsletter_submissions drop column notify_for_future_newsletters;`) is the only pending one — run by hand AFTER the Phase 3 deploy is live.

---

# Phase 5c — send + reminder (scoped 2026-06-18, the final blocker)

> ⚠️ **Reply-to model changed (2026-06-19): NO per-send reply-to input.** Reply-to is now configured **per issue** in the newsletter draft editor and stored in a new `newsletters.data` jsonb bag (`data.email_reply_to`). SQL run by hand: `alter table newsletters add column data jsonb not null default '{}'::jsonb;`. Helpers in `lib/newsletter.ts`: `replyToOf(newsletter)`, `getEffectiveReplyTo()` (active draft → latest newsletter → `ADMIN_DEFAULT_REPLY_TO` env fallback). A new draft prefills reply-to carried forward from the most recent issue. The reminder send route + page now read it server-side via `getEffectiveReplyTo()` (the per-send input was removed). **When building the Send page: read reply-to from the newsletter's `data.email_reply_to` (via `replyToOf`), do NOT add a reply-to input.** The `data` bag is also the intended home for write-once send-time snapshots (e.g. `sent_count`); do NOT put high-frequency counters (view counts) there — derive from `audit_logs`.

**Status:** ✅ **DONE (send built 2026-06-19) — Phase 5c complete, newsletter feature finished.**

- **Reminder** (done 2026-06-18): shared `lib/resend.ts` + `lib/newsletterEmail.ts` reminder builder, `getActiveSubscribers` returns token, `getReminderSendLog`, `POST /api/admin/newsletter/reminder/send` (all/test/retry-failed), `/admin/newsletter/reminder` page+client.
- **Send** (done 2026-06-19): `buildNewsletterEmailHtml` (announcement: masthead+title+intro+"Read the newsletter →"; subscriber footer = unsubscribe link, contributor-only footer = "you submitted a post" line). `subscribers.getUnsubscribedEmails()` (suppression set); `newsletter.getNewsletterContributorEmails(id)` + `getNewsletterSendRecipients(newsletter)` (active ∪ contributors − unsubscribed, subscriber entry wins; draft uses unassigned pool, sent uses assigned); `audit.getNewsletterSendLog(id)`. `POST /api/admin/newsletter/[id]/send` (all = finalize then mail; retry-failed; test-to-one) logs `newsletter_email_sent` per recipient with `recipient_source: 'subscriber'|'contributor'`. `/admin/newsletter/[id]/send` page + `SendClient` (recipient count, reply-to notice read from issue, quota strip, email preview, Send/Re-send, test send, send log + retry). Reply-to read from the issue (`replyToOf` → `getEffectiveReplyTo` fallback), NO per-send input. tsc+build green; auth smoke-tested (route 401, page 307). ⬜ **Not yet live-tested with a real send** — do the test-to-self dry run (single prod DB + real Resend).

The send flow. With the subscriber model in place, decisions settled with Cami:
- **Email format:** announcement email (masthead + title + intro + "Read the newsletter →" button to `/newsletter/n/[token]` + unsubscribe footer). NOT the full newsletter inline — the token page already renders it.
- **Newsletter recipients:** **active subscribers ∪ this edition's contributors**, deduped by lowercased email, **minus anyone explicitly unsubscribed** (a `newsletter_subscribers` row with `status='unsubscribed'` always suppresses — not opting into future newsletters is NOT the same as unsubscribing).
  - *Active subscribers* = `newsletter_subscribers` where `status='subscribed'` (have a token).
  - *This edition's contributors* = emails on the submissions assigned to this newsletter (after finalize, `newsletter_id = id`) — they get the issue they're in **regardless of the future-subscribe checkbox**, and are **NOT added to the ongoing list** (one-time for this send).
- **Reminder recipients:** active subscribers, **MINUS anyone who already posted to the upcoming edition** (emails in the current unassigned-submissions pool — no point nudging someone to "add your news" when they already did). Still minus explicit unsubscribers. No per-send manual box.
- **Scope:** build send AND reminder together.

### Email footer — two variants, NO signed-email unsubscribe (simplified with Cami)
- **Subscriber recipients** → unsubscribe footer link `?token=<unsubscribe_token>` (they're on the ongoing list).
- **Contributor-only recipients** (not subscribers) → **no unsubscribe link**; instead an explanatory line: *"You're getting this email because you submitted a post to this newsletter."* It's a one-off tied to an action they just took, not an ongoing subscription. (Explicit unsubscribers are already excluded from the recipient set, so this never reaches someone who opted out.)
- Dropped the earlier HMAC signed-email idea entirely — no `lib/unsubscribeLink.ts`, no `?u=`, no `suppressByEmail`.

## Behaviour
- **Send** = `finalizeAndSendNewsletter(id)` first (scoop + freeze + `status='sent'`), then Resend calls sequentially ~100 ms apart. Each recipient gets the announcement email with a personalised footer link `${BASE_URL}/newsletter/unsubscribe?token=${unsubscribe_token}` (+ a `List-Unsubscribe` header). Reply-to comes from the admin (required input, prefilled from `ADMIN_DEFAULT_REPLY_TO`).
- **Every recipient logged** to `audit_logs` as `newsletter_email_sent` (success or failure) with `details = { newsletter_id, recipient_email, recipient_name, recipient_source:'subscriber', resend_message_id?, status:'sent'|'failed', error_message?, reply_to }`. Already counted by `getEmailsSentInLast24h()`.
- **Re-send / retry-failed:** finalize is idempotent (no-op once sent). "Retry failed only" re-sends just the emails whose latest attempt for this newsletter was `failed` (failed-minus-later-succeeded, from the audit log).
- **Test send:** a "send a test to one email" field that renders the same email (draft token link works — a draft renders the live preview) WITHOUT finalizing the newsletter or writing a quota-counted audit row. This is the safe path for the first dry-run to your own inbox (single prod DB + real Resend).
- **Reminder:** same recipients (active subscribers) + same unsubscribe footer. Body: "The next newsletter is coming — add your news at `/newsletter/submit`." Logged `newsletter_reminder_sent` with `details.newsletter_id = null`.
- **Quota strip:** green/yellow/red on `sentLast24h + recipientCount` vs `RESEND_DAILY_LIMIT`. Warning only, never blocks.

## Files
**New**
- `src/lib/resend.ts` — shared Resend client, `NEWSLETTER_FROM`, `baseUrl()`, and `resendDailyLimit()` (lifted from the dashboard page + email-quota route, dedup).
- `src/lib/newsletterEmail.ts` — `buildNewsletterEmailHtml({ newsletter, readUrl, unsubscribeUrl })` + `buildReminderEmailHtml({ submitUrl, unsubscribeUrl })` (inline-styled; masthead = `header_image_url` ?? default).
- `src/app/api/admin/newsletter/[id]/send/route.ts` — `POST` (modes: full send / retry-failed / test-to-one), `requireAdminAuth`.
- `src/app/admin/newsletter/[id]/send/page.tsx` (server-gated, loads newsletter + recipient count + quota + send-log) + `SendClient.tsx`.
- `src/app/api/admin/newsletter/reminder/send/route.ts` — `POST`, `requireAdminAuth`.
- `src/app/admin/newsletter/reminder/page.tsx` (server-gated, loads recipient count + quota + reminder log) + `ReminderClient.tsx`.

**Modified**
- `src/lib/subscribers.ts` — `getActiveSubscribers()` returns `{ email, name, unsubscribe_token }` (token needed for footer links); add `getUnsubscribedEmails()` (suppression set).
- `src/lib/newsletter.ts` — add a contributors-by-newsletter email accessor (export `getSubmissionsByNewsletterId` or a thin `getNewsletterContributorEmails(id)`); remove now-dead `resolveRecipients` / `RecipientEntry` / `RecipientSource`.
- `src/lib/audit.ts` — `getNewsletterSendLog(newsletterId)` + `getReminderSendLog()` (recent), for the audit tables + retry-failed set.
- `src/app/admin/newsletter/page.tsx` + `AdminNewsletterClient.tsx` — use the lifted `resendDailyLimit()`; the existing Send / Re-send / reminder links now resolve instead of 404.
- (No changes to the unsubscribe route/page — contributor recipients get an explanatory line, not an unsubscribe link.)

## Recipient computation
**Newsletter send (edition `id`):**
1. `finalizeAndSendNewsletter(id)` → contributors are now `newsletter_id = id`.
2. `active = getActiveSubscribers()` → `{email, name, token}` (subscriber footer = `?token=` link).
3. `contributors = getNewsletterContributorEmails(id)` → `{email, name}` (contributor footer = "you submitted a post" line).
4. `unsub = getUnsubscribedEmails()` → Set.
5. recipients = dedupe(active ∪ contributors) by `lower(email)`, drop any in `unsub`. When an email is both, prefer the subscriber entry (so it gets the `?token=` unsubscribe link).

**Reminder:**
1. `active = getActiveSubscribers()`.
2. `posted = ` emails in the current unassigned-submissions pool (`getUnassignedSubmissions`).
3. `unsub = getUnsubscribedEmails()`.
4. recipients = `active` minus `posted` minus `unsub`.

## Not in scope / deferred
- Full inline-HTML newsletter email (chose announcement-link instead).
- Per-send ad-hoc manual recipient box (use the subscribers page).
- One-click `List-Unsubscribe-Post` (header points at the GET confirm page only — our POST endpoint expects a JSON token body, not RFC 8058 one-click).

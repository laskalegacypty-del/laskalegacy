# Website Intake (`/websites`)

A productized service: small businesses fill in a 7 step form, pay R500 via PayFast, and you receive a complete,
ready to paste Claude Code prompt plus a `settings.json` for the future design studio.

## How it works

1. Client opens `/websites` (linked as **Websites** in the main nav) and completes the wizard. Progress autosaves in their browser.
2. Images upload straight to Supabase Storage through a server issued signed URL, then the server inspects the real bytes (PNG, JPG, WEBP, or SVG for logos only; max 5 MB; scripts in SVGs are rejected).
3. On submit, `POST /api/websites/submit` validates everything again, rate limits (5 per hour per IP), checks the honeypot, builds `settings_json` and `generated_prompt`, saves the row, and sends two emails (client confirmation, owner notification).
4. The client sees **Pay R500 to start** (PayFast). PayFast calls `/api/websites/payfast/notify` (ITN), which marks `payment_status = paid` only after the signature, amount, and PayFast's own server confirmation all check out.
5. You open the shop **Admin**, then **Website Briefs**, open a brief, and use **Download .md for Claude Code**, **Copy prompt** or **Download all assets (zip)**. Do not start work on unpaid briefs.

## Setup

### 1. Run the migration
Supabase SQL Editor, paste `supabase/migrations/020_website_submissions.sql`, run. It creates `website_submissions`, `website_rate_limits`, and the `website-assets` bucket. RLS is on with **no public policies**: the browser cannot read or write the tables at all; only the API routes (service role) can.

### 2. Admin
Briefs live in the shop Admin under **Website Briefs**. The page asks the server for data using your shop admin password, so set `WEBSITE_ADMIN_PASSWORD` (in quotes if it contains `#`) to the same password you use to sign in to Admin. That password is also in the browser code, so this is exactly as private as the rest of your Admin.

### 3. Environment variables
Copy the new block in `.env.local.example` into `.env.local` (and into Vercel, Settings, Environment Variables):

| Variable | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Supabase, Settings, API, `service_role`. Never prefix with `NEXT_PUBLIC_`. |
| `WEBSITE_ADMIN_PASSWORD` | Must match your shop Admin password. |
| `OWNER_EMAIL` | Where new submission alert emails go. |
| `WEBSITE_PAYFAST_ENABLED` | `false` skips the built-in PayFast screen so you can send your own payment link. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Emails via [Resend](https://resend.com). Without a key, emails are skipped and logged. Verify your sending domain for `EMAIL_FROM`. |
| `OWNER_CONTACT_EMAIL`, `OWNER_CONTACT_WHATSAPP` | Shown in the client's confirmation email (defaults to the site's contact details). |
| `WEBSITE_TURNAROUND` | Wording for expected turnaround in the confirmation email. |
| `NEXT_PUBLIC_SITE_URL` | Used for PayFast return and notify URLs and admin links. Defaults to `https://laskalegacy.co.za`. |
| `PAYFAST_SANDBOX` | `true` (default) uses sandbox. |
| `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE` | Blank in sandbox uses PayFast's public test merchant. |

### 4. Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000/websites. PayFast's ITN webhook cannot reach localhost; to test payment end to end locally, tunnel with `cloudflared tunnel --url http://localhost:3000` and set `NEXT_PUBLIC_SITE_URL` to the tunnel URL.

## Going live with PayFast (TODO)
1. Create a live PayFast merchant account and set a passphrase.
2. In Vercel set `PAYFAST_SANDBOX=false`, `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`.
3. Make one real R500 payment and confirm the row flips to `paid`.

## Deploy
Push the branch, merge, and Vercel deploys as normal. Add the env vars above to Vercel first, and run the migration on the production Supabase project.

## Changing fields later
- Field defaults and validation: `lib/websites/schema.js` (`emptyAnswers()` plus the `validate*` function for that step). This file is shared by browser and server.
- The form UI for each step: `components/WebsiteIntake.jsx` (`StepAbout`, `StepContact`, ...).
- What goes into `settings.json` and the prompt: `lib/websites/build.js` (`buildSettings`, `buildPrompt`).
- Lists (provinces, industries, call to action options, fonts, vibes, price): constants at the top of `schema.js`.
- Because answers are stored as JSONB, adding a field needs no migration. Old drafts in a visitor's browser are merged onto the new shape automatically.

Sample output: [`docs/website-intake-sample-prompt.md`](docs/website-intake-sample-prompt.md).

## Notes and limits
- Uploaded files are in a **public-read** bucket under random UUID folders with no listing, so URLs in the prompt keep working for the built site. Anyone with the exact URL can view the file.
- Files uploaded by someone who never submits are orphaned in storage. Clear out folders whose id is not in `website_submissions` occasionally.
- `website_rate_limits` grows over time. Safe to delete rows older than a day.
- The promo page is the **Websites** tab in the shop nav (`components/WebsitesPromo.jsx`); its buttons open the form at `/websites`.

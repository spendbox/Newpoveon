# Setting up and launching HealthCheck

Plain-English steps. Do them in order. Each part switches on a feature:
the app works without them, and that feature just shows a friendly "not switched on yet" message.

| Part | Switches on | Time |
|---|---|---|
| 1. Vercel | The website itself, with a link you can open on your phone | 10 min |
| 2. Supabase | Saving results, accounts, bookings, requests | 20 min |
| 3. Resend | Results emails, booking confirmations, team notifications | 15 min (plus DNS wait) |
| 4. Paystack (test mode) | Doctor consult payments | 10 min |
| 5. Admin set-up | Doctor times, test prices, helpline number | 15 min |

> **Never paste keys into chat, email or WhatsApp.** Keys go only into Vercel → Settings → Environment Variables.
> Every key name is listed, with where to find it, in [`.env.example`](../.env.example).

---

## 1. Vercel (hosting)

1. Go to **vercel.com** and sign up with your GitHub account.
2. **Add New → Project**, then pick the `Newpoveon` repository and press **Deploy**. Leave all build settings as they are.
3. When it finishes you get a link like `newpoveon.vercel.app`. Open it on your phone: the homepage and the full check already work.
4. In the project: **Settings → Environment Variables**. Add `NEXT_PUBLIC_SITE_URL` (your Vercel link for now) and `NEXT_PUBLIC_WHATSAPP_NUMBER`.
   After changing variables, go to **Deployments → ⋯ → Redeploy** so they take effect.

## 2. Supabase (database and login)

1. Go to **supabase.com → New project**. Pick a strong database password and save it in a password manager.
   Region: Supabase has no African region, so pick **London (eu-west-2)** or **Frankfurt**. Your privacy notice must mention this (see the NDPA note in `/privacy`).
2. **SQL Editor → New query**. Paste the whole of `supabase/migrations/20261117000000_init.sql` and press **Run**. You should see "Success".
   Then do the same with `supabase/migrations/20261118000000_lab_packages.sql` (lab packages) `supabase/migrations/20261118100000_password_login.sql` (email + password accounts) `supabase/migrations/20261118200000_care_plans.sql` (care plans and pricing) `supabase/migrations/20261118300000_family_care.sql` (care for your parents) `supabase/migrations/20261119000000_consults_and_schedule.sql` (consult types, fees and weekly availability) and `supabase/migrations/20261120000000_voice_notes.sql` (private voice notes for doctor bookings).
3. **Project Settings → API**. Copy these into Vercel's Environment Variables:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon / publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role / secret key → `SUPABASE_SERVICE_ROLE_KEY` (secret!)
4. **Authentication → URL Configuration**:
   - Site URL: your website address (for example `https://healthcheck.yourdomain.com`)
   - Redirect URLs: add `https://YOUR-DOMAIN/auth/callback` and `https://*-YOUR-VERCEL-TEAM.vercel.app/auth/callback` (for preview links)
5. **Authentication → Providers → Email**: make sure Email is on. Set **Minimum password length** to 10.
   New people confirm their email with a **one-time code**, choose a password, and from then on log in with email + password.
   Login codes are emailed by the app through **Resend** (step 3), so Supabase's email limits and templates don't matter.
6. Supabase only sends emails as a fallback if Resend isn't set up yet. Nothing to change here.
7. Add `TEAM_NOTIFICATION_EMAIL` in Vercel, then redeploy.

## 3. Resend (emails)

1. **resend.com → Domains → Add domain**, and enter your domain (for example `yourdomain.com`).
2. Resend shows a few DNS records (TXT and MX). Add them where you bought your domain (for example Whogohost, Qservers, GoDaddy or Namecheap).
   It can take from a few minutes to a day to show as **Verified**.
3. **API Keys → Create API key** ("Sending access"). Put it in Vercel as `RESEND_API_KEY`.
4. Set `EMAIL_FROM`, for example `HealthCheck <hello@yourdomain.com>`, and redeploy.

## 4. Paystack (test mode first)

1. **dashboard.paystack.com** → make sure the toggle at the top says **Test Mode**.
2. **Settings → API Keys & Webhooks**:
   - Copy the **Test Secret Key** (`sk_test_…`) to Vercel as `PAYSTACK_SECRET_KEY`.
   - Set **Test Webhook URL** to `https://YOUR-DOMAIN/api/paystack/webhook`.
3. Leave `PAYSTACK_LIVE_MODE=false`. The app refuses live keys until this says `true`, so real money can't be taken by accident.
4. Redeploy, then book a test consult. Paystack's test card details are on their "Test Payments" help page.
   You should land on the "You're booked!" page and receive the confirmation email.

## 5. Admin set-up

1. In Vercel, set `ADMIN_EMAILS` (your email) and `ADMIN_PASSWORD` (at least 12 characters), and redeploy.
   Then go to `https://YOUR-DOMAIN/admin` and log in with that email and password.
   To change the password later, change `ADMIN_PASSWORD` in Vercel and redeploy (everyone is logged out).
2. **Availability:** set your weekly hours once (they repeat every week), add closed days and extra hours, and set consult length and notice. Booked times disappear automatically.
   **Consults and fees:** set the fee for each kind of help (a type with no fee is hidden).
3. **Lab tests:** 16 standard packages and 10 single tests are loaded (full health checks, heart, diabetes, women, men, fertility, sexual health, pre-marital, pregnancy and more). Set a price for each (blank shows "Price on request"), edit what's included, hide what you don't offer, and add your own packages.
4. **Pricing and Care plans:** in **Pricing**, enter what each building block costs you and your target markup (4× = 75% margin). In **Care plans**, every plan shows its cost, price, markup and margin; type a fixed price on any plan to override the automatic one. Switch a goal on when its plans are ready.
5. **Emergency contacts:** replace the **mental health helpline placeholder** with a verified number. Until then it stays hidden, and only 112 shows.

---

## Launch checklist

Tick everything before telling the public.

**Medical and legal**
- [ ] A clinician signs off on the heart age "healthy" values (`HEART_AGE_REFERENCE` in `src/config/site.ts`).
- [ ] A clinician agrees to stretching the WHO model down to age 30, shown as an "early estimate" (`EXTENDED_MIN_AGE` in `src/config/site.ts`; set it to 40 to switch this off).
- [ ] A clinician checks each tool against its official form, and the status mappings (see `SCREENING_TOOLS.md`).
- [ ] STOP-Bang commercial-use permission confirmed with University Health Network (stopbang.ca).
- [ ] FINDRISC commercial-use conditions confirmed with the Finnish Diabetes Association.
- [ ] A verified mental health helpline number added in Admin → Emergency contacts.
- [ ] Privacy notice and terms reviewed by a lawyer or data-protection adviser. Fill in every `[PLACEHOLDER]`.
- [ ] NDPA: register or file with the Nigeria Data Protection Commission as required for your size, and record the cross-border transfer to Supabase, Resend and Vercel.

**Accounts and settings**
- [ ] Own domain connected: Vercel → Settings → Domains → add `healthcheck.yourdomain.com` and follow the DNS instructions.
- [ ] `NEXT_PUBLIC_SITE_URL` changed to the real domain, then redeployed.
- [ ] Supabase Site URL and Redirect URLs use the real domain.
- [ ] Resend domain shows Verified. Supabase custom SMTP is switched on.
- [ ] A test run works end to end: check → email arrives → log in → edit an answer → history shows the change → share link on/off → test booking paid → home test request reaches the team inbox.

**Going live with Paystack (only when you say so)**
- [ ] Paystack business verification complete (Live Mode unlocked).
- [ ] Vercel: `PAYSTACK_SECRET_KEY` = the **Live** Secret Key (`sk_live_…`) and `PAYSTACK_LIVE_MODE=true`.
- [ ] Paystack: **Live Webhook URL** = `https://YOUR-DOMAIN/api/paystack/webhook`.
- [ ] Redeploy, then make one real ₦5,000 booking and refund it from the Paystack dashboard.

**Good to add soon**
- [ ] Turn on Vercel's firewall or rate limiting for `/api/*` to slow down spam (Vercel → Firewall).
- [ ] Back-ups: on Supabase's paid plan, daily back-ups are automatic.

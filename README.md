# Poveon

Poveon is a free, mobile-first self-screening app. People answer friendly
questions (about 10 minutes) and get their heart age, diabetes risk, sleep, mood and more. If
something looks worrying they can book a doctor consult, order a home test or request
medication delivery.

- **Setting it up and launching:** [docs/SETUP.md](docs/SETUP.md)
- **Every screening tool, its source and licence:** [SCREENING_TOOLS.md](SCREENING_TOOLS.md)
- **Every setting and key:** [.env.example](.env.example)
- **Look and feel:** [design-reference/DESIGN.md](design-reference/DESIGN.md)

The name "Poveon", the WhatsApp number, the consult price and other settings are in
[`src/config/site.ts`](src/config/site.ts).

## What's where

| Folder | What it is |
|---|---|
| `src/app/` | The pages: `/` homepage, `/check` questions, `/results`, `/doctor` booking, `/home-tests`, `/medication`, `/account`, `/login`, `/admin`, `/s/…` share links, `/privacy`, `/terms` |
| `src/app/api/` | Server endpoints (saving results, bookings, Paystack webhook, share links, requests) |
| `src/lib/questions.ts` | The one smart questionnaire, with gate questions |
| `src/lib/scoring/` | The scores (WHO heart risk, FINDRISC, STOP-Bang, PHQ, GAD, AUDIT-C…) and their tests |
| `src/components/` | Buttons, answer tiles, result cards, illustrations, safety screen |
| `supabase/migrations/` | The database, with row-level security |
| `design-reference/` | The design system, illustrations and mockup |

## Built for doctors and labs later

Logins already have a role (`user`, `admin`, `doctor`, `lab`), and there is an `organisations` table
for labs and clinics. Availability slots have a `doctor_id`. The lab request system can be added as new
tables and pages without changing what's here.

## For developers

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional for local use
npm run dev                  # http://localhost:3000
npm test                     # scoring + payment tests
npm run test:db              # runs the migration in an in-memory Postgres and checks row-level security
npm run illustrations        # after editing SVGs in design-reference/illustrations
```

Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Framer Motion, Supabase, Paystack, Resend, Vercel.
`scripts/who_reference.py` regenerates the independent WHO reference values used in the tests.

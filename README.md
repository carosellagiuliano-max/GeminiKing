# SALON EXCELLENCE

Next.js 15 / React 19 App-Router-Projekt für den Premium-Salon «Salon Excellence». Das Projekt bildet die Grundlage für den
kompletten Umsetzungs- und Absicherungsplan aus `PLAN.md` und `ARCHITEKTUR.md`.

## Quickstart

```bash
pnpm install
pnpm dev
```

- Weitere Befehle:

  - `pnpm lint` – ESLint (Next.js Konfiguration)
  - `pnpm typecheck` – TypeScript im Strict-Modus
  - `pnpm build` – Produktionsbuild
  - `pnpm format` – Prettier Formatierung
  - `pnpm test` – Vitest-Suite (Slot-Engine u. a.)

## Netlify

Das Repository enthält eine `netlify.toml` mit dem offiziellen Next.js Plugin sowie zwei Scheduled Functions:

- `reminders` (03:00 UTC) – Erinnerungen 24h vor dem Termin
- `reconcile-sumup` (03:10 UTC) – Abgleich offener SumUp-Zahlungen

Webhooks für Stripe/SumUp sowie Reminder-/Reconcile-Funktionen liegen in `netlify/functions` und greifen auf den Supabase Service Role Key zu.

## Environment

Alle notwendigen Variablen findest du in `.env.example`. Für lokale Entwicklung benenne die Datei nach `.env.local` und setze die
Werte aus deinen Accounts (Supabase, Stripe, SumUp, Resend etc.). Zusätzlich stehen optionale Integrationen bereit:

- Upstash Redis (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) für ein persistentes Rate-Limit in Serverless-Umgebungen.
- Sentry (`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_TRACES_SAMPLE_RATE`) zur Fehler- und Performance-Überwachung.
- Resend-Header für One-Click-Unsubscribe (`RESEND_LIST_UNSUBSCRIBE_MAILTO` / `RESEND_LIST_UNSUBSCRIBE_URL`).

## Struktur

- `app` – App Router (Marketing-Seiten, Buchungs-Wizard, Portal, Admin, API-Routen für Slots/SumUp Return etc.)
- `components` – UI-Bausteine inkl. Booking-Wizard & Login-Formular
- `public` – Assets (Platzhalter, kann für Logos/Manifest genutzt werden)
- `netlify/functions` – Webhooks/Scheduled Functions (Stripe, SumUp, Reminder, Reconcile)
- `supabase/migrations` – SQL-Migrationen inkl. RLS/Seeds
- `tests` – Vitest-Suite für kritische Logik

Weitere Architektur- und Umsetzungsschritte sind in `ARCHITEKTUR.md` dokumentiert.

SALON EXCELLENCE – Architektur & Entscheidungen (ADRs)
===============================================

## Überblick

- **Frontend:** Next.js 15 (App Router, RSC/Streaming), React 19, TypeScript strict, Tailwind v4, shadcn/ui.
- **Backend:** Supabase (Postgres + Auth + Storage, RLS), Next Route Handlers (Node runtime), Netlify Functions (Webhooks/Scheduled).
- **Payments:** Stripe Checkout (CHF, Dynamic Payment Methods), SumUp (Vor-Ort/Links).
- **Mail:** Resend + React Email; ICS (ical-generator, TZ Europe/Zurich).
- **Zeit:** Server UTC, UI Europe/Zurich (Luxon), ICS mit VTIMEZONE.
- **Observability:** optional Sentry.

## Domänenmodell (vereinfacht)

- Service (Dauer, Puffer)
- Staff (Skills, Standort/Kanton, Verfügbarkeiten/Time-off)
- Appointment (PENDING/CONFIRMED/…, start/end timestamptz)
- Resource (Kapazitäten)
- Zahlung (Stripe/SumUp IDs, Status)

## Kernentscheidungen (ADRs)

### EXCLUDE-Constraint statt nur Applikationslogik
- **Warum:** DB-seitige Garantie gegen Doppelbuchungen; performant; einfach zu testen.
- **Konsequenz:** btree_gist Aktivierung, Range-Spalte via `tstzrange(start,end,'[]')`.

### Stripe Checkout mit Dynamic Payment Methods
- **Warum:** Keine harte Methodenliste; Anzeige optimiert nach Währung/Kontext; reduziert Pflege.

### Webhook-Quelle der Wahrheit
- **Warum:** GET-Success-Page ist nicht zuverlässig/idempotent; Webhooks bestätigen Zahlung. Raw-Body Pflicht.

### ICS mit VTIMEZONE
- **Warum:** DST-Korrektheit in allen Kalendern; `TZID=Europe/Zurich`.

### Rate-Limit Header
- **Warum:** Standardisierte Client-Steuerung; wählen RateLimit/RateLimit-Policy (neu) oder konservativ das RateLimit-*-Trio – kompatibel kommuniziert.

### Sitemap/Robots via App Router
- **Warum:** Kein zusätzliches Paket, native DX/SSR-Friendly.

## Sicherheitsmassnahmen

- CSP inkl. Stripe/SumUp; frame-src/connect-src korrekt; HSTS, nosniff, strict-origin-when-cross-origin.
- RLS strikt; Storage-Policies auf `storage.objects` (signed URLs für Bilder).
- Secrets nur serverseitig; Idempotenz-Keys bei Zahlungen.

## SEO & LocalBusiness

JSON-LD `LocalBusiness` / `HairSalon` mit Adresse/Öffnungszeiten/Geo.

## Changelog (Auszug)

- **v0.1.0:** Repo/Netlify-Gerüst
- **v0.2.0:** DB + RLS + EXCLUDE
- **v0.3.0:** SSR/Auth + Sitemaps/Robots
- **v0.4.0:** Slots
- **v0.5.x:** Booking + Stripe/SumUp
- **v0.6.0:** Webhooks/Schedule
- **v0.8.x:** Portale/ICS/Mails
- **v0.9.x:** Security/Rate-Limit/Tests
- **v1.0.0:** Release

Hinweis: Technische Details zu Tests & Runbook siehe README.md.

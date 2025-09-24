# CLAUDE.md

## Architekturüberblick
- **Frontend:** Next.js App Router (React 19) mit Tailwind CSS und shadcn/ui-Komponenten.
- **Backend:** Next.js Route Handler und Netlify Functions, die per Supabase-Service-Client auf die Postgres-DB zugreifen.
- **Datenbank:** Supabase-Schema gemäss `supabase/migrations/0001_init.sql` mit RLS-Policies.
- **Payments:** Stripe Checkout (Online) und SumUp (Vor Ort) via Netlify Functions.
- **E-Mails:** Resend + React Email Templates, ICS-Anhänge über `lib/ics`.

## Entscheidungsnotizen
1. **Serverseitige Zahlungsbestätigungen:** Buchungsbestätigungsmails werden ausschliesslich innerhalb der Stripe- bzw. SumUp-Webhooks versendet, damit Zahlungen sicher bestätigt sind.
2. **Rate-Limiting:** Standardmässig In-Memory, optional Supabase-basierte Persistenz via `analytics_events`, gesteuert über `RATE_LIMIT_PERSISTENCE`.
3. **Kontaktformular:** Clientseitige Validierung mit React Hook Form und serverseitige Absicherung via Rate-Limit und Resend-Versand.

## Checkliste
- [x] Sicherheitsheader inkl. CSP für Stripe, Supabase und SumUp.
- [x] Kontakt-API mit Validierung und Rate-Limit.
- [x] Zahlungswebhooks aktualisieren und Bestätigungsmails dort versenden.
- [x] Entwicklerdokumentation (README & CLAUDE).

## Changelog
- **2024-07-05:** Dokumentation ergänzt, Rate-Limit erweitert, Webhook-Flows gehärtet und Kontaktformular mit Backend verdrahtet.

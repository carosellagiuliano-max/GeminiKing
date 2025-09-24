SALON EXCELLENCE – Umsetzungs- & Absicherungsplan (de-CH)

0) Projektgrundsätze (Leitplanken)

Single Source of Truth für Auth/Rollen: profiles.role (FK zu auth.users.id) + optionaler Custom JWT Claim. Nie Policies über auth.role().

Zeitkonzept: Server in UTC, UI in Europe/Zurich (Luxon). ICS mit TZID=Europe/Zurich + VTIMEZONE ⇒ DST stabil (sommer-/winterzeitfest).

Währungen: Stripe in CHF (Rappen); UI-Formatierung via Intl.NumberFormat('de-CH',{currency:'CHF'}).

CSP/Headers strikt, keine Secrets im Client; Payment-Domains (Stripe/SumUp) whitelisten.

IETF Rate-Limit Header ausliefern (RateLimit/RateLimit-Policy oder konservativ RateLimit-Limit/-Remaining/-Reset – je nach Kompatibilität).

Build/Zielplattform: Next.js 15 App Router, React 19, Tailwind v4, Netlify Next-Plugin + Scheduled Functions.

1) Repo & Basis (Tag v0.1.0)

Ziel: Lokales Gerüst + Netlify-Build lauffähig (ohne Business-Logik), TypeScript strict, ESLint, Prettier.

Skeleton erzeugen (Next 15, App Router, TS, Tailwind v4). Prüfe React 19.

Netlify: netlify.toml mit @netlify/plugin-nextjs, Functions Bundler esbuild, Scheduled Functions (Reminders 03:00 UTC, Reconcile 03:10 UTC).

Strict Headers in next.config.ts / headers() (CSP siehe §10). Bild-Domains für Teamfotos/Stripe.

ENV: .env.example (siehe Liste in deinem Prompt).

2) Datenbankentwurf & Migration 0001 (Tag v0.2.0)

Ziel: Vollständiges Schema + RLS aktiviert, Exclusion-Constraint gegen Doppelbuchungen.

Extensions: btree_gist (für EXCLUDE).

Enums: role{ADMIN,STAFF,CUSTOMER}, appointment_status{PENDING,CONFIRMED,CANCELLED,COMPLETED}, payment_status{UNPAID,PAID,REFUNDED,PARTIAL}, cms_status{draft,published}.

Tabellen:

profiles (id=auth.users.id, role, …)

customers, locations (kanton), services, staff, staff_services (ggf. Dauer-Override), availability_blocks, time_off, resources

appointments (id, staff_id, customer_id, location_id, start timestamptz, end timestamptz, status, payment_status, …)

EXCLUDE: EXCLUDE USING GIST (staff_id WITH =, tstzrange(start,end,'[]') WITH &&); optional Filter auf status IN (PENDING,CONFIRMED). (Begründung/Pattern s. Quellen)

M:N appointment_resources, invoices, CMS, analytics_events.

RLS (aktivieren + Policies):

Kunden sehen/ändern nur eigene Datensätze (z. B. WHERE customer_id = auth.uid() via FK auf profiles).

Staff eingeschränkt (nur eigene Termine/Standort) – über Join auf staff.location_id.

Admin volle Rechte.

Public SELECT nur für aktive services, staff (ohne PII) & cms_blocks (published). (RLS-Basics & Helpers)

Storage-Policies (Teamfotos): private Bucket + signed URLs; Upload nur für Auth-User (Policies auf storage.objects).

Seeds: Admin-User (per Service-Role), Demo-Services/Staff/Slots.

3) Minimal-Pages & SSR/Auth (Tag v0.3.0)

Ziel: Öffentliche Seiten + Auth-Flows lauffähig; SSR-sichere Session.

Seiten: /, /services, /team, /contact, /legal/*, sitemap.xml, robots.txt.

SSR/Auth via @supabase/ssr (Middleware + Server Components). Nicht die alten Helpers verwenden.

Sitemaps/Robots: App-Router API verwenden (kein externes Paket nötig).

PWA (optional ab v1.1): Manifest/Service Worker gemäss Next-Guides.

4) Slot-Engine & Verfügbarkeiten (Tag v0.4.0)

Ziel: POST /api/slots liefert buchbare Slots.

Inputs: serviceId, Datum/Zeitraum, optional staffId.

Berücksichtigt: Service-Dauer + Puffer, staff_services, availability_blocks, time_off, bestehende appointments (EXCLUDE schützt DB-seitig), Ressourcen-Kapazität, Öffnungszeiten, kantonale Feiertage, DST.

Kantons-Feiertage: Schweiz variiert je Kanton ⇒ Holiday-Quelle modellieren (z. B. via lib), in jedem Fall Standort-Kanton berücksichtigen.

Zeitzonen/DST korrekt via Luxon; UI zeigt Europe/Zurich. ICS s. §8.

5) Buchung & Zahlungen (Tag v0.5.0)

Ziel: 4-Schritt-Wizard + Online-Zahlung (Stripe CHF, dynamische Methoden), Vor-Ort-Flow (SumUp Link/QR).

5.1 Wizard /booking

Step 1 Service → Step 2 Stylist → Step 3 Datum/Zeit (Slots) → Step 4 Details & Zahlung.

Termin-Erstellung: initial PENDING (mit Idempotenz-Key bei Zahlungen).

5.2 Stripe (Online)

Checkout Session (Node Route Handler): Currency CHF, ohne hartes payment_method_types ⇒ Dynamic Payment Methods (TWINT erscheint automatisch, sofern im Stripe-Account aktiv und Währung/Kontext passt).

Metadata: appointmentId (für Reconciliation/Refunds).

Idempotency-Key: checkout-{appointmentId}.

success_url mit session_id={CHECKOUT_SESSION_ID}, cancel_url definiert.

Quelle der Wahrheit: Webhook checkout.session.completed (nicht nur Success-Page).

5.3 SumUp (Vor-Ort / Link)

Bei Vor-Ort: Termin PENDING, payment_status=UNPAID.

Payment-Link/QR erzeugen (SDK/REST), sumup_checkout_id speichern. Rückkehr via Return-URL (Netlify Function) – Status immer via GET /checkouts/{id} verifizieren; nur bei PAID|SETTLED ⇒ CONFIRMED+PAID.

Refunds via API möglich; benötigen OAuth Authorization Code Flow (kein blosser Client-Credentials-Flow).

6) Webhooks & Scheduled Functions (Tag v0.6.0)

Stripe (/.netlify/functions/stripe-webhook)

Raw-Body unverändert verifizieren (Achtung isBase64Encoded auf Netlify) – sonst Signaturfehler. Antworte schnell mit 2xx; verarbeite idempotent.

SumUp Return/Webhook (/.netlify/functions/sumup-webhook)

Status immer per API verifizieren (nicht der Return-Param blind vertrauen).

Reminders (/.netlify/functions/reminders, 03:00 UTC, +24 h Termine) & Reconcile (/.netlify/functions/reconcile-sumup, 03:10 UTC). (Scheduled Functions auf Netlify)

7) Portale & Admin (Tag v0.7.0)

/portal: Meine Termine (Storno/Umbuchung), Belege, Profil, Daten-Export (DSG/DSGVO).

/admin: Rollenbasiert (CMS, Services, Staff, Availability/Time-off, Ressourcen, Settings/Policies, Reports).

Charts only client-side via next/dynamic({ ssr:false }) (Recharts).

8) E-Mails & ICS (Tag v0.8.0)

Resend SDK + React Email für responsive Vorlagen (Bestätigung, Reminder, Storno).

ICS via ical-generator + zeitzonensichere VTIMEZONE-Definition (Europe/Zurich, METHOD:REQUEST, stabiler UID appointment.id@salon-excellence).

9) Middleware & Zugriffsschutz (Tag v0.8.1)

middleware.ts schützt /portal/* & /admin/* – SSR-Session via @supabase/ssr.

Rollenprüfung auf profiles.role='ADMIN'.

10) Security-Headers & CSP (Tag v0.9.0)

Headers (Production):

Content-Security-Policy:

default-src 'self';
script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com;
connect-src 'self' https://api.stripe.com https://m.stripe.network;
img-src 'self' data: blob: https:;
style-src 'self' 'unsafe-inline';
frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://*.stripe.com https://*.sumup.com;
worker-src 'self' blob:;

(Stripe Vorgaben beachten; ggf. img-src/worker-src ergänzen.)

Referrer-Policy: strict-origin-when-cross-origin

X-Content-Type-Options: nosniff

Permissions-Policy nur benötigte APIs

Strict-Transport-Security (HSTS) mit Preload für Prod.

Kein Secret im Client-Bundle.

11) Rate-Limiting (Tag v0.9.1)

Leichtes RL auf POST /api/slots, POST /api/contact, portal/* Mutationen.

Antworte mit IETF-konformen Headern: modern RateLimit/RateLimit-Policy (z. B. RateLimit-Policy: 60;w=60), alternativ Legacy-Trio RateLimit-Limit/Remaining/Reset – je nach Konsument. Status 429 bei Limit.

12) Performance, A11y, UX (laufend, Gate ab v1.0.0)

Budgets: LCP ≤ 2.5 s, CLS < 0.1, TBT < 200 ms.

Code-Splitting, next/image, Prefetch; Skeletons, optimistic UI, Toasts, Empty States.

A11y: ARIA-Labels, voll tastaturfähig, sichtbare Fokus-Indikatoren, Kontrast AA+, prefers-reduced-motion.

Dark/Light, 8pt-Grid, Tokens.

13) SEO & PWA

OG/Meta, JSON-LD LocalBusiness/Hair/BeautySalon mit Adresse/Öffnungszeiten/Geo.

App-Router: app/sitemap.ts, app/robots.ts; PWA (Manifest, SW) per offiziellen Guides.

14) Tests (Vitest + Playwright)

Unit (Vitest):

Slot-Engine (Puffer, Überschneidungen, Time-off, Ressourcen, kantonale Feiertage, DST).

CHF-Formatierung, ICS-Generator (TZID/DTSTART/DTEND).

DB-Constraints (EXCLUDE), Webhook-Idempotenz, RLS (Tenant-Isolation).

Zeit/DST deterministisch: process.env.TZ='UTC' im Setup + vi.setSystemTime bei Bedarf.

E2E (Playwright):

Online-Buchung → Redirect zu checkout.stripe.com assert; Stripe CLI/Webhook simuliert → Success sichtbar.

Vor-Ort (SumUp): PENDING → Return/Reconcile → bestätigt.

Portal Storno/Umbuchung, Admin CRUD, Öffentliche Seiten, SEO-Basics. (Playwright + Next Guide)

15) CI/CD, Betrieb & Backups

CI: Lint, Typecheck, Unit, E2E (mit lokalem Dev-Server), Deploy Preview (Netlify).

Backups/Migrationen: gepflegte SQL-Migrationen; supabase:reset Seeds.

Secrets-Rotation (Stripe/Resend/SumUp) – Schrittfolge dokumentiert.

Monitoring: Sentry Frontend/Backend (DSN), Healthcheck-Route, Alerts.

16) Risiken & Gegenmassnahmen

Webhook-Signatur (Stripe) bricht auf Netlify, falls Body mutiert → Raw-Body verwenden (event.body/Base64 beachten).

Kantonale Feiertage/DST → strenge Tests + ICS VTIMEZONE.

CSP-Blocker → Stripe/SumUp-Hosts exakt whitelisten, ggf. worker-src/img-src ergänzen.

Payment-Methoden → Stripe dynamisch aus Dashboard steuern (keine hardcodes).

Refunds (SumUp) → OAuth Authorization Code Flow sicher einrichten.

17) Abnahmekriterien (Definition of Done, v1.0.0)

Builds grün lokal & Netlify (SSR/ISR).

DB migriert + Seeds; RLS aktiv; EXCLUDE verhindert Doppelbuchungen.

Kernabläufe: 4-Schritt-Buchung, Stripe-Online, SumUp-Vor-Ort (+Return/Reconcile), Webhook-Logs OK.

Portale/Admin funktionsfähig; E-Mails mit ICS kommen an; Kalender-Import korrekt (DST).

Security: CSP/Headers, Secrets nur Server, Rate-Limit-Header sichtbar.

Tests: Vitest-Suite (inkl. DST/Feiertage, RLS, Idempotenz) & Playwright-E2E grün.

Nicht-funktional: de-CH, Performance-Budgets, A11y, SEO/JSON-LD, optional PWA.

18) Detaillierte Schrittliste (Checkliste zum Abhaken)

Repo, ENV-Vorlagen, Netlify-Config (Plugin + Scheduled) – commit v0.1.0.

SQL-Migration 0001 (Schema + EXCLUDE + RLS aktiviert) – v0.2.0.

Minimal-Pages, @supabase/ssr, robots/sitemap – v0.3.0.

Slot-Engine API + Feiertage/DST-Handling – v0.4.0.

Buchungs-Wizard + Stripe Checkout (Dynamic PMs) – v0.5.0.

SumUp Link/Return-Flow + Reconcile Job – v0.5.1.

Webhooks (Stripe Raw-Body; SumUp Verify) – v0.6.0.

Portale/Admin + E-Mail/ICS – v0.8.0.

Security-Headers, CSP, Rate-Limit – v0.9.0.

Tests (Vitest/Playwright) – v0.9.5.

Final Hardening (Perf/A11y/SEO/PWA) – v1.0.0.

19) Anhang: Snippets & Muster
19.1 Stripe Checkout – Erfolgs-Redirect

Warum? Session auf Success-Page verifizieren/anzeigen.
success_url: 'https://.../booking/success?session_id={CHECKOUT_SESSION_ID}'

19.2 Dynamic Payment Methods (Empfehlung)

Warum? Keine harte Liste, Anzeige abhängig Währung/Flow/Region.
Kein payment_method_types setzen; Steuerung im Dashboard.

19.3 ICS-Best Practices

Warum? Feiertage/DST robust, korrekte TZ.

cal.timezone('Europe/Zurich'), VTIMEZONE mitsenden.

20) Quellen (Auszug, thematisch)

Next.js 15 / React 19 / App Router: Release-Hinweise & Docs.

Tailwind v4 (Offiziell).

Netlify: Next-Plugin & Scheduled Functions.

Supabase SSR & RLS.

EXCLUDE / btree_gist (Postgres).

Stripe: Dynamic Payment Methods; Success-URL; Webhooks & Raw-Body.

SumUp: API/Refunds/OAuth; Payment-Widget.

ICS/VTIMEZONE (iCalendar/ical-generator).

Feiertage CH (kantonal unterschiedlich).

Rate-Limit Header (IETF).

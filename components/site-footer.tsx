import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 py-10 text-sm text-neutral-600">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8">
        <div className="max-w-sm space-y-3">
          <p className="text-base font-semibold text-neutral-900">SALON EXCELLENCE</p>
          <p>
            Premium Hair &amp; Beauty Atelier im Herzen von Zürich. Nachhaltige Produkte, individuelle Beratung und digitale
            Buchung mit Schweizer Präzision.
          </p>
          <p className="text-neutral-500">Seefeldstrasse 45, 8008 Zürich · +41 44 000 00 00</p>
        </div>
        <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:justify-end">
          <div>
            <p className="font-semibold text-neutral-900">Navigation</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/services" className="hover:text-primary-600">
                  Leistungen
                </Link>
              </li>
              <li>
                <Link href="/team" className="hover:text-primary-600">
                  Team
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary-600">
                  Kontakt &amp; Anreise
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Rechtliches</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/legal/impressum" className="hover:text-primary-600">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/legal/datenschutz" className="hover:text-primary-600">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/legal/agb" className="hover:text-primary-600">
                  AGB
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} SALON EXCELLENCE. Alle Rechte vorbehalten.
      </div>
    </footer>
  );
}

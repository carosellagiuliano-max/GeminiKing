'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Route } from 'next';

const navItems: Array<{ href: Route; label: string }> = [
  { href: '/', label: 'Start' },
  { href: '/services', label: 'Leistungen' },
  { href: '/team', label: 'Team' },
  { href: '/contact', label: 'Kontakt' },
  { href: '/portal', label: 'Portal' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-wide text-neutral-900">
          SALON EXCELLENCE
        </Link>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-primary-500 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 md:hidden"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(prev => !prev)}
        >
          Menü
          <span aria-hidden="true">☰</span>
        </button>
        <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-700 md:flex">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition hover:text-primary-600 ${
                pathname === item.href ? 'text-primary-600' : 'text-neutral-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/booking"
            className="rounded-full bg-primary-600 px-4 py-2 text-white shadow-sm transition hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            Termin buchen
          </Link>
        </nav>
      </div>
      {isMenuOpen ? (
        <div className="border-t border-neutral-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-neutral-700">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition hover:text-primary-600 ${
                  pathname === item.href ? 'text-primary-600' : 'text-neutral-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/booking"
              className="rounded-full bg-primary-600 px-4 py-2 text-center text-white shadow-sm transition hover:bg-primary-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Termin buchen
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

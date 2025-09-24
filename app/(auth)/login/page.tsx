import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Anmelden',
};

export default function LoginPage({ searchParams }: { searchParams: { redirectTo?: string } }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">Willkommen zurück</h1>
        <p className="mt-2 text-neutral-600">Melde dich an, um deine Buchungen zu verwalten.</p>
      </div>
      <LoginForm redirectTo={searchParams.redirectTo} />
    </div>
  );
}

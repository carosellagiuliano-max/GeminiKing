'use client';

import { useFormState } from 'react-dom';
import { loginAction, type LoginState } from '@/app/(auth)/login/actions';

const initialState: LoginState = { error: '' };

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="redirectTo" value={redirectTo ?? '/portal'} />
      <div>
        <label className="text-sm font-medium text-neutral-700" htmlFor="email">
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-neutral-700" htmlFor="password">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        className="w-full rounded-md bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
      >
        Anmelden
      </button>
    </form>
  );
}

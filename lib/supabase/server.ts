import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from './types';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase URL and anon key must be configured.');
  }

  return { url, anonKey };
}

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      setAll: (cookiesToSet) => {
        for (const cookie of cookiesToSet) {
          const storeWithSet = cookieStore as unknown as {
            set?: (cookie: { name: string; value: string } & Record<string, unknown>) => void;
          };
          if (typeof storeWithSet.set === 'function') {
            storeWithSet.set({
              name: cookie.name,
              value: cookie.value,
              sameSite: 'lax',
              ...cookie.options,
            });
          }
        }
      },
    },
  });
}

export function createSupabaseServiceRoleClient(): SupabaseClient {
  const { url } = getSupabaseConfig();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be configured to use privileged operations.');
  }

  return createClient<Database>(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseMiddlewareClient(req: NextRequest, res: NextResponse) {
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll().map(({ name, value }) => ({ name, value })),
      setAll: (cookiesToSet) => {
        for (const cookie of cookiesToSet) {
          res.cookies.set({
            name: cookie.name,
            value: cookie.value,
            sameSite: 'lax',
            ...cookie.options,
          });
        }
      },
    },
  });
}

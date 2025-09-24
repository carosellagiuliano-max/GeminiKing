import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import type { Database } from './types';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase URL and anon key must be configured.');
  }

  return { url, anonKey };
}

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const headerList = headers();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options) => {
        cookieStore.set({
          name,
          value,
          sameSite: 'lax',
          ...options,
        });
      },
      remove: (name: string, options) => {
        cookieStore.set({
          name,
          value: '',
          maxAge: 0,
          ...options,
        });
      },
    },
    headers: { 'x-forwarded-host': headerList.get('x-forwarded-host') ?? undefined },
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

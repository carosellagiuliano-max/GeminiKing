import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return res;
  }

  const supabase = createMiddlewareClient<Database>({ req, res }, { supabaseUrl, supabaseKey: anonKey });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const redirectTo = req.nextUrl.clone();
  redirectTo.pathname = '/login';
  redirectTo.searchParams.set('redirectTo', req.nextUrl.pathname);

  if (!session) {
    return NextResponse.redirect(redirectTo);
  }

  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'ADMIN') {
      const portalUrl = req.nextUrl.clone();
      portalUrl.pathname = '/portal';
      return NextResponse.redirect(portalUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*'],
};

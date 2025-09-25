import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/server';

function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://connect-js.stripe.com https://checkout.stripe.com https://gateway.sumup.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "form-action 'self' https://js.stripe.com https://checkout.stripe.com",
    "connect-src 'self' https://api.stripe.com https://m.stripe.network https://*.supabase.co https://*.supabase.in https://*.supabase.net https://api.sumup.com https://gateway.sumup.com",
    "frame-src 'self' https://js.stripe.com https://connect-js.stripe.com https://checkout.stripe.com https://*.stripe.com https://gateway.sumup.com https://*.sumup.com",
    'upgrade-insecure-requests',
  ].join('; ');
}

function applySecurityHeaders(response: NextResponse, nonce: string) {
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return response;
}

export async function middleware(req: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-csp-nonce', nonce);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const requiresAuth = req.nextUrl.pathname.startsWith('/portal') || req.nextUrl.pathname.startsWith('/admin');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (requiresAuth && supabaseUrl && anonKey) {
    const supabase = createSupabaseMiddlewareClient(req, response);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const redirectTo = req.nextUrl.clone();
      redirectTo.pathname = '/login';
      redirectTo.searchParams.set('redirectTo', `${req.nextUrl.pathname}${req.nextUrl.search}`);
      return applySecurityHeaders(NextResponse.redirect(redirectTo), nonce);
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
        return applySecurityHeaders(NextResponse.redirect(portalUrl), nonce);
      }
    }
  }

  return applySecurityHeaders(response, nonce);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from './app/lib/supabase/middleware';
import { getSupabaseEnv } from './app/lib/supabase/env';

const protectedPaths = ['/wall', '/account'];
const authPaths = ['/login', '/register'];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAuthPath(pathname: string) {
  return authPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { url, key } = getSupabaseEnv();

  if (!url || !key) {
    return NextResponse.next({ request });
  }

  const { supabase, response } = createSupabaseMiddlewareClient(request);

  let user = null;

  try {
    const authResult = await supabase.auth.getUser();
    user = authResult.data.user;
  } catch {
    return response;
  }

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPath(pathname) && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/account';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|flac|m4a|aac|ogg|json)$).*)'],
};

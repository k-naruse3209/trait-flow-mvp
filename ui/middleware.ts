import { NextRequest, NextResponse } from 'next/server';
import { locales } from './lib/i18n';
import { updateSession } from './lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Custom middleware - pathname:', pathname);
  
  // Check if pathname starts with a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Redirect to default locale
    console.log('No locale found, redirecting to /vi');
    return NextResponse.redirect(new URL(`/vi${pathname}`, request.url));
  }

  console.log('Locale found in pathname, continuing to auth check...');
  
  // Call Supabase authentication middleware
  const authResponse = await updateSession(request);
  
  // If auth middleware returns a redirect, return it
  if (authResponse.status === 307 || authResponse.status === 308) {
    return authResponse;
  }
  
  return authResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

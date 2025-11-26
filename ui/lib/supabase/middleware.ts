import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Define protected routes that require authentication
  const protectedRoutes = [
    "/dashboard",
    "/messages",
    "/history",
    "/assessment"
  ];

  // Routes that require traits (all protected routes except assessment)
  const traitsRequiredRoutes = [
    "/dashboard",
    "/messages",
    "/history"
  ];

  const pathname = request.nextUrl.pathname;
  
  // Remove locale prefix to get the actual route
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';

  // Check if current path is a protected route (with or without locale)
  const isProtectedRoute = protectedRoutes.some(route =>
    pathWithoutLocale.startsWith(route) || pathname.startsWith(route)
  );

  // Check if current path requires traits (with or without locale)
  const requiresTraits = traitsRequiredRoutes.some(route =>
    pathWithoutLocale.startsWith(route) || pathname.startsWith(route)
  );

  // Debug all requests
  console.log('Middleware request:', {
    pathname,
    isProtectedRoute,
    requiresTraits,
    hasUser: !!user,
    method: request.method
  });

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/([a-z]{2})/);
  const locale = localeMatch ? localeMatch[1] : 'vi';

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && (pathWithoutLocale.startsWith("/auth") || pathname.startsWith("/auth"))) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access routes that require traits
  if (user && requiresTraits) {
    try {
      // Check if user has traits data
      const { data: traits, error } = await supabase
        .from('baseline_traits')
        .select('id, administered_at')
        .eq('user_id', user.sub)
        .order('administered_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Traits check:', {
        userId: user.sub,
        pathname,
        pathWithoutLocale,
        traits: !!traits,
        error: error?.message
      });

      // If no traits found (regardless of error), redirect to assessment
      if (!traits) {
        console.log('No traits found, redirecting to assessment');
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/assessment`;
        return NextResponse.redirect(url);
      }

      // If there's an error but traits exist, log it and continue
      if (error) {
        console.error('Error checking traits (but traits found):', error);
      }
    } catch (error) {
      console.error('Error checking traits (catch block):', error);
      // On database error, redirect to assessment for safety (fail secure)
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/assessment`;
      return NextResponse.redirect(url);
    }
  }



  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isOnboardingRoute = pathname.startsWith('/onboarding');

  // Not authenticated → /login (always)
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  if (isDashboardRoute || isOnboardingRoute) {
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle<{ role: string | null }>();

    const normalizedRole = String(profile?.role ?? '').toLowerCase();

    if (normalizedRole === 'client' || normalizedRole === 'visitor') {
      if (isOnboardingRoute || !pathname.startsWith('/dashboard/client')) {
        const clientDashboardUrl = request.nextUrl.clone();
        clientDashboardUrl.pathname = '/dashboard/client';
        clientDashboardUrl.search = '';
        return NextResponse.redirect(clientDashboardUrl);
      }

      return response;
    }

    if (normalizedRole === 'company') {
      const { data: company } = await supabaseServer
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!company?.id) {
        if (!isOnboardingRoute) {
          const onboardingUrl = request.nextUrl.clone();
          onboardingUrl.pathname = '/onboarding';
          onboardingUrl.search = '';
          return NextResponse.redirect(onboardingUrl);
        }

        return response;
      }

      if (isOnboardingRoute) {
        const companyDashboardUrl = request.nextUrl.clone();
        companyDashboardUrl.pathname = '/dashboard';
        companyDashboardUrl.search = '';
        return NextResponse.redirect(companyDashboardUrl);
      }

      return response;
    }

    const { data: fallbackCompany } = await supabaseServer
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fallbackCompany?.id) {
      if (isOnboardingRoute) {
        const companyDashboardUrl = request.nextUrl.clone();
        companyDashboardUrl.pathname = '/dashboard';
        companyDashboardUrl.search = '';
        return NextResponse.redirect(companyDashboardUrl);
      }

      return response;
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding'],
};

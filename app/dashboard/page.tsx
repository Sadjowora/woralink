'use client';

import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import SetupPage from './setup/page';

type ProfileRole = 'company' | 'client' | 'visitor' | string;

export default function DashboardPage() {
  const router = useRouter();
  const [canViewCompanyDashboard, setCanViewCompanyDashboard] = useState(false);
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const routeByRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (!cancelled) router.push('/login');
        return;
      }

      const userId = session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle<{ role: ProfileRole | null }>();

      if (profileError) {
        if (!cancelled) router.push('/login');
        return;
      }

      const role = String(profile?.role ?? '').toLowerCase();

      if (role === 'client' || role === 'visitor') {
        if (!cancelled) router.push('/dashboard/client');
        return;
      }

      if (role === 'company') {
        if (!cancelled) setCanViewCompanyDashboard(true);
        return;
      }

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle<{ id: string }>();

      if (!companyError && company?.id) {
        if (!cancelled) setCanViewCompanyDashboard(true);
        return;
      }

      if (!cancelled) router.push('/login');
    };

    void routeByRole();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  if (canViewCompanyDashboard) {
    return <SetupPage />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 transition-colors duration-200 dark:bg-slate-950">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500 transition-colors duration-200 dark:text-slate-300">
          Dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
          Chargement de votre espace personnalisé...
        </h1>
        <p className="mt-3 text-sm text-gray-600 transition-colors duration-200 dark:text-slate-300">
          Vérification de votre session et de votre profil en cours.
        </p>
      </div>
    </div>
  );
}

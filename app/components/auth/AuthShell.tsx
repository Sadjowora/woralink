import type { ReactNode } from 'react';
import Link from 'next/link';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerLinkLabel: string;
  footerLinkHref: string;
};

const highlights = [
  { label: 'Visibilité', value: 'Annuaire local Woralink' },
  { label: 'Prospects', value: 'Clients proches de vous' },
  { label: 'Gestion', value: 'Dashboard simple et rapide' },
];

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footerText,
  footerLinkLabel,
  footerLinkHref,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full overflow-hidden rounded-4xl border border-blue-100 bg-white shadow-xl shadow-blue-100/70 lg:w-2/3 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-linear-to-br from-blue-700 via-sky-600 to-emerald-500 px-8 py-10 text-white md:px-10 lg:px-12 lg:py-12">
          <div className="absolute -left-10 top-16 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 translate-x-10 translate-y-8 rounded-full bg-emerald-200/20 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.24em] text-blue-100 uppercase">
                Woralink
              </Link>

              <p className="mt-8 text-sm font-medium uppercase tracking-[0.22em] text-blue-100">{eyebrow}</p>
              <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight tracking-tighter text-primary md:text-5xl">{title}</h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-blue-50">{description}</p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-blue-100">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center px-6 py-10 md:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            {children}
            <p className="mt-6 text-center text-sm text-gray-500">
              {footerText}{' '}
              <Link href={footerLinkHref} className="font-semibold text-blue-600 hover:text-blue-700">
                {footerLinkLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
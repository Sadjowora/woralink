'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import ImageUpload from '../components/ImageUpload';

const SECTORS = [
  'Commerce & Distribution',
  'Agriculture & Élevage',
  'Construction & BTP',
  'Restauration & Hôtellerie',
  'Transport & Logistique',
  'Santé & Pharmacie',
  'Éducation & Formation',
  'Finance & Assurance',
  'Tech & Numérique',
  'Mode & Textile',
  'Médias & Communication',
  'Artisanat & Art',
  'Énergie & Environnement',
  'Consultations & Services',
  'Logement & Immobilier',
  'Livraison & Domicile',
  'Autre',
];

const PROFILE_TYPES = ['PME', 'Startup', 'Artisan', 'Freelance'];

const GUINEA_CITIES = [
  'Conakry',
  'Kindia',
  'Labé',
  'Kankan',
  'Mamou',
  'Nzérékoré',
  'Mali',
  'Coyah',
  'Dubréka',
  'Forécariah',
  'Fria',
  'Gaoual',
  'Koundara',
  'Pita',
  'Boffa',
  'Boké',
  'Télimélé',
  'Tougué',
  'Yomou',
  'Dinguiraye',
  'Kissidougou',
  'Kérouané',
  'Siguiri',
  'Mandiana',
  'Beyla',
  'Kouroussa',
  'Dabola',
  'Lola',
  'Koubia',
  'Dalaba',
  'Banankoro',
  'Faranah',
  'Kamsar',
  'Sangaredi',
];

type FormData = {
  entityName: string;
  profileType: string;
  sector: string;
  city: string; // will be selected from GUINEA_CITIES
  whatsapp: string;
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { entityName: '', profileType: '', sector: '', city: '', whatsapp: '' },
  });

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data: existing }) => {
          if (cancelled) return;

          if (existing?.id) {
            router.replace('/dashboard');
            return;
          }

          setUserId(user.id);
          setAuthChecking(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSubmit = async (data: FormData) => {
    if (!userId) return;

    setLoading(true);
    setError('');

    const { error: insertError } = await supabase.from('companies').insert([
      {
        user_id: userId,
        name: data.entityName,
        profile_type: data.profileType,
        sector: data.sector,
        city: data.city,
        whatsapp: data.whatsapp,
        slug: generateSlug(data.entityName),
        logo_url: logoUrl || null,
      },
    ]);

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.replace('/dashboard');
  };

  if (authChecking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-green-700"
          role="status"
          aria-label="Chargement"
        />
        <p className="text-sm text-gray-500">Vérification de votre compte…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
          Créez votre fiche professionnelle
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Ces informations seront visibles par vos futurs clients sur Woralink. Vous pouvez les
          modifier à tout moment depuis votre tableau de bord.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
          {/* Nom */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-500">
              Nom de l&apos;entité *
            </label>
            <input
              type="text"
              {...register('entityName', { required: 'Ce champ est requis' })}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-700/20"
            />
            {errors.entityName && (
              <p className="mt-1 text-xs text-red-600">{String(errors.entityName.message)}</p>
            )}
          </div>

          {/* Type + Secteur */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Type de profil *
              </label>
              <select
                {...register('profileType', { required: 'Ce champ est requis' })}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-700/20"
              >
                <option value="">Sélectionnez un type</option>
                {PROFILE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.profileType && (
                <p className="mt-1 text-xs text-red-600">{String(errors.profileType.message)}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Secteur d&apos;activité *
              </label>
              <select
                {...register('sector', { required: 'Ce champ est requis' })}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-700/20"
              >
                <option value="">Sélectionnez un secteur</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.sector && (
                <p className="mt-1 text-xs text-red-600">{String(errors.sector.message)}</p>
              )}
            </div>
          </div>

          {/* Ville + WhatsApp */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Ville *
              </label>
              <select
                {...register('city', { required: 'Ce champ est requis' })}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-700/20"
              >
                <option value="">Sélectionnez une ville</option>
                {GUINEA_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p className="mt-1 text-xs text-red-600">{String(errors.city.message)}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Numéro WhatsApp *
              </label>
              <input
                type="tel"
                {...register('whatsapp', {
                  required: 'Ce champ est requis',
                  pattern: {
                    value: /^\+\d{1,4}\d{6,14}$/,
                    message: 'Format international requis : +224XXXXXXXX',
                  },
                })}
                placeholder="+224XXXXXXXX"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-700/20"
              />
              {errors.whatsapp && (
                <p className="mt-1 text-xs text-red-600">{String(errors.whatsapp.message)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-500">
            Logo de l&apos;entreprise (optionnel)
          </label>
          <small className="mb-3 block text-xs text-gray-400">PNG, JPG, GIF — max 5 Mo</small>
          <ImageUpload
            key={logoUrl || 'empty-logo'}
            onUploadComplete={(url) => setLogoUrl(url)}
            className="max-w-sm"
          />
          {logoUrl && <p className="mt-2 text-xs text-green-700">Logo prêt à être enregistré.</p>}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-green-700 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? 'Enregistrement…' : 'Créer mon profil et accéder au tableau de bord'}
        </button>
      </form>
    </div>
  );
}

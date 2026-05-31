'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../../../lib/supabase';
import DashboardShell from '../../components/dashboard/DashboardShell';
import ShareProfile from '../../components/ShareProfile';
import ImageUpload from '../../components/ImageUpload';
import { ArrowRight, Building2, Eye, Globe2, MapPin, UserRound } from 'lucide-react';

const sectors = [
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

const profileTypes = ['PME', 'Startup', 'Artisan', 'Freelance'];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric characters
    .trim()
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-') // replace multiple hyphens with one
    .replace(/^-+|-+$/g, '');
}

type FormData = {
  entityName: string;
  profileType: string;
  sector: string;
  city: string;
  whatsapp: string;
  companyStory: string;
  yearsExperience: string;
  completedProjects: string;
  employeeCount: string;
  founderMessage: string;
  address: string;
  website_url: string;
};

type Company = {
  id: string;
  name: string;
  profile_type: string;
  sector: string;
  city: string;
  whatsapp: string;
  slug: string;
  logo_url?: string | null;
  company_story?: string | null;
  years_experience?: number | null;
  completed_projects?: number | null;
  employee_count?: number | null;
  founder_message?: string | null;
  address?: string | null;
  website_url?: string | null;
  bigup?: number | null;
};

type FeaturedAnalyticsRow = {
  slot: 'company_of_day' | 'champion_of_week' | 'pme_of_month';
  company_id: string;
  company_name: string;
  city: string | null;
  sector: string | null;
  slug: string;
  views_24h: number | null;
  bravos_7d: number | null;
  views_30d: number | null;
  bravos_30d: number | null;
};

type GallerySlot = {
  url: string;
  legend: string;
  uploadedAt: string | null;
};

function mapCompanyToFormValues(company: Company): FormData {
  return {
    entityName: company.name,
    profileType: company.profile_type,
    sector: company.sector,
    city: company.city,
    whatsapp: company.whatsapp,
    companyStory: company.company_story || '',
    yearsExperience: company.years_experience ? String(company.years_experience) : '',
    completedProjects: company.completed_projects ? String(company.completed_projects) : '',
    employeeCount: company.employee_count ? String(company.employee_count) : '',
    founderMessage: company.founder_message || '',
    address: company.address || '',
    website_url: company.website_url || '',
  };
}

function SetupPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [, setGalleryUrls] = useState<Array<string | null>>(Array(5).fill(null));
  const [galleryError, setGalleryError] = useState('');
  const [showQrPreview, setShowQrPreview] = useState(false);
  const [woralinkPerformance, setWoralinkPerformance] = useState<{
    title: string;
    detail: string;
    level: 'win' | 'progress';
  }>({
    title: 'Performance Woralink',
    detail: 'Continuez a gagner des bravo pour monter dans le classement.',
    level: 'progress',
  });
  const initialShortcutHandledRef = useRef(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      entityName: '',
      profileType: '',
      sector: '',
      city: '',
      whatsapp: '',
      companyStory: '',
      yearsExperience: '',
      completedProjects: '',
      employeeCount: '',
      founderMessage: '',
      address: '',
      website_url: '',
    },
  });
  const companyStoryValue = watch('companyStory') || '';
  const companyStoryCharacterCount = companyStoryValue.length;
  const profileUrl =
    company && typeof window !== 'undefined' ? `${window.location.origin}/pme/${company.slug}` : '';

  const downloadQrCode = useCallback(() => {
    const canvas = qrCanvasRef.current;

    if (!canvas) {
      return;
    }

    const link = document.createElement('a');
    link.download = `${company?.slug || 'woralink'}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [company?.slug]);

  const checkExistingCompany = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

      setCompany(data || null);
      if (data) {
        reset(mapCompanyToFormValues(data as Company));
        setLogoUrl(data.logo_url || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la vérification');
    } finally {
      setChecking(false);
    }
  }, [reset]);

  useEffect(() => {
    checkExistingCompany();
  }, [checkExistingCompany]);

  useEffect(() => {
    const fetchGalleryPhotos = async () => {
      if (!company?.id) {
        setGalleryUrls(Array(5).fill(null));
        return;
      }

      setGalleryError('');
      const { data, error: photosError } = await supabase
        .from('company_photos')
        .select('*')
        .eq('company_id', company.id);

      if (photosError) {
        setGalleryError('Impossible de charger les photos de la galerie.');
        return;
      }

      const slots = (data || [])
        .map((row: Record<string, unknown>) => {
          const value = row.photo_url ?? row.url;
          const url = typeof value === 'string' ? value : null;

          if (!url) {
            return null;
          }

          const legendValue = row.legend ?? row.caption;
          const uploadedAtValue = row.uploaded_at ?? row.created_at;

          return {
            url,
            legend: typeof legendValue === 'string' ? legendValue : '',
            uploadedAt: typeof uploadedAtValue === 'string' ? uploadedAtValue : null,
          } satisfies GallerySlot;
        })
        .filter((item): item is GallerySlot => Boolean(item?.url))
        .slice(0, 5);

      const urlSlots: Array<string | null> = Array(5).fill(null);

      slots.forEach((slot, index) => {
        urlSlots[index] = slot.url;
      });

      setGalleryUrls(urlSlots);
    };

    fetchGalleryPhotos();
  }, [company?.id]);

  useEffect(() => {
    let mounted = true;

    const resolveFeaturedPerformance = async () => {
      if (!company?.id) {
        if (!mounted) return;
        setWoralinkPerformance({
          title: 'Performance Woralink',
          detail: 'Ajoutez votre profil pour commencer a obtenir des distinctions.',
          level: 'progress',
        });
        return;
      }

      const { data, error: featuredError } = await supabase.rpc('get_featured_companies_analytics');

      if (featuredError || !Array.isArray(data)) {
        if (!mounted) return;
        const bravos = Math.max(0, Number(company.bigup ?? 0) || 0);
        setWoralinkPerformance({
          title: 'Performance Woralink',
          detail: `${bravos} bravo cumules. Continuez pour viser le podium hebdomadaire.`,
          level: 'progress',
        });
        return;
      }

      const rows = data as FeaturedAnalyticsRow[];
      const weekWinner = rows.find((row) => row.slot === 'champion_of_week');
      const monthWinner = rows.find((row) => row.slot === 'pme_of_month');
      const dayWinner = rows.find((row) => row.slot === 'company_of_day');

      const isWeekWinner = weekWinner?.company_id === company.id;
      const isMonthWinner = monthWinner?.company_id === company.id;
      const isDayWinner = dayWinner?.company_id === company.id;

      if (!mounted) return;

      if (isMonthWinner) {
        const monthViews = Math.max(0, Number(monthWinner?.views_30d ?? 0) || 0);
        const monthBravos = Math.max(0, Number(monthWinner?.bravos_30d ?? 0) || 0);
        setWoralinkPerformance({
          title: 'Entreprise du mois',
          detail: `${monthViews} vues et ${monthBravos} bravo sur 30 jours.`,
          level: 'win',
        });
        return;
      }

      if (isWeekWinner) {
        const weekBravos = Math.max(0, Number(weekWinner?.bravos_7d ?? 0) || 0);
        setWoralinkPerformance({
          title: 'Entreprise de la semaine',
          detail: `${weekBravos} bravo en 7 jours. Continuez votre dynamique.`,
          level: 'win',
        });
        return;
      }

      if (isDayWinner) {
        const dayViews = Math.max(0, Number(dayWinner?.views_24h ?? 0) || 0);
        setWoralinkPerformance({
          title: 'Entreprise du jour',
          detail: `${dayViews} vues sur 24h. Votre profil attire l'attention.`,
          level: 'win',
        });
        return;
      }

      const bravos = Math.max(0, Number(company.bigup ?? 0) || 0);
      setWoralinkPerformance({
        title: 'Performance Woralink',
        detail: `${bravos} bravo cumules. Continuez pour viser le classement du mois.`,
        level: 'progress',
      });
    };

    void resolveFeaturedPerformance();

    return () => {
      mounted = false;
    };
  }, [company?.id, company?.bigup]);

  const openEditor = useCallback(() => {
    if (!company) return;

    setEditing(true);
    reset(mapCompanyToFormValues(company));
    setLogoUrl(company.logo_url || '');
  }, [company, reset]);

  useEffect(() => {
    if (initialShortcutHandledRef.current || checking || !company) {
      return;
    }

    const mode = searchParams.get('mode');

    if (mode === 'edit') {
      initialShortcutHandledRef.current = true;
      openEditor();
    }
  }, [checking, company, openEditor, searchParams]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const yearsExperience = data.yearsExperience ? Number(data.yearsExperience) : null;
      const completedProjects = data.completedProjects ? Number(data.completedProjects) : null;
      const employeeCount = data.employeeCount ? Number(data.employeeCount) : null;

      if (data.yearsExperience && Number.isNaN(yearsExperience)) {
        throw new Error("Le champ années d'expérience doit être un nombre valide.");
      }

      if (data.completedProjects && Number.isNaN(completedProjects)) {
        throw new Error('Le champ projets terminés doit être un nombre valide.');
      }

      if (data.employeeCount && Number.isNaN(employeeCount)) {
        throw new Error("Le champ nombre d'employés doit être un nombre valide.");
      }

      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(authError.message);

      const user = userData?.user;
      if (!user) throw new Error('Utilisateur non connecté');

      const slug = generateSlug(data.entityName);

      if (editing && company) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: data.entityName,
            profile_type: data.profileType,
            sector: data.sector,
            city: data.city,
            whatsapp: data.whatsapp,
            slug: slug,
            logo_url: logoUrl || null,
            company_story: data.companyStory || null,
            years_experience: yearsExperience,
            completed_projects: completedProjects,
            employee_count: employeeCount,
            founder_message: data.founderMessage || null,
            address: data.address || null,
            website_url: data.website_url || null,
          })
          .eq('id', company.id);

        if (error) throw new Error(error.message);
        setCompany({
          ...company,
          name: data.entityName,
          profile_type: data.profileType,
          sector: data.sector,
          city: data.city,
          whatsapp: data.whatsapp,
          slug,
          logo_url: logoUrl || null,
          company_story: data.companyStory || null,
          years_experience: yearsExperience,
          completed_projects: completedProjects,
          employee_count: employeeCount,
          founder_message: data.founderMessage || null,
          address: data.address || null,
          website_url: data.website_url || null,
        });
      } else {
        // Create new company
        const { data: newCompany, error } = await supabase
          .from('companies')
          .insert([
            {
              user_id: user.id,
              name: data.entityName,
              profile_type: data.profileType,
              sector: data.sector,
              city: data.city,
              whatsapp: data.whatsapp,
              slug: slug,
              logo_url: logoUrl || null,
              company_story: data.companyStory || null,
              years_experience: yearsExperience,
              completed_projects: completedProjects,
              employee_count: employeeCount,
              founder_message: data.founderMessage || null,
              address: data.address || null,
              website_url: data.website_url || null,
            },
          ])
          .select()
          .single();

        if (error) throw new Error(error.message);
        setCompany(newCompany as Company);
      }

      setSuccess(true);
      setEditing(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : err && typeof err === 'object' && 'message' in err
            ? String((err as { message?: unknown }).message)
            : 'Erreur lors de la sauvegarde';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <DashboardShell title="Configuration" subtitle="Verification de votre fiche professionnelle.">
        <div className="rounded-xl border border-gray-200 bg-white p-8 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Verification du profil...
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={
        company && !editing ? 'Tableau de bord' : editing ? 'Modifier le profil' : 'Configuration'
      }
      subtitle={
        company && !editing
          ? "Vue d'ensemble de votre presence professionnelle sur Woralink."
          : 'Mettez a jour vos informations, votre logo et votre contenu public.'
      }
      actions={
        company && !editing ? (
          <>
            <Link
              href={`/pme/${company.slug}`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Voir ma fiche
            </Link>
            <button
              type="button"
              onClick={() => openEditor()}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-800"
            >
              Modifier le profil
            </button>
          </>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Retour dashboard
            </Link>
            <Link
              href="/dashboard/gallery"
              className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800"
            >
              Gerer la galerie
            </Link>
          </>
        )
      }
    >
      <div className="w-full rounded-xl border border-gray-200 bg-white p-4 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        {company && !editing ? (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-300">
                Profil mis a jour avec succes !
              </div>
            )}

            <div className="space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 justify-items-center gap-3 md:grid-cols-4 md:justify-items-stretch md:gap-4">
                <article className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:max-w-none">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-slate-400">Vues du profil</p>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                    17
                  </p>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                    Suivi en temps reel
                  </p>
                </article>

                <article className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:max-w-none">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-slate-400">Statut de fiche</p>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                    Actif
                  </p>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                    Votre page publique est accessible
                  </p>
                </article>

                <article className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:max-w-none">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-slate-400">Ville</p>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                    Conakry
                  </p>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                    Zone principale de visibilite
                  </p>
                </article>

                <article className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:max-w-none">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-slate-400">Completion profil</p>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                      <UserRound className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                    92%
                  </p>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                    Fiche bien optimisee
                  </p>
                </article>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <header className="border-b border-gray-100 px-4 py-4 dark:border-slate-800 sm:px-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        FICHE ENTREPRISE
                      </p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                          Woralink
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                            Actif
                          </span>
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                            Verifie
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                        Votre vitrine est prete a recevoir du trafic local. Gardez vos informations
                        a jour pour inspirer confiance.
                      </p>
                    </header>

                    <div className="px-4 py-4 sm:px-5">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        INFORMATIONS PRINCIPALES
                      </p>

                      <dl className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
                        <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-3">
                          <dt className="text-gray-500 dark:text-slate-400">Nom</dt>
                          <dd className="text-right font-medium text-gray-900 dark:text-slate-100">
                            Woralink
                          </dd>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-3">
                          <dt className="text-gray-500 dark:text-slate-400">Type</dt>
                          <dd className="text-right font-medium text-gray-900 dark:text-slate-100">
                            PME
                          </dd>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-3">
                          <dt className="text-gray-500 dark:text-slate-400">Ville</dt>
                          <dd className="text-right font-medium text-gray-900 dark:text-slate-100">
                            Conakry
                          </dd>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-3">
                          <dt className="text-gray-500 dark:text-slate-400">Secteur</dt>
                          <dd className="text-right font-medium text-gray-900 dark:text-slate-100">
                            Tech & Numerique
                          </dd>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-3">
                          <dt className="text-gray-500 dark:text-slate-400">Adresse</dt>
                          <dd className="text-right font-medium text-gray-900 dark:text-slate-100">
                            {company.address || 'Commune de Tombolia, Qrtie de Tombolia Plateau 2'}
                          </dd>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-3">
                          <dt className="text-gray-500 dark:text-slate-400">Site web</dt>
                          <dd className="text-right font-medium">
                            <a
                              href={company.website_url || 'https://woralink.com'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-300 dark:hover:text-emerald-200"
                            >
                              <Globe2 className="h-4 w-4" aria-hidden="true" />
                              Ouvrir le site
                            </a>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </section>

                  <ShareProfile
                    companyName={company.name}
                    profileUrl={profileUrl}
                    message="Partagez votre profil Woralink sur WhatsApp, Facebook ou LinkedIn."
                  />

                  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <header className="border-b border-gray-100 px-4 py-4 dark:border-slate-800 sm:px-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        QR CODE
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                        Impression et diffusion locale
                      </h3>
                    </header>

                    <div className="p-4 sm:p-5">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              Code de partage
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                              Affichez-le sur vos supports pour rediriger vos visiteurs vers votre
                              vitrine.
                            </p>
                          </div>
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                            <Building2 className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setShowQrPreview((current) => !current)}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                          >
                            {showQrPreview ? 'Masquer le QR Code' : 'Voir le QR Code'}
                          </button>
                          <button
                            type="button"
                            onClick={downloadQrCode}
                            className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800"
                          >
                            Telecharger
                          </button>
                        </div>

                        {showQrPreview && profileUrl ? (
                          <div className="mt-4 flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                            <QRCodeCanvas
                              ref={qrCanvasRef}
                              value={profileUrl}
                              size={180}
                              level="M"
                              includeMargin
                              className="w-45 h-auto rounded-lg"
                            />
                            <p className="mt-3 max-w-xs text-center text-xs text-gray-500 dark:text-slate-400">
                              {profileUrl}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <header className="border-b border-gray-100 px-4 py-4 dark:border-slate-800 sm:px-5">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        ACTIONS RAPIDES
                      </p>
                      <h3 className="mt-1 text-4xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                        Gerer ma presence
                      </h3>
                    </header>

                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                      <Link
                        href="/dashboard/setup?mode=edit"
                        className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 sm:px-5"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            Modifier mon profil
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            Mettez a jour vos informations
                          </p>
                        </div>
                        <ArrowRight
                          className="h-4 w-4 text-gray-400 dark:text-slate-500"
                          aria-hidden="true"
                        />
                      </Link>

                      <Link
                        href={`/pme/${company.slug}`}
                        className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 sm:px-5"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            Voir ma page publique
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            Controlez le rendu visible
                          </p>
                        </div>
                        <ArrowRight
                          className="h-4 w-4 text-gray-400 dark:text-slate-500"
                          aria-hidden="true"
                        />
                      </Link>

                      <Link
                        href="/dashboard/gallery"
                        className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 sm:px-5"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            Gerer la galerie
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            Ajoutez des photos a votre vitrine
                          </p>
                        </div>
                        <ArrowRight
                          className="h-4 w-4 text-gray-400 dark:text-slate-500"
                          aria-hidden="true"
                        />
                      </Link>

                      <Link
                        href="/dashboard/setup"
                        className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 sm:px-5"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            Finaliser la configuration
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            Ajustez vos informations essentielles
                          </p>
                        </div>
                        <ArrowRight
                          className="h-4 w-4 text-gray-400 dark:text-slate-500"
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-slate-400">Bravo recus</p>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        👏
                      </span>
                    </div>
                    <p className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                      {Math.max(0, Number(company.bigup ?? 0) || 0)}
                    </p>
                    <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                      Nombre total de bravo recus depuis les recherches.
                    </p>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        Performance Woralink
                      </p>
                      <span
                        className={`inline-flex h-8 items-center justify-center rounded-full px-2 text-xs font-medium ${
                          woralinkPerformance.level === 'win'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {woralinkPerformance.level === 'win' ? 'TOP' : 'PROGRESSION'}
                      </span>
                    </div>
                    <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                      {woralinkPerformance.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                      {woralinkPerformance.detail}
                    </p>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-slate-400">Performance</p>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                    <p className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                      17
                    </p>
                    <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                      Continuez a enrichir votre profil pour accelerer la decouverte.
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <p className="text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                Dashboard Woralink
              </p>
              <h1 className="mt-2 text-xl font-bold tracking-tighter text-primary sm:text-2xl md:text-3xl">
                {editing ? 'Modifier votre profil' : 'Créer un profil professionnel'}
              </h1>
              <p className="mt-2 text-xs text-gray-600 transition-colors duration-200 dark:text-slate-300 sm:text-sm">
                {editing
                  ? 'Mettez à jour votre fiche et votre galerie pour garder une page publique complète.'
                  : 'Configurez votre fiche entreprise pour apparaître sur Woralink et commencer à recevoir des demandes.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 sm:px-4 sm:text-sm"
                >
                  Retour au dashboard
                </Link>
                <Link
                  href="/dashboard/gallery"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 sm:px-4 sm:text-sm"
                >
                  Gérer ma galerie
                </Link>
                {company && (
                  <Link
                    href={`/pme/${company.slug}`}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 sm:px-4 sm:text-sm"
                  >
                    Voir ma page publique
                  </Link>
                )}
              </div>
            </div>

            {!editing && !company && (
              <div className="mb-4 text-center sm:mb-6">
                <p className="mb-3 text-xs text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-sm">
                  Vous pourrez compléter votre profil professionnel à tout moment depuis votre
                  tableau de bord.
                </p>
                <div className="flex justify-center">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:text-sm"
                  >
                    Passer pour plus tard
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
              <section className="space-y-4 rounded-md border border-gray-200 bg-white p-4 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:space-y-5 sm:p-6">
                <div>
                  <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                    Nom de l&apos;entité
                  </label>
                  <input
                    type="text"
                    {...register('entityName', { required: 'Ce champ est requis' })}
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                  />
                  {errors.entityName && (
                    <p className="mt-1 text-xs text-red-600 sm:text-sm">
                      {String(errors.entityName.message)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                      Type de profil
                    </label>
                    <select
                      {...register('profileType', { required: 'Ce champ est requis' })}
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                    >
                      <option value="">Sélectionnez un type</option>
                      {profileTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.profileType && (
                      <p className="mt-1 text-xs text-red-600 sm:text-sm">
                        {String(errors.profileType.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                      Secteur d&apos;activité
                    </label>
                    <select
                      {...register('sector', { required: 'Ce champ est requis' })}
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                    >
                      <option value="">Sélectionnez un secteur</option>
                      {sectors.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                    {errors.sector && (
                      <p className="mt-1 text-xs text-red-600 sm:text-sm">
                        {String(errors.sector.message)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                      Ville
                    </label>
                    <input
                      type="text"
                      {...register('city', { required: 'Ce champ est requis' })}
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-600 sm:text-sm">
                        {String(errors.city.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                      Numéro WhatsApp
                    </label>
                    <input
                      type="tel"
                      {...register('whatsapp', {
                        required: 'Ce champ est requis',
                        pattern: {
                          value: /^\+\d{1,4}\d{6,14}$/,
                          message:
                            'Format invalide. Utilisez le format international : +33123456789',
                        },
                      })}
                      placeholder="+33123456789"
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                    />
                    {errors.whatsapp && (
                      <p className="mt-1 text-xs text-red-600 sm:text-sm">
                        {String(errors.whatsapp.message)}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-md border border-gray-200 bg-white p-4 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:space-y-5 sm:p-6">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                      Histoire de l&apos;entreprise
                    </label>
                    <span className="text-[10px] tabular-nums text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-xs">
                      {companyStoryCharacterCount} caractères
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    {...register('companyStory')}
                    placeholder="Racontez l'histoire de votre entreprise, votre mission et vos points forts."
                    className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                  />
                  {companyStoryCharacterCount < 200 && (
                    <p className="mt-2 text-xs text-orange-600 sm:text-sm">
                      💡 Conseil SEO : Une description de plus de 200 mots aide Google à vous
                      trouver plus facilement
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-3 text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                    Chiffres clés
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    <div>
                      <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                        Années d&apos;expérience
                      </label>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        {...register('yearsExperience')}
                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs tabular-nums text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                        Projets terminés
                      </label>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        {...register('completedProjects')}
                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs tabular-nums text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                        Nombre d&apos;employés
                      </label>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        {...register('employeeCount')}
                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs tabular-nums text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-md border border-gray-200 bg-white p-4 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:space-y-5 sm:p-6">
                <div>
                  <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                    Message de l&apos;entreprise
                  </label>
                  <textarea
                    rows={5}
                    {...register('founderMessage')}
                    placeholder="Partagez un message de votre entreprise pour créer un lien de confiance."
                    className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                    Adresse physique
                  </label>
                  <textarea
                    rows={3}
                    {...register('address')}
                    placeholder="Ex: 123 Avenue Ahmed Sékou Touré, Conakry, Guinée"
                    className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                    Site web ou lien social
                  </label>
                  <input
                    type="url"
                    {...register('website_url')}
                    placeholder="https://votre-site.com ou https://linkedin.com/company/..."
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 sm:px-4 sm:py-3 sm:text-sm"
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-md border border-gray-200 bg-white p-4 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:space-y-5 sm:p-6">
                <div>
                  <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                    Logo de l&apos;entreprise (optionnel)
                  </label>
                  <small className="mb-2 block text-[10px] text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-xs">
                    Formats acceptés : PNG, JPG, GIF. Taille max : 5MB.
                  </small>
                  <ImageUpload
                    key={logoUrl || 'empty-logo'}
                    onUploadComplete={(url) => setLogoUrl(url)}
                    className="max-w-md"
                  />
                  {logoUrl && (
                    <p className="mt-2 text-xs text-green-700 sm:text-sm">
                      Logo sélectionné et prêt à être uploadé.
                    </p>
                  )}
                </div>

                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 transition-colors duration-200 dark:text-slate-300 sm:p-4 sm:text-sm">
                  La galerie se met à jour sur une page dédiée. Utilisez le lien{' '}
                  <Link
                    href="/dashboard/gallery"
                    className="font-semibold text-primary hover:underline"
                  >
                    Gérer ma galerie
                  </Link>
                  .
                </div>
              </section>
              {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
              {success && (
                <div className="mb-4 rounded bg-green-100 p-3 text-green-700">
                  {editing ? 'Profil mis à jour avec succès !' : 'Profil créé avec succès !'}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-green-700 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-green-800 disabled:opacity-50 sm:py-3 sm:text-sm"
              >
                {loading
                  ? editing
                    ? 'Mise à jour...'
                    : 'Création...'
                  : editing
                    ? 'Mettre à jour'
                    : 'Créer le Profil'}
              </button>
            </form>

            {galleryError && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:text-sm">
                {galleryError}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell title="Configuration" subtitle="Chargement des parametres de votre espace.">
          <div className="rounded-xl border border-gray-200 bg-white p-8 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Chargement des parametres...
            </div>
          </div>
        </DashboardShell>
      }
    >
      <SetupPageContent />
    </Suspense>
  );
}

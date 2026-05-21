'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { supabase } from '../../../lib/supabase';
import DashboardShell from '../../components/dashboard/DashboardShell';
import ImageUpload from '../../components/ImageUpload';
import Image from 'next/image';

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
  const [galleryUrls, setGalleryUrls] = useState<Array<string | null>>(Array(5).fill(null));
  const [galleryError, setGalleryError] = useState('');
  const initialShortcutHandledRef = useRef(false);

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
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500">
            Verification du profil...
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={editing ? 'Modifier le profil' : 'Configuration'}
      subtitle="Mettez a jour vos informations, votre logo et votre contenu public."
      actions={
        <>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50"
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
      }
    >
      <div className="w-full rounded-xl border border-gray-200 bg-white p-5">
        {company && !editing ? (
          <>
            <div className="mb-6 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:mb-8 sm:gap-4 sm:pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                  Votre entreprise
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-tighter text-primary sm:text-2xl md:text-3xl">
                  Tableau de bord Woralink
                </h2>
                <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                  Retrouvez les informations essentielles de votre fiche et accedez aux actions
                  rapides.
                </p>
              </div>

              <div className="flex flex-col flex-wrap gap-2 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={() => openEditor()}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-green-800 sm:px-5 sm:py-3 sm:text-sm"
                >
                  Modifier mon profil
                </button>
                <Link
                  href={`/pme/${company.slug}`}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 sm:px-5 sm:py-3 sm:text-sm"
                >
                  Voir ma page publique
                </Link>
                <Link
                  href="/dashboard/gallery"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 sm:px-5 sm:py-3 sm:text-sm"
                >
                  Gérer la galerie
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 sm:px-5 sm:py-3 sm:text-sm"
                >
                  Retour au dashboard
                </Link>
                <Link
                  href="/dashboard/media"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 sm:px-5 sm:py-3 sm:text-sm"
                >
                  Aperçu des médias
                </Link>
              </div>
            </div>

            {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
            {success && (
              <div className="mb-4 rounded bg-green-100 p-3 text-green-700">
                Profil mis à jour avec succès !
              </div>
            )}
            <div className="mb-4 rounded-md border border-primary/15 bg-primary/5 p-4 sm:mb-6 sm:p-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary sm:text-xs">
                Image professionnelle
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-700 sm:text-base">
                Un profil à jour inspire davantage confiance, valorise votre savoir-faire et
                renforce immédiatement votre image professionnelle. Prenez quelques minutes pour
                affiner votre fiche, enrichir vos informations et montrer aux visiteurs une
                entreprise sérieuse, active et prête à être contactée.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-md border border-gray-200 bg-white p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5">
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                      Resume
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-black sm:text-xl">
                      Votre fiche entreprise
                    </h3>
                    <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                      Les informations visibles par vos visiteurs sur Woralink.
                    </p>
                  </div>
                  <span className="whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 sm:px-3 sm:py-1 sm:text-xs">
                    En ligne
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-md border border-gray-200 bg-white p-4">
                    <p className="text-[9px] uppercase tracking-widest text-gray-500 sm:text-[10px]">
                      Statut
                    </p>
                    <p className="mt-2 text-2xl font-medium tracking-tighter text-black sm:text-3xl">
                      En ligne
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white p-4">
                    <p className="text-[9px] uppercase tracking-widest text-gray-500 sm:text-[10px]">
                      Ville
                    </p>
                    <p className="mt-2 text-2xl font-medium tracking-tighter text-black sm:text-3xl">
                      {company.city}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white p-4">
                    <p className="text-[9px] uppercase tracking-widest text-gray-500 sm:text-[10px]">
                      Secteur
                    </p>
                    <p className="mt-2 text-2xl font-medium tracking-tighter text-black sm:text-3xl">
                      {company.sector}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-md border border-gray-200 bg-white p-4 sm:p-6">
                <p className="text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                  Details
                </p>
                <h3 className="mt-2 text-lg font-semibold text-black sm:text-xl">
                  Fiche detaillee
                </h3>
                <div className="mt-5 overflow-hidden rounded-md border border-gray-200">
                  <ul className="tabular-nums">
                    <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                        Nom de l&apos;entité
                      </span>
                      <span className="text-right text-xs font-medium text-gray-900 sm:text-sm">
                        {company.name}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                        Type de profil
                      </span>
                      <span className="text-right text-xs font-medium text-gray-900 sm:text-sm">
                        {company.profile_type}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                        Secteur d&apos;activité
                      </span>
                      <span className="text-right text-xs font-medium text-gray-900 sm:text-sm">
                        {company.sector}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                        Ville
                      </span>
                      <span className="text-right text-xs font-medium text-gray-900 sm:text-sm">
                        {company.city}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                        Numéro WhatsApp
                      </span>
                      <span className="text-right text-xs font-medium tabular-nums text-gray-900 sm:text-sm">
                        {company.whatsapp}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-4 border-t border-gray-100 px-4 py-3 hover:bg-gray-50">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                        Années d&apos;expérience
                      </span>
                      <span className="text-right text-xs font-medium tabular-nums text-gray-900 sm:text-sm">
                        {company.years_experience ?? 'À renseigner'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-4 border-t border-gray-100 px-4 py-3 hover:bg-gray-50">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                        Projets terminés
                      </span>
                      <span className="text-right text-xs font-medium tabular-nums text-gray-900 sm:text-sm">
                        {company.completed_projects ?? 'À renseigner'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-4 border-t border-gray-100 px-4 py-3 hover:bg-gray-50">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                        Nombre d&apos;employés
                      </span>
                      <span className="text-right text-xs font-medium tabular-nums text-gray-900 sm:text-sm">
                        {company.employee_count ?? 'À renseigner'}
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="mt-3 space-y-2 rounded-md border border-gray-200 p-3 sm:mt-4 sm:space-y-3 sm:p-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                      Histoire de l&apos;entreprise
                    </p>
                    <p className="mt-1 text-xs text-gray-700 sm:text-sm">
                      {company.company_story || 'À renseigner'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                      Message de l&apos;entreprise
                    </p>
                    <p className="mt-1 text-xs text-gray-700 sm:text-sm">
                      {company.founder_message || 'À renseigner'}
                    </p>
                  </div>
                </div>
              </section>

              {company.logo_url && (
                <div className="rounded-md border border-gray-200 bg-white p-4 sm:p-6">
                  <label className="mb-1 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                    Logo
                  </label>
                  <Image
                    src={company.logo_url}
                    alt="Logo de l'entreprise"
                    width={80}
                    height={80}
                    className="rounded-lg border object-cover"
                  />
                </div>
              )}

              <div className="rounded-md border border-gray-200 bg-white p-6 lg:col-span-2">
                <label className="mb-1 block text-[10px] font-medium uppercase tabular-nums tracking-widest text-gray-500">
                  Galerie ({galleryUrls.filter(Boolean).length}/5)
                </label>
                {galleryUrls.some(Boolean) ? (
                  <div className="grid grid-cols-3 gap-2">
                    {galleryUrls
                      .filter((url): url is string => Boolean(url))
                      .map((url, index) => (
                        <Image
                          key={`${url}-${index}`}
                          src={url}
                          alt={`Photo galerie ${index + 1}`}
                          width={80}
                          height={80}
                          className="rounded-lg border object-cover"
                        />
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune photo de galerie.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <p className="text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                Dashboard Woralink
              </p>
              <h1 className="mt-2 text-xl font-bold tracking-tighter text-primary sm:text-2xl md:text-3xl">
                {editing ? 'Modifier votre profil' : 'Créer un profil professionnel'}
              </h1>
              <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                {editing
                  ? 'Mettez à jour votre fiche et votre galerie pour garder une page publique complète.'
                  : 'Configurez votre fiche entreprise pour apparaître sur Woralink et commencer à recevoir des demandes.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 sm:px-4 sm:text-sm"
                >
                  Retour au dashboard
                </Link>
                <Link
                  href="/dashboard/gallery"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 sm:px-4 sm:text-sm"
                >
                  Gérer ma galerie
                </Link>
                {company && (
                  <Link
                    href={`/pme/${company.slug}`}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 sm:px-4 sm:text-sm"
                  >
                    Voir ma page publique
                  </Link>
                )}
              </div>
            </div>

            {!editing && !company && (
              <div className="mb-4 text-center sm:mb-6">
                <p className="mb-3 text-xs text-gray-500 sm:text-sm">
                  Vous pourrez compléter votre profil professionnel à tout moment depuis votre
                  tableau de bord.
                </p>
                <div className="flex justify-center">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-primary hover:text-primary sm:text-sm"
                  >
                    Passer pour plus tard
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
              <section className="space-y-4 rounded-md border border-gray-200 bg-white p-4 sm:space-y-5 sm:p-6">
                <div>
                  <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                    Nom de l&apos;entité
                  </label>
                  <input
                    type="text"
                    {...register('entityName', { required: 'Ce champ est requis' })}
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
                  />
                  {errors.entityName && (
                    <p className="mt-1 text-xs text-red-600 sm:text-sm">
                      {String(errors.entityName.message)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                      Type de profil
                    </label>
                    <select
                      {...register('profileType', { required: 'Ce champ est requis' })}
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
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
                    <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                      Secteur d&apos;activité
                    </label>
                    <select
                      {...register('sector', { required: 'Ce champ est requis' })}
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
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
                    <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                      Ville
                    </label>
                    <input
                      type="text"
                      {...register('city', { required: 'Ce champ est requis' })}
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-600 sm:text-sm">
                        {String(errors.city.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
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
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
                    />
                    {errors.whatsapp && (
                      <p className="mt-1 text-xs text-red-600 sm:text-sm">
                        {String(errors.whatsapp.message)}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-md border border-gray-200 bg-white p-4 sm:space-y-5 sm:p-6">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                      Histoire de l&apos;entreprise
                    </label>
                    <span className="text-[10px] tabular-nums text-gray-500 sm:text-xs">
                      {companyStoryCharacterCount} caractères
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    {...register('companyStory')}
                    placeholder="Racontez l'histoire de votre entreprise, votre mission et vos points forts."
                    className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
                  />
                  {companyStoryCharacterCount < 200 && (
                    <p className="mt-2 text-xs text-orange-600 sm:text-sm">
                      💡 Conseil SEO : Une description de plus de 200 mots aide Google à vous
                      trouver plus facilement
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-3 text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                    Chiffres clés
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    <div>
                      <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                        Années d&apos;expérience
                      </label>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        {...register('yearsExperience')}
                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs tabular-nums text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                        Projets terminés
                      </label>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        {...register('completedProjects')}
                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs tabular-nums text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                        Nombre d&apos;employés
                      </label>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        {...register('employeeCount')}
                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs tabular-nums text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-md border border-gray-200 bg-white p-4 sm:space-y-5 sm:p-6">
                <div>
                  <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                    Message de l&apos;entreprise
                  </label>
                  <textarea
                    rows={5}
                    {...register('founderMessage')}
                    placeholder="Partagez un message de votre entreprise pour créer un lien de confiance."
                    className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                    Adresse physique
                  </label>
                  <textarea
                    rows={3}
                    {...register('address')}
                    placeholder="Ex: 123 Avenue Ahmed Sékou Touré, Conakry, Guinée"
                    className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                    Site web ou lien social
                  </label>
                  <input
                    type="url"
                    {...register('website_url')}
                    placeholder="https://votre-site.com ou https://linkedin.com/company/..."
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3 sm:text-sm"
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-md border border-gray-200 bg-white p-4 sm:space-y-5 sm:p-6">
                <div>
                  <label className="mb-1.5 block text-[9px] font-medium uppercase tracking-widest text-gray-500 sm:text-[10px]">
                    Logo de l&apos;entreprise (optionnel)
                  </label>
                  <small className="mb-2 block text-[10px] text-gray-500 sm:text-xs">
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

                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 sm:p-4 sm:text-sm">
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
          <div className="rounded-xl border border-gray-200 bg-white p-8">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500">
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

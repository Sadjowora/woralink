'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Building,
  Check,
  Camera,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Save,
  X,
} from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { computeProfileCompletionPercent } from '../../../lib/company-completion';
import { supabase } from '../../../lib/supabase';

type CompanyRecord = {
  id: string;
  user_id: string;
  slug: string | null;
  name: string | null;
  sector: string | null;
  city: string | null;
  description: string | null;
  address: string | null;
  whatsapp: string | null;
  website_url: string | null;
  logo_url: string | null;
};

type FormState = {
  name: string;
  sector: string;
  description: string;
  city: string;
  address: string;
  whatsapp: string;
  website_url: string;
  logo_url: string;
};

type Notice = {
  type: 'success' | 'error';
  message: string;
};

function extractStoragePathFromPublicUrl(publicUrl: string): string | null {
  const marker = '/storage/v1/object/public/company-media/';
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) return null;

  const rawPath = publicUrl.slice(markerIndex + marker.length).trim();
  return rawPath.length > 0 ? decodeURIComponent(rawPath) : null;
}

const SECTORS = [
  'Tech & Numerique',
  'Transport & Logistique',
  'Commerce & Distribution',
  'Artisanat & Art',
  'Construction & BTP',
  'Restauration & Hotellerie',
  'Sante & Pharmacie',
  'Education & Formation',
  'Finance & Assurance',
  'Medias & Communication',
  'Energie & Environnement',
  'Consultations & Services',
  'Logement & Immobilier',
  'Livraison & Domicile',
  'Autre',
] as const;

const CITIES = [
  'Conakry',
  'Labe',
  'Kankan',
  'Kindia',
  'Mamou',
  'Nzerekore',
  'Boke',
  'Faranah',
] as const;

const INITIAL_FORM: FormState = {
  name: '',
  sector: '',
  description: '',
  city: 'Conakry',
  address: '',
  whatsapp: '',
  website_url: '',
  logo_url: '',
};

function mapCompanyToForm(company: CompanyRecord | null): FormState {
  if (!company) return INITIAL_FORM;

  return {
    name: company.name ?? '',
    sector: company.sector ?? '',
    description: company.description ?? '',
    city: company.city ?? 'Conakry',
    address: company.address ?? '',
    whatsapp: company.whatsapp ?? '',
    website_url: company.website_url ?? '',
    logo_url: company.logo_url ?? '',
  };
}

export default function CompanyProfilePage() {
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [snapshot, setSnapshot] = useState<FormState>(INITIAL_FORM);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const completionPercent = useMemo(() => {
    return computeProfileCompletionPercent({
      name: form.name,
      sector: form.sector,
      city: form.city,
      slug: form.name,
      logo_url: form.logo_url,
      whatsapp: form.whatsapp,
      website_url: form.website_url,
      description: form.description,
      address: form.address,
    });
  }, [form]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        window.location.href = '/login';
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('companies')
        .select(
          'id, user_id, slug, name, sector, city, description, address, whatsapp, website_url, logo_url',
        )
        .eq('user_id', user.id)
        .maybeSingle<CompanyRecord>();

      if (!mounted) return;

      if (error) {
        setNotice({
          type: 'error',
          message:
            'Impossible de charger votre profil entreprise. Reessayez dans quelques instants.',
        });
        setChecking(false);
        return;
      }

      setProfileSlug(data?.slug ?? null);
      setForm(mapCompanyToForm(data ?? null));
      setChecking(false);
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [notice]);

  useEffect(() => {
    return () => {
      if (localLogoPreview) {
        URL.revokeObjectURL(localLogoPreview);
      }
    };
  }, [localLogoPreview]);

  const onFieldChange = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onToggleEdit = () => {
    setSnapshot(form);
    setCanEdit(true);
  };

  const onCancelEdit = () => {
    setForm(snapshot);
    if (localLogoPreview) {
      URL.revokeObjectURL(localLogoPreview);
      setLocalLogoPreview(null);
    }
    setCanEdit(false);
    setNotice({
      type: 'success',
      message: 'Modification annulee. Les donnees precedentes sont restaurees.',
    });
  };

  const onLogoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!userId) {
      setNotice({ type: 'error', message: 'Session invalide. Veuillez vous reconnecter.' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', message: 'Selectionnez une image valide (PNG, JPG, WEBP...).' });
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', message: 'Le logo ne doit pas depasser 5MB.' });
      event.target.value = '';
      return;
    }

    setLogoUploading(true);
    setNotice(null);

    if (localLogoPreview) {
      URL.revokeObjectURL(localLogoPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalLogoPreview(previewUrl);

    const previousLogoUrl = form.logo_url;

    try {
      const fileExt = file.name.split('.').pop() ?? 'png';
      const filePath = `logos/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage.from('company-media').getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      const oldStoragePath = previousLogoUrl
        ? extractStoragePathFromPublicUrl(previousLogoUrl)
        : null;

      if (oldStoragePath && oldStoragePath !== filePath) {
        // Best effort cleanup: we don't block success if delete fails.
        await supabase.storage.from('company-media').remove([oldStoragePath]);
      }

      setForm((current) => ({ ...current, logo_url: publicUrl }));
      URL.revokeObjectURL(previewUrl);
      setLocalLogoPreview(null);
      setNotice({ type: 'success', message: 'Logo telecharge avec succes.' });
    } catch {
      URL.revokeObjectURL(previewUrl);
      setLocalLogoPreview(null);
      setNotice({
        type: 'error',
        message: "Echec de l'upload du logo. Verifiez le bucket storage et vos permissions.",
      });
    } finally {
      setLogoUploading(false);
      event.target.value = '';
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canEdit) {
      setNotice({ type: 'error', message: 'Activez le mode modification avant de sauvegarder.' });
      return;
    }

    if (!userId) {
      setNotice({ type: 'error', message: 'Session invalide. Veuillez vous reconnecter.' });
      return;
    }

    setLoading(true);
    setNotice(null);

    const payload = {
      name: form.name.trim(),
      sector: form.sector.trim(),
      description: form.description.trim() || null,
      city: form.city.trim(),
      address: form.address.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      website_url: form.website_url.trim() || null,
      logo_url: form.logo_url.trim() || null,
    };

    const { data, error } = await supabase
      .from('companies')
      .update(payload)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle<{ id: string }>();

    setLoading(false);

    if (error || !data?.id) {
      setNotice({
        type: 'error',
        message:
          "Echec de l'enregistrement du profil. Verifiez vos informations et vos permissions.",
      });
      return;
    }

    setNotice({ type: 'success', message: 'Profil entreprise enregistre avec succes.' });
    setCanEdit(false);
  };

  const companyNameDisplay = form.name.trim() || 'Votre entreprise';
  const sectorDisplay = form.sector.trim() || 'Secteur non renseigne';
  const profileUrl =
    typeof window !== 'undefined' && profileSlug
      ? `${window.location.origin}/pme/${profileSlug}`
      : '/dashboard';

  if (checking) {
    return (
      <DashboardShell
        title="Profil Entreprise"
        subtitle="Gerez votre identite, vos coordonnees et la presentation publique de votre activite."
      >
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Chargement de votre profil entreprise...
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Profil Entreprise"
      subtitle="Gerez votre identite, vos coordonnees et la presentation publique de votre activite."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          Retour Apercu
        </Link>
      }
    >
      <div className="relative mb-4">
        <div
          className={`pointer-events-none fixed right-4 top-20 z-50 w-full max-w-sm rounded-xl border p-4 shadow-lg transition-all duration-200 ${
            notice ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
          } ${
            notice?.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            {notice?.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <p className="text-sm font-medium">{notice?.message}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={(event) => {
              void onLogoSelect(event);
            }}
            className="hidden"
          />

          <section className="relative overflow-visible rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="bg-linear-to-r relative h-40 rounded-xl from-emerald-500 to-teal-600 sm:h-44">
              <div className="absolute inset-x-0 top-0 p-4 sm:p-6">
                <div className="backdrop-blur-xs inline-flex max-w-full flex-col rounded-xl bg-black/15 px-3 py-2 text-white shadow-sm sm:px-4 sm:py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-100/90">
                    Profil Entreprise
                  </p>
                  <h2 className="mt-0.5 line-clamp-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {companyNameDisplay}
                  </h2>
                  <p className="line-clamp-1 text-xs text-emerald-50/90 sm:text-sm">
                    {sectorDisplay}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-10 left-4 h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md dark:border-slate-950 dark:bg-slate-900 sm:-bottom-12 sm:left-6 sm:h-24 sm:w-24">
              {localLogoPreview ? (
                <Image
                  src={localLogoPreview}
                  alt="Previsualisation locale du logo"
                  fill
                  sizes="(max-width: 640px) 80px, 96px"
                  className="h-full w-full object-cover"
                />
              ) : form.logo_url ? (
                <Image
                  src={form.logo_url}
                  alt={companyNameDisplay}
                  fill
                  sizes="(max-width: 640px) 80px, 96px"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-2xl font-semibold text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                  {companyNameDisplay.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!canEdit) {
                    onToggleEdit();
                    return;
                  }

                  logoInputRef.current?.click();
                }}
                className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-emerald-600 text-white shadow-sm transition-colors duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-900"
                disabled={logoUploading || loading}
                aria-label="Modifier le logo"
              >
                {logoUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="px-4 pb-5 pt-12 sm:px-6 sm:pb-6 sm:pt-16">
              <div className="flex flex-wrap items-center justify-between gap-3 sm:pl-24">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                    {completionPercent}% Optimise
                  </span>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Annuler
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onToggleEdit}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Modifier le profil
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Informations generales
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-slate-300">
                    Nom de l&apos;entreprise
                  </label>
                  <input
                    value={form.name}
                    onChange={(event) => onFieldChange('name', event.target.value)}
                    required
                    disabled={!canEdit || loading}
                    type="text"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                    placeholder="Woralink"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-slate-300">
                    Secteur d&apos;activite
                  </label>
                  <select
                    value={form.sector}
                    onChange={(event) => onFieldChange('sector', event.target.value)}
                    required
                    disabled={!canEdit || loading}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                  >
                    <option value="">Selectionnez un secteur</option>
                    {SECTORS.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-slate-300">
                    Description / Biographie
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) => onFieldChange('description', event.target.value)}
                    disabled={!canEdit || loading}
                    rows={6}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                    placeholder="Presentez votre activite, votre expertise et ce qui vous distingue sur Woralink."
                  />
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Localisation & Contact
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-slate-300">
                    Ville principale
                  </label>
                  <select
                    value={form.city}
                    onChange={(event) => onFieldChange('city', event.target.value)}
                    required
                    disabled={!canEdit || loading}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                  >
                    {CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-slate-300">
                    Adresse complete
                  </label>
                  <input
                    value={form.address}
                    onChange={(event) => onFieldChange('address', event.target.value)}
                    disabled={!canEdit || loading}
                    type="text"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                    placeholder="Ex: Commune de Tombolia, Conakry"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-slate-300">
                    Telephone professionnel
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                    <input
                      value={form.whatsapp}
                      onChange={(event) => onFieldChange('whatsapp', event.target.value)}
                      disabled={!canEdit || loading}
                      type="tel"
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                      placeholder="+224 ..."
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-slate-300">
                    Site Web / Lien externe
                  </label>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                    <input
                      value={form.website_url}
                      onChange={(event) => onFieldChange('website_url', event.target.value)}
                      disabled={!canEdit || loading}
                      type="url"
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
                      placeholder="https://votre-site.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-slate-300">
                    Logo entreprise
                  </label>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Telechargez un logo reel vers Supabase Storage.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (!canEdit) {
                            onToggleEdit();
                            return;
                          }

                          logoInputRef.current?.click();
                        }}
                        disabled={!canEdit || logoUploading || loading}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors duration-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/50 dark:bg-slate-900 dark:text-emerald-300"
                      >
                        {logoUploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {logoUploading ? 'Upload...' : 'Telecharger le logo'}
                      </button>
                    </div>
                    {localLogoPreview ? (
                      <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                        Previsualisation locale active. Le nouveau logo sera applique des la fin de
                        l&apos;upload.
                      </p>
                    ) : null}
                    {form.logo_url ? (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Logo actif et synchronise.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              href={profileUrl}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Voir la fiche publique
            </Link>

            {canEdit ? (
              <button
                type="submit"
                disabled={loading || checking || logoUploading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Sauvegarder le profil
                  </>
                )}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

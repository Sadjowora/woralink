'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Eye, Globe, MapPin, ChevronLeft, ChevronRight, X as CloseIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import ReviewSystem from '../../../components/ReviewSystem';
import ShareProfile from '../../../components/ShareProfile';
import VerifiedBadge from '../../../components/ui/VerifiedBadge';
import { computeProfileCompletionPercent } from '../../../../lib/company-completion';
import { supabase } from '../../../../lib/supabase';

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

type Company = {
  id: string;
  user_id?: string | null;
  name: string;
  profile_type: string;
  sector: string;
  city: string;
  whatsapp: string;
  slug: string;
  logo_url?: string;
  description?: string;
  is_verified?: boolean | null;
  company_story?: string | null;
  years_experience?: number | null;
  completed_projects?: number | null;
  employee_count?: number | null;
  founder_message?: string | null;
  address?: string | null;
  website_url?: string | null;
  views?: number | null;
  views_count?: number | null;
};

type CompanyProfileProps = {
  company: Company;
  photos: Array<{
    url: string;
    caption: string;
    uploadedAt: string | null;
  }>;
};

function formatCompactViews(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const formatted = (value / 1000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}k`;
  }

  const formatted = (value / 1_000_000).toFixed(1).replace(/\.0$/, '');
  return `${formatted}M`;
}

function extractViewsCount(payload: unknown): number | null {
  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'views_count' in payload) {
    const value = (payload as { views_count?: unknown }).views_count;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

export default function CompanyProfile({ company, photos }: CompanyProfileProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loadedGalleryImages, setLoadedGalleryImages] = useState<Record<string, boolean>>({});
  const [lightboxImageLoaded, setLightboxImageLoaded] = useState(false);
  const [currentViews, setCurrentViews] = useState<number>(
    Math.max(0, Number(company.views ?? company.views_count ?? 0) || 0),
  );
  const hasIncrementedViewsRef = useRef(false);
  const photoUrls = photos.map((photo) => photo.url);

  useEffect(() => {
    if (hasIncrementedViewsRef.current) return;
    hasIncrementedViewsRef.current = true;

    const incrementViews = async () => {
      const viewedKey = `viewed_${company.slug}`;
      const alreadyViewed = window.sessionStorage.getItem(viewedKey);

      console.log('[Views] increment check', {
        slug: company.slug,
        companyId: company.id,
        alreadyViewed: Boolean(alreadyViewed),
      });

      if (alreadyViewed) {
        console.log('[Views] skipped: session already counted for this profile');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id;

      // Do not count a view when the company owner is viewing their own profile.
      if (currentUserId && company.user_id && currentUserId === company.user_id) {
        console.log('[Views] skipped: owner is viewing own profile', {
          currentUserId,
          ownerId: company.user_id,
        });
        return;
      }

      console.log('[Views] calling RPC increment_view', { company_slug: company.slug });
      let rpcData: unknown = null;
      let finalError: { message?: string; details?: string; hint?: string; code?: string } | null =
        null;

      const step1 = await supabase.rpc('increment_view', { company_slug: company.slug });
      rpcData = step1.data;
      finalError = step1.error;

      if (finalError) {
        console.warn(
          '[Views] increment_view(company_slug) failed, fallback to increment_views(company_id)',
          {
            message: finalError.message,
            details: finalError.details,
            hint: finalError.hint,
            code: finalError.code,
          },
        );

        const step2 = await supabase.rpc('increment_views', { company_id: company.id });
        rpcData = step2.data;
        finalError = step2.error;
      }

      if (finalError) {
        console.error('[Views] increment_views(company_id) failed', {
          message: finalError.message,
          details: finalError.details,
          hint: finalError.hint,
          code: finalError.code,
        });
        return;
      }

      console.log('[Views] increment success', { rpcData });
      window.sessionStorage.setItem(viewedKey, '1');
      const nextViews = extractViewsCount(rpcData);
      if (nextViews !== null) {
        setCurrentViews(nextViews);
        return;
      }

      setCurrentViews((prev) => prev + 1);
    };

    void incrementViews();
  }, [company.id, company.slug, company.user_id, company.views, company.views_count]);

  const openLightbox = (index: number) => {
    setLightboxImageLoaded(false);
    setLightboxIndex(index);
  };
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const prevPhoto = useCallback(() => {
    setLightboxImageLoaded(false);
    setLightboxIndex((i) => (i !== null ? (i - 1 + photoUrls.length) % photoUrls.length : null));
  }, [photoUrls.length]);

  const nextPhoto = useCallback(() => {
    setLightboxImageLoaded(false);
    setLightboxIndex((i) => (i !== null ? (i + 1) % photoUrls.length : null));
  }, [photoUrls.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, closeLightbox, prevPhoto, nextPhoto]);

  const whatsappUrl = `https://wa.me/${company.whatsapp.replace(/[^0-9]/g, '')}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || '';
  const profileUrl = `${siteUrl}/pme/${company.slug}`;
  const formattedViews = formatCompactViews(currentViews);
  const completionPercent = computeProfileCompletionPercent(company);

  useEffect(() => {
    document.title = `${company.name} - ${company.sector} à ${company.city} | Woralink`;

    const sourceDescription = (company.description || company.company_story || '').trim();
    if (!sourceDescription) {
      return;
    }

    const metaDescriptionContent = sourceDescription.slice(0, 160);
    let metaDescriptionTag = document.querySelector('meta[name="description"]');

    if (!metaDescriptionTag) {
      metaDescriptionTag = document.createElement('meta');
      metaDescriptionTag.setAttribute('name', 'description');
      document.head.appendChild(metaDescriptionTag);
    }

    metaDescriptionTag.setAttribute('content', metaDescriptionContent);
  }, [company.name, company.sector, company.city, company.description, company.company_story]);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Hero */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-10 sm:gap-5 sm:py-14">
          <div className="relative">
            {company.logo_url ? (
              <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200 bg-white sm:h-32 sm:w-32">
                <Image
                  src={company.logo_url}
                  alt={`Logo de ${company.name}`}
                  fill
                  sizes="(max-width: 640px) 96px, 128px"
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-3xl font-bold text-gray-500 sm:h-32 sm:w-32 sm:text-5xl">
                {company.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-3 text-center">
            <div className="flex flex-col items-center gap-2">
              <h1 className="line-clamp-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
                {company.name}
              </h1>
              <VerifiedBadge isVerified={!!company.is_verified} />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formattedViews} vues</span>
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Profil complet a {completionPercent}%
            </p>

            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                {company.profile_type}
              </span>
              <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                {company.sector}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {company.city}
              </span>
            </div>

            {company.description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 sm:mt-3 sm:text-base">
                {company.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contact & Informations */}
      {(company.address || company.website_url) && (
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="mx-auto mt-8 max-w-4xl px-4 sm:mt-10"
        >
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Informations
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                Contact &amp; Adresse
              </h2>
            </div>
            <div className="space-y-4 px-5 py-5">
              {company.address && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Adresse physique
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{company.address}</p>
                </div>
              )}
              {company.website_url && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Site web ou lien social
                  </p>
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
                  >
                    <Globe className="h-4 w-4" aria-hidden="true" />
                    {company.website_url}
                  </a>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Storytelling */}
      {(company.company_story || company.description) && (
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="mx-auto mt-8 max-w-4xl px-4 sm:mt-10"
        >
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Storytelling
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                Notre Histoire
              </h2>
            </div>
            <p className="px-5 py-5 text-base leading-relaxed text-gray-600">
              {company.company_story || company.description}
            </p>
          </div>
        </motion.section>
      )}

      {/* Metrics banner */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="mx-auto mt-6 max-w-4xl px-4"
      >
        <div className="grid grid-cols-1 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <motion.div variants={fadeInUp} className="flex items-center gap-3 p-4 sm:p-5">
            <span className="rounded-lg bg-green-50 p-2 text-green-700">
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M10 5.5v4.75l3 1.75"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.25" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Expérience
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-gray-900">
                {company.years_experience ?? 0} ans
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex items-center gap-3 p-4 sm:p-5">
            <span className="rounded-lg bg-green-50 p-2 text-green-700">
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M4.75 15.25h10.5M6.5 13V8.75m3.5 4.25V6.5m3.5 6.5v-3"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Projets</p>
              <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-gray-900">
                {company.completed_projects ?? 0}
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex items-center gap-3 p-4 sm:p-5">
            <span className="rounded-lg bg-green-50 p-2 text-green-700">
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M6.75 8.75a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6.5 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3.75 15a3 3 0 0 1 6 0m2.5 0a3 3 0 1 1 6 0"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Équipe</p>
              <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-gray-900">
                {company.employee_count ?? 0}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Gallery */}
      {photos.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="mx-auto mt-8 max-w-4xl px-4 sm:mt-10"
        >
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
            Galerie
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {photos.map((photo, index) => {
              const dateLabel = photo.uploadedAt
                ? new Date(photo.uploadedAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Date non disponible';
              const imageKey = `${index}-${photo.url}`;
              const isImageLoaded = Boolean(loadedGalleryImages[imageKey]);

              return (
                <motion.article
                  key={`photo-post-${index}`}
                  variants={fadeInUp}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-150 hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-3">
                      {company.logo_url ? (
                        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                          <Image
                            src={company.logo_url}
                            alt={`Logo de ${company.name}`}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold tracking-tight text-gray-900">
                          {company.name}
                        </p>
                        <p className="text-xs text-gray-500">{company.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{dateLabel}</p>
                      <span className="mt-0.5 inline-flex rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        {index + 1}/{photos.length}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openLightbox(index)}
                    className="relative block aspect-square w-full overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-700/20"
                    aria-label={`Ouvrir la photo ${index + 1}`}
                  >
                    {!isImageLoaded && (
                      <div className="absolute inset-0 animate-pulse bg-gray-200" />
                    )}
                    <Image
                      src={photo.url}
                      alt={`Photo ${index + 1} de ${company.name}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 460px"
                      className={`object-cover transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => {
                        setLoadedGalleryImages((prev) => ({
                          ...prev,
                          [imageKey]: true,
                        }));
                      }}
                    />

                    {photos.length > 1 && (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {index + 1}/{photos.length}
                      </span>
                    )}
                  </button>

                  <div className="px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Légende
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {photo.caption?.trim() || 'Aucune légende fournie.'}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visionneuse de photos"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
            aria-label="Fermer"
          >
            <CloseIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          {photoUrls.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              className="absolute left-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
          )}

          <div
            className="relative mx-16 max-h-[80vh] w-full max-w-3xl sm:mx-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
              {!lightboxImageLoaded && (
                <div className="absolute inset-0 animate-pulse rounded-xl bg-gray-800" />
              )}
              <Image
                src={photoUrls[lightboxIndex]}
                alt={`Photo ${lightboxIndex + 1} de ${company.name}`}
                fill
                className={`rounded-xl object-contain transition-opacity duration-300 ${lightboxImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                sizes="(max-width: 768px) 100vw, 800px"
                onLoad={() => setLightboxImageLoaded(true)}
              />
            </div>
            <p className="mt-3 text-center text-sm text-white/60">
              {lightboxIndex + 1} / {photoUrls.length}
            </p>
          </div>

          {photoUrls.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              className="absolute right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
              aria-label="Photo suivante"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Share Profile Section */}
      <motion.section
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="mx-auto mt-8 max-w-4xl px-4 sm:mt-10"
      >
        <ShareProfile companyName={company.name} profileUrl={profileUrl} />
      </motion.section>

      {/* Reviews Section */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="mx-auto mt-8 max-w-4xl px-4 sm:mt-10"
      >
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
          Avis &amp; Notes
        </h2>
        <ReviewSystem companyId={company.id} />
      </motion.div>

      {/* Floating WhatsApp button */}
      {company.whatsapp && (
        <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-green-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-green-800 sm:px-5 sm:py-3"
            aria-label="Contacter sur WhatsApp"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="hidden sm:inline">Contact WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  );
}

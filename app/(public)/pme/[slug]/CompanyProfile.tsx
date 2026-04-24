'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import ReviewSystem from '../../../components/ReviewSystem';
import ShareProfile from '../../../components/ShareProfile';
import { supabase } from '../../../../lib/supabase';

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
    founder_name?: string | null;
    founder_message?: string | null;
    founder_photo_url?: string | null;
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

export default function CompanyProfile({ company, photos }: CompanyProfileProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [loadedGalleryImages, setLoadedGalleryImages] = useState<Record<string, boolean>>({});
    const [lightboxImageLoaded, setLightboxImageLoaded] = useState(false);
    const hasIncrementedViewsRef = useRef(false);
    const photoUrls = photos.map((photo) => photo.url);

    useEffect(() => {
        if (hasIncrementedViewsRef.current) return;
        hasIncrementedViewsRef.current = true;

        const incrementViews = async () => {
            const viewedKey = `viewed_${company.slug}`;
            const alreadyViewed = window.sessionStorage.getItem(viewedKey);

            if (alreadyViewed) {
                return;
            }

            const { data: userData } = await supabase.auth.getUser();
            const currentUserId = userData?.user?.id;

            // Do not count a view when the company owner is viewing their own profile.
            if (currentUserId && company.user_id && currentUserId === company.user_id) {
                return;
            }

            const { error } = await supabase.rpc('increment_views', { company_id: company.id });
            if (!error) {
                window.sessionStorage.setItem(viewedKey, '1');
            }
        };

        void incrementViews();
    }, [company.id, company.slug, company.user_id]);

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
    const founderDisplayName = company.founder_name?.trim() || `Fondateur de ${company.name}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || '';
    const profileUrl = `${siteUrl}/pme/${company.slug}`;
    const rawViews = company.views ?? company.views_count ?? 0;
    const formattedViews = formatCompactViews(Math.max(0, Number(rawViews) || 0));

    return (
        <div className="min-h-screen bg-gray-50 pb-28">
            {/* Hero */}
            <div className="border-b border-gray-100 bg-white">
                <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center gap-4 sm:gap-5">
                    <div className="relative">
                        {company.logo_url ? (
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 bg-white">
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
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-900 text-3xl sm:text-5xl font-bold">
                                {company.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {company.is_verified && (
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full border border-primary bg-primary px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-medium uppercase tracking-wide text-white">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-white" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 1.667a1.5 1.5 0 0 1 1.294.742l.722 1.24 1.408.319a1.5 1.5 0 0 1 1.115 1.988l-.478 1.361.955 1.075a1.5 1.5 0 0 1-.087 2.087l-1.075.955.478 1.361a1.5 1.5 0 0 1-1.115 1.988l-1.408.32-.722 1.238a1.5 1.5 0 0 1-2.588 0l-.722-1.239-1.408-.319a1.5 1.5 0 0 1-1.115-1.988l.478-1.36-.955-.956a1.5 1.5 0 0 1 .087-2.087l1.075-.955-.478-1.361a1.5 1.5 0 0 1 1.115-1.988l1.408-.32.722-1.239A1.5 1.5 0 0 1 10 1.667Zm2.373 6.294a.75.75 0 1 0-1.11-1.005L9.14 9.298l-.404-.403a.75.75 0 1 0-1.06 1.06l.96.96a.75.75 0 0 0 1.085-.025l2.652-2.929Z" clipRule="evenodd" />
                                </svg>
                                Expertise Garantie
                            </span>
                        )}
                    </div>

                    <div className="text-center space-y-2 sm:space-y-3">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter text-primary line-clamp-2">
                            {company.name}
                        </h1>

                        <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500">
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{formattedViews} vues</span>
                        </div>

                        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                                {company.profile_type}
                            </span>
                            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs sm:text-sm font-medium">
                                {company.sector}
                            </span>
                            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-xs sm:text-sm font-medium">
                                📍 {company.city}
                            </span>
                        </div>

                        {company.description && (
                            <p className="mt-2 sm:mt-3 text-gray-600 max-w-2xl leading-relaxed text-sm sm:text-base">
                                {company.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Contact & Informations */}
            {(company.address || company.website_url) && (
                <section className="max-w-4xl mx-auto px-4 mt-8 sm:mt-10">
                    <div className="rounded-md border border-gray-200 bg-white p-5 sm:p-7 md:p-9">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500">Informations</p>
                        <h2 className="mt-2 text-xl sm:text-2xl font-semibold tracking-tighter text-primary">Contact & Adresse</h2>
                        <div className="mt-4 sm:mt-5 space-y-4">
                            {company.address && (
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Adresse physique</p>
                                    <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{company.address}</p>
                                </div>
                            )}
                            {company.website_url && (
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Site web ou lien social</p>
                                    <a
                                        href={company.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm sm:text-base text-primary hover:underline"
                                    >
                                        {company.website_url}
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Storytelling */}
            {(company.company_story || company.description) && (
                <section className="max-w-4xl mx-auto px-4 mt-8 sm:mt-10">
                    <div className="rounded-md border border-gray-200 bg-white p-5 sm:p-7 md:p-9">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500">Storytelling</p>
                        <h2 className="mt-2 text-xl sm:text-2xl font-semibold tracking-tighter text-primary">Notre Histoire</h2>
                        <p className="mt-4 sm:mt-5 font-serif text-base sm:text-lg leading-7 sm:leading-8 text-gray-700">
                            {company.company_story || company.description}
                        </p>
                    </div>
                </section>
            )}

            {/* Metrics banner */}
            <section className="max-w-4xl mx-auto px-4 mt-6">
                <div className="grid grid-cols-1 divide-y divide-gray-100 rounded-md border border-gray-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-gray-400" aria-hidden="true">
                            <path d="M10 5.5v4.75l3 1.75" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.25" />
                        </svg>
                        <div>
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500">Expérience</p>
                            <p className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-medium tracking-tighter text-black tabular-nums">
                                {company.years_experience ?? 0} ans
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-gray-400" aria-hidden="true">
                            <path d="M4.75 15.25h10.5M6.5 13V8.75m3.5 4.25V6.5m3.5 6.5v-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div>
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500">Projets</p>
                            <p className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-medium tracking-tighter text-black tabular-nums">
                                {company.completed_projects ?? 0}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-gray-400" aria-hidden="true">
                            <path d="M6.75 8.75a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6.5 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3.75 15a3 3 0 0 1 6 0m2.5 0a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div>
                            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500">Équipe</p>
                            <p className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-medium tracking-tighter text-black tabular-nums">
                                {company.employee_count ?? 0}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery */}
            {photos.length > 0 && (
                <div className="max-w-4xl mx-auto px-4 mt-8 sm:mt-10">
                    <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold tracking-tighter text-primary">Galerie</h2>
                    <div className="grid gap-5 sm:grid-cols-2">
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
                                <article
                                    key={`photo-post-${index}`}
                                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="flex items-center justify-between border-b border-gray-100 px-3 sm:px-4 py-2 sm:py-3">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gray-900 text-[10px] sm:text-xs font-semibold text-white">
                                                {company.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm font-semibold tracking-tight text-black">{company.name}</p>
                                                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500">{company.city}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-gray-500">{dateLabel}</p>
                                            <p className="mt-0.5 sm:mt-1 inline-flex rounded-full border border-gray-200 bg-gray-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                                                {index + 1}/{photos.length}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => openLightbox(index)}
                                        className="relative block w-full aspect-square overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                                            <span className="absolute right-2 sm:right-3 top-2 sm:top-3 inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/45 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                                                <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true">
                                                    <rect x="4.25" y="4.25" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                                                    <rect x="7.25" y="7.25" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                                                </svg>
                                                Post
                                            </span>
                                        )}
                                    </button>

                                    <div className="space-y-1 sm:space-y-2 px-3 sm:px-4 py-2 sm:py-3">
                                        <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-gray-500">Légende</p>
                                        <p className="text-xs sm:text-sm leading-relaxed text-gray-700">
                                            {photo.caption?.trim() || 'Aucune légende fournie.'}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Visionneuse de photos"
                    className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Close */}
                    <button
                        type="button"
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center text-2xl transition-colors"
                        aria-label="Fermer"
                    >
                        ×
                    </button>

                    {/* Previous */}
                    {photoUrls.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                            className="absolute left-4 text-white bg-white/20 hover:bg-white/30 rounded-full w-11 h-11 flex items-center justify-center text-2xl transition-colors"
                            aria-label="Photo précédente"
                        >
                            ‹
                        </button>
                    )}

                    {/* Image */}
                    <div
                        className="relative w-full max-w-3xl mx-14 sm:mx-20 max-h-[80vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
                            {!lightboxImageLoaded && (
                                <div className="absolute inset-0 animate-pulse rounded-lg bg-gray-200" />
                            )}
                            <Image
                                src={photoUrls[lightboxIndex]}
                                alt={`Photo ${lightboxIndex + 1} de ${company.name}`}
                                fill
                                className={`object-contain rounded-lg transition-opacity duration-300 ${lightboxImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                sizes="(max-width: 768px) 100vw, 800px"
                                onLoad={() => setLightboxImageLoaded(true)}
                            />
                        </div>
                        <p className="text-center text-white/70 text-xs sm:text-sm mt-2 sm:mt-3">
                            {lightboxIndex + 1} / {photoUrls.length}
                        </p>
                    </div>

                    {/* Next */}
                    {photoUrls.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                            className="absolute right-4 text-white bg-white/20 hover:bg-white/30 rounded-full w-11 h-11 flex items-center justify-center text-2xl transition-colors"
                            aria-label="Photo suivante"
                        >
                            ›
                        </button>
                    )}
                </div>
            )}

            {/* Share Profile Section */}
            <section className="max-w-4xl mx-auto px-4 mt-8 sm:mt-10">
                <ShareProfile companyName={company.name} profileUrl={profileUrl} />
            </section>

            {/* Reviews Section */}
            <div className="max-w-4xl mx-auto px-4 mt-8 sm:mt-10">
                <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold tracking-tighter text-primary">Avis &amp; Notes</h2>
                <ReviewSystem companyId={company.id} />
            </div>

            {/* Founder message */}
            {company.founder_message && (
                <div className="max-w-4xl mx-auto px-4 mt-8 sm:mt-10">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
                        {company.founder_photo_url && (
                            <div className="flex shrink-0 justify-center sm:justify-start">
                                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-gray-100">
                                    <Image
                                        src={company.founder_photo_url}
                                        alt={`Photo de ${founderDisplayName}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col justify-center flex-1 text-center sm:text-left">
                            <h3 className="mb-2 text-lg sm:text-xl font-semibold tracking-tighter text-primary">
                                {founderDisplayName}
                            </h3>
                            <p className="whitespace-pre-wrap text-sm sm:text-base text-gray-700 leading-relaxed">
                                {company.founder_message}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating WhatsApp button */}
            {company.whatsapp && (
                <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold px-4 sm:px-5 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
                        aria-label="Contacter sur WhatsApp"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5 sm:w-5 sm:h-5 shrink-0"
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

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import ReviewSystem from '../../../components/ReviewSystem';
import ShareProfile from '../../../components/ShareProfile';
import { supabase } from '../../../../lib/supabase';

type Company = {
    id: string;
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
};

type CompanyProfileProps = {
    company: Company;
    photos: string[];
};

export default function CompanyProfile({ company, photos }: CompanyProfileProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const hasIncrementedViewsRef = useRef(false);

    useEffect(() => {
        if (hasIncrementedViewsRef.current) return;
        hasIncrementedViewsRef.current = true;

        void supabase.rpc('increment_views', { company_id: company.id });
    }, [company.id]);

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = useCallback(() => setLightboxIndex(null), []);

    const prevPhoto = useCallback(() => {
        setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
    }, [photos.length]);

    const nextPhoto = useCallback(() => {
        setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));
    }, [photos.length]);

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

    return (
        <div className="min-h-screen bg-gray-50 pb-28">
            {/* Hero */}
            <div className="border-b border-gray-100 bg-white">
                <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center gap-5">
                    <div className="relative">
                        {company.logo_url ? (
                            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-200 bg-white">
                                <Image
                                    src={company.logo_url}
                                    alt={`Logo de ${company.name}`}
                                    fill
                                    sizes="128px"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        ) : (
                            <div className="w-32 h-32 rounded-2xl border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-900 text-5xl font-bold">
                                {company.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        {company.is_verified && (
                            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full border border-primary bg-primary px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-white" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 1.667a1.5 1.5 0 0 1 1.294.742l.722 1.24 1.408.319a1.5 1.5 0 0 1 1.115 1.988l-.478 1.361.955 1.075a1.5 1.5 0 0 1-.087 2.087l-1.075.955.478 1.361a1.5 1.5 0 0 1-1.115 1.988l-1.408.32-.722 1.238a1.5 1.5 0 0 1-2.588 0l-.722-1.239-1.408-.319a1.5 1.5 0 0 1-1.115-1.988l.478-1.36-.955-.956a1.5 1.5 0 0 1 .087-2.087l1.075-.955-.478-1.361a1.5 1.5 0 0 1 1.115-1.988l1.408-.32.722-1.239A1.5 1.5 0 0 1 10 1.667Zm2.373 6.294a.75.75 0 1 0-1.11-1.005L9.14 9.298l-.404-.403a.75.75 0 1 0-1.06 1.06l.96.96a.75.75 0 0 0 1.085-.025l2.652-2.929Z" clipRule="evenodd" />
                                </svg>
                                Expertise Garantie
                            </span>
                        )}
                    </div>

                    <div className="text-center space-y-3">
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-primary">
                            {company.name}
                        </h1>

                        <div className="flex flex-wrap justify-center gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                {company.profile_type}
                            </span>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                {company.sector}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                📍 {company.city}
                            </span>
                        </div>

                        {company.description && (
                            <p className="mt-3 text-gray-600 max-w-2xl leading-relaxed text-base">
                                {company.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Storytelling */}
            {(company.company_story || company.description) && (
                <section className="max-w-4xl mx-auto px-4 mt-10">
                    <div className="rounded-md border border-gray-200 bg-white p-7 md:p-9">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">Storytelling</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tighter text-primary">Notre Histoire</h2>
                        <p className="mt-5 font-serif text-[1.06rem] leading-8 text-gray-700">
                            {company.company_story || company.description}
                        </p>
                    </div>
                </section>
            )}

            {/* Metrics banner */}
            <section className="max-w-4xl mx-auto px-4 mt-6">
                <div className="grid grid-cols-1 divide-y divide-gray-100 rounded-md border border-gray-200 bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
                    <div className="flex items-center gap-3 p-4">
                        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-gray-400" aria-hidden="true">
                            <path d="M10 5.5v4.75l3 1.75" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.25" />
                        </svg>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500">Expérience</p>
                            <p className="mt-1 text-xl font-medium tracking-tighter text-black tabular-nums">
                                {company.years_experience ?? 0} ans
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4">
                        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-gray-400" aria-hidden="true">
                            <path d="M4.75 15.25h10.5M6.5 13V8.75m3.5 4.25V6.5m3.5 6.5v-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500">Projets</p>
                            <p className="mt-1 text-xl font-medium tracking-tighter text-black tabular-nums">
                                {company.completed_projects ?? 0}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4">
                        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-gray-400" aria-hidden="true">
                            <path d="M6.75 8.75a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6.5 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3.75 15a3 3 0 0 1 6 0m2.5 0a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500">Équipe</p>
                            <p className="mt-1 text-xl font-medium tracking-tighter text-black tabular-nums">
                                {company.employee_count ?? 0}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery */}
            {photos.length > 0 && (
                <div className="max-w-4xl mx-auto px-4 mt-10">
                    <h2 className="mb-4 text-xl font-semibold tracking-tighter text-primary">Galerie</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {photos.map((url, index) => (
                            <button
                                key={`photo-${index}`}
                                type="button"
                                onClick={() => openLightbox(index)}
                                className="relative aspect-square overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 group"
                            >
                                <Image
                                    src={url}
                                    alt={`Photo ${index + 1} de ${company.name}`}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl" />
                            </button>
                        ))}
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
                    {photos.length > 1 && (
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
                            <Image
                                src={photos[lightboxIndex]}
                                alt={`Photo ${lightboxIndex + 1} de ${company.name}`}
                                fill
                                className="object-contain rounded-lg"
                                sizes="(max-width: 768px) 100vw, 800px"
                            />
                        </div>
                        <p className="text-center text-white/70 text-sm mt-3">
                            {lightboxIndex + 1} / {photos.length}
                        </p>
                    </div>

                    {/* Next */}
                    {photos.length > 1 && (
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

            {/* Reviews */}
            <section className="max-w-4xl mx-auto px-4 mt-10">
                <ShareProfile companyName={company.name} profileUrl={profileUrl} />
            </section>

            <div className="max-w-4xl mx-auto px-4 mt-10">
                <h2 className="mb-4 text-xl font-semibold tracking-tighter text-primary">Avis &amp; Notes</h2>
                <ReviewSystem companyId={company.id} />
            </div>

            {/* Founder message */}
            {company.founder_message && (
                <section className="max-w-4xl mx-auto px-4 mt-10">
                    <div className="rounded-md border border-gray-200 bg-white p-7 md:p-8">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500">Le mot du fondateur</p>
                        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                                {company.founder_photo_url ? (
                                    <Image
                                        src={company.founder_photo_url}
                                        alt={`Photo de ${founderDisplayName}`}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-600">
                                        {founderDisplayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-black">{founderDisplayName}</h3>
                                <p className="mt-2 leading-relaxed text-gray-700">{company.founder_message}</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Floating WhatsApp button */}
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
                aria-label="Contacter sur WhatsApp"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 shrink-0"
                    aria-hidden="true"
                >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Contact WhatsApp</span>
            </a>
        </div>
    );
}

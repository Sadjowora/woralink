'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import DashboardTabs from '../../components/dashboard/DashboardTabs';
import { supabase, saveCompanyGalleryPhotos, type GalleryPhotoInput } from '../../../lib/supabase';

type Company = {
    id: string;
    name: string;
    slug: string;
};

type GallerySlot = {
    url: string;
    caption: string;
    uploadedAt: string | null;
};

export default function DashboardGalleryPage() {
    const [checking, setChecking] = useState(true);
    const [company, setCompany] = useState<Company | null>(null);
    const [galleryUrls, setGalleryUrls] = useState<Array<string | null>>(Array(5).fill(null));
    const [galleryCaptions, setGalleryCaptions] = useState<string[]>(Array(5).fill(''));
    const [galleryUploadedAt, setGalleryUploadedAt] = useState<Array<string | null>>(Array(5).fill(null));
    const [galleryUploadingIndex, setGalleryUploadingIndex] = useState<number | null>(null);
    const [gallerySaving, setGallerySaving] = useState(false);
    const [galleryError, setGalleryError] = useState('');
    const [gallerySuccess, setGallerySuccess] = useState(false);
    const galleryInputRefs = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        const loadCompany = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    setChecking(false);
                    return;
                }

                const { data: companyData, error } = await supabase
                    .from('companies')
                    .select('id, name, slug')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) throw error;

                setCompany((companyData as Company | null) ?? null);
            } catch (err) {
                setGalleryError(err instanceof Error ? err.message : 'Impossible de charger votre profil.');
            } finally {
                setChecking(false);
            }
        };

        void loadCompany();
    }, []);

    useEffect(() => {
        const fetchGalleryPhotos = async () => {
            if (!company?.id) {
                setGalleryUrls(Array(5).fill(null));
                setGalleryCaptions(Array(5).fill(''));
                setGalleryUploadedAt(Array(5).fill(null));
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

                    const captionValue = row.caption;
                    const uploadedAtValue = row.uploaded_at ?? row.created_at;

                    return {
                        url,
                        caption: typeof captionValue === 'string' ? captionValue : '',
                        uploadedAt: typeof uploadedAtValue === 'string' ? uploadedAtValue : null,
                    } satisfies GallerySlot;
                })
                .filter((item): item is GallerySlot => Boolean(item?.url))
                .slice(0, 5);

            const urlSlots: Array<string | null> = Array(5).fill(null);
            const captionSlots: string[] = Array(5).fill('');
            const uploadedAtSlots: Array<string | null> = Array(5).fill(null);

            slots.forEach((slot, index) => {
                urlSlots[index] = slot.url;
                captionSlots[index] = slot.caption;
                uploadedAtSlots[index] = slot.uploadedAt;
            });

            setGalleryUrls(urlSlots);
            setGalleryCaptions(captionSlots);
            setGalleryUploadedAt(uploadedAtSlots);
        };

        void fetchGalleryPhotos();
    }, [company?.id]);

    const handleGalleryUpload = async (index: number, file: File) => {
        if (!file.type.startsWith('image/')) {
            setGalleryError('Veuillez sélectionner une image valide.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setGalleryError('La taille du fichier ne doit pas dépasser 5MB.');
            return;
        }

        setGalleryUploadingIndex(index);
        setGalleryError('');
        setGallerySuccess(false);

        try {
            const fileExt = file.name.split('.').pop() ?? 'png';
            const fileName = `gallery-slot-${index + 1}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('company-media')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: publicUrlData } = supabase.storage
                .from('company-media')
                .getPublicUrl(fileName);

            if (!publicUrlData?.publicUrl) {
                throw new Error('Impossible de récupérer l\'URL publique.');
            }

            setGalleryUrls((prev) => {
                const next = [...prev];
                next[index] = publicUrlData.publicUrl;
                return next;
            });
            setGalleryUploadedAt((prev) => {
                const next = [...prev];
                next[index] = new Date().toISOString();
                return next;
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur lors de l\'upload de la photo.';
            setGalleryError(message);
        } finally {
            setGalleryUploadingIndex(null);
            const input = galleryInputRefs.current[index];
            if (input) {
                input.value = '';
            }
        }
    };

    const handleRemoveGalleryPhoto = (index: number) => {
        setGallerySuccess(false);
        setGalleryUrls((prev) => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
        setGalleryCaptions((prev) => {
            const next = [...prev];
            next[index] = '';
            return next;
        });
        setGalleryUploadedAt((prev) => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    };

    const handleGalleryCaptionChange = (index: number, value: string) => {
        setGallerySuccess(false);
        setGalleryCaptions((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const handleGallerySubmit = async () => {
        if (!company?.id) {
            setGalleryError('Créez ou rechargez d\'abord votre profil avant de sauvegarder la galerie.');
            return;
        }

        setGallerySaving(true);
        setGalleryError('');
        setGallerySuccess(false);

        try {
            const galleryItems = galleryUrls.reduce<GalleryPhotoInput[]>((items, url, index) => {
                if (!url) {
                    return items;
                }

                items.push({
                    url,
                    caption: galleryCaptions[index] || null,
                    uploadedAt: galleryUploadedAt[index],
                });

                return items;
            }, []);

            await saveCompanyGalleryPhotos(company.id, galleryItems);
            setGallerySuccess(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde de la galerie.';
            setGalleryError(message);
        } finally {
            setGallerySaving(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-white">
                <DashboardTabs />
                <div className="mx-auto w-full px-0 py-2 sm:px-4 sm:py-8 lg:w-3/4">
                    <div className="rounded-none border-0 bg-white p-2 sm:rounded-md sm:border sm:border-gray-200 sm:p-8">
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600 sm:p-6">
                            Chargement de votre galerie...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <DashboardTabs />
            <div className="mx-auto w-full px-0 py-2 sm:px-4 sm:py-8 lg:w-3/4">
                <div className="w-full rounded-none border-0 bg-white p-2 transition-colors sm:rounded-md sm:border sm:border-primary/20 sm:p-8 sm:hover:border-primary">
                    <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4 border-b border-gray-100 pb-4 sm:pb-6 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-gray-500">Galerie</p>
                            <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-bold tracking-tighter text-primary">Gérer ma galerie</h2>
                            <p className="mt-2 text-xs sm:text-sm text-gray-600">
                                Gérez vos 5 visuels principaux et leurs légendes depuis cet espace dédié.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row flex-wrap">
                            <Link
                                href="/dashboard/profile"
                                className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-primary transition-colors hover:bg-primary/5 whitespace-nowrap"
                            >
                                Modifier mon profil
                            </Link>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-primary transition-colors hover:bg-primary/5 whitespace-nowrap"
                            >
                                Retour au dashboard
                            </Link>
                            {company && (
                                <Link
                                    href={`/pme/${company.slug}`}
                                    className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-primary transition-colors hover:bg-primary/5 whitespace-nowrap"
                                >
                                    Voir ma page publique
                                </Link>
                            )}
                        </div>
                    </div>

                    {!company ? (
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 sm:p-6 text-sm text-gray-600">
                            Créez d&apos;abord votre profil pour pouvoir publier des photos dans la galerie.
                        </div>
                    ) : (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void handleGallerySubmit();
                            }}
                            className="space-y-4 sm:space-y-5"
                        >
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                {Array.from({ length: 5 }).map((_, index) => {
                                    const photoUrl = galleryUrls[index];
                                    const isUploading = galleryUploadingIndex === index;
                                    const uploadedAt = galleryUploadedAt[index];

                                    return (
                                        <div key={`slot-${index}`} className="rounded-md border border-gray-200 bg-gray-50 p-2 sm:p-3">
                                            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-gray-500">Photo {index + 1}</p>

                                            <div className="mt-2 relative h-32 sm:h-36 overflow-hidden rounded-md border border-gray-200 bg-white">
                                                {photoUrl ? (
                                                    <Image
                                                        src={photoUrl}
                                                        alt={`Photo galerie ${index + 1}`}
                                                        fill
                                                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 280px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-xs sm:text-sm text-gray-500">
                                                        Aucune image
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-2 sm:mt-3 flex gap-1 sm:gap-2 flex-col sm:flex-row">
                                                <input
                                                    ref={(el) => {
                                                        galleryInputRefs.current[index] = el;
                                                    }}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(event) => {
                                                        const file = event.target.files?.[0];
                                                        if (!file) return;
                                                        void handleGalleryUpload(index, file);
                                                    }}
                                                    disabled={isUploading}
                                                    className="hidden"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => galleryInputRefs.current[index]?.click()}
                                                    disabled={isUploading}
                                                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 sm:px-3 py-2 text-[10px] sm:text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                                >
                                                    {photoUrl ? (isUploading ? 'Modification...' : 'Remplacer') : (isUploading ? 'Upload...' : 'Ajouter')}
                                                </button>
                                                {photoUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveGalleryPhoto(index)}
                                                        className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2.5 sm:px-3 py-2 text-[10px] sm:text-xs font-medium text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                            </div>

                                            <div className="mt-3">
                                                <label className="mb-1 block text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-gray-500">Légende (optionnel)</label>
                                                <input
                                                    type="text"
                                                    value={galleryCaptions[index]}
                                                    onChange={(event) => handleGalleryCaptionChange(index, event.target.value)}
                                                    placeholder="Ex: chantier livré à Conakry"
                                                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>

                                            <p className="mt-2 text-[10px] sm:text-xs text-gray-500">
                                                Date d&apos;upload:{' '}
                                                {uploadedAt
                                                    ? new Date(uploadedAt).toLocaleDateString('fr-FR', {
                                                          day: '2-digit',
                                                          month: 'short',
                                                          year: 'numeric',
                                                      })
                                                    : 'Non renseignée'}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-xs text-gray-500 tabular-nums">{galleryUrls.filter(Boolean).length}/5 photo(s) ajoutée(s)</p>

                            {galleryError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700">
                                    {galleryError}
                                </div>
                            )}

                            {gallerySuccess && (
                                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs sm:text-sm text-green-700">
                                    Galerie mise à jour avec succès.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={gallerySaving || galleryUploadingIndex !== null}
                                className="w-full rounded-md bg-black py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {gallerySaving ? 'Enregistrement de la galerie...' : 'Enregistrer la galerie'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

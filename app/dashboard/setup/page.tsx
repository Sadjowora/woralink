'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { supabase, saveCompanyGalleryPhotos } from '../../../lib/supabase';
import DashboardTabs from '../../components/dashboard/DashboardTabs';
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
    'Consulting & Services',
    'Autre'
];

const profileTypes = ['PME', 'Artisan', 'Freelance'];

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
    founder_photo_url?: string | null;
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
    const [founderPhotoUrl, setFounderPhotoUrl] = useState<string>('');
    const [galleryUrls, setGalleryUrls] = useState<Array<string | null>>(Array(5).fill(null));
    const [galleryUploadingIndex, setGalleryUploadingIndex] = useState<number | null>(null);
    const [galleryError, setGalleryError] = useState('');
    const galleryInputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const gallerySectionRef = useRef<HTMLDivElement | null>(null);
    const initialShortcutHandledRef = useRef(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
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
        }
    });

    const checkExistingCompany = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
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
                setFounderPhotoUrl((data as Company).founder_photo_url || '');
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

            const urls = (data || [])
                .map((row: Record<string, unknown>) => {
                    const value = row.photo_url ?? row.url;
                    return typeof value === 'string' ? value : null;
                })
                .filter((url): url is string => Boolean(url))
                .slice(0, 5);

            const slots: Array<string | null> = Array(5).fill(null);
            urls.forEach((url, index) => {
                slots[index] = url;
            });
            setGalleryUrls(slots);
        };

        fetchGalleryPhotos();
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
        setGalleryUrls((prev) => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    };

    const openEditor = useCallback((scrollToGallery = false) => {
        if (!company) return;

        setEditing(true);
        reset(mapCompanyToFormValues(company));
        setLogoUrl(company.logo_url || '');
        setFounderPhotoUrl(company.founder_photo_url || '');

        if (scrollToGallery) {
            requestAnimationFrame(() => {
                gallerySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }, [company, reset]);

    useEffect(() => {
        if (initialShortcutHandledRef.current || checking || !company) {
            return;
        }

        const focus = searchParams.get('focus');
        const mode = searchParams.get('mode');

        if (focus === 'gallery' || mode === 'edit') {
            initialShortcutHandledRef.current = true;
            openEditor(focus === 'gallery');
        }
    }, [checking, company, openEditor, searchParams]);

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const completedGalleryUrls = galleryUrls.filter((url): url is string => Boolean(url));
            const yearsExperience = data.yearsExperience ? Number(data.yearsExperience) : null;
            const completedProjects = data.completedProjects ? Number(data.completedProjects) : null;
            const employeeCount = data.employeeCount ? Number(data.employeeCount) : null;

            if (data.yearsExperience && Number.isNaN(yearsExperience)) {
                throw new Error('Le champ années d\'expérience doit être un nombre valide.');
            }

            if (data.completedProjects && Number.isNaN(completedProjects)) {
                throw new Error('Le champ projets terminés doit être un nombre valide.');
            }

            if (data.employeeCount && Number.isNaN(employeeCount)) {
                throw new Error('Le champ nombre d\'employés doit être un nombre valide.');
            }

            const { data: userData, error: authError } = await supabase.auth.getUser();
            if (authError) throw new Error(authError.message);

            const user = userData?.user;
            if (!user) throw new Error('Utilisateur non connecté');

            if (completedGalleryUrls.length !== 5) {
                throw new Error('Veuillez uploader exactement 5 photos pour la galerie.');
            }

            const slug = generateSlug(data.entityName);
            let companyIdToSavePhotosFor = '';

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
                        founder_photo_url: founderPhotoUrl || null,
                    })
                    .eq('id', company.id);

                if (error) throw new Error(error.message);
                companyIdToSavePhotosFor = company.id;
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
                    founder_photo_url: founderPhotoUrl || null,
                });
            } else {
                // Create new company
                const { data: newCompany, error } = await supabase
                    .from('companies')
                    .insert([{
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
                        founder_photo_url: founderPhotoUrl || null,
                    }])
                    .select()
                    .single();

                if (error) throw new Error(error.message);
                companyIdToSavePhotosFor = newCompany.id;
                setCompany(newCompany as Company);
            }

            await saveCompanyGalleryPhotos(companyIdToSavePhotosFor, completedGalleryUrls);

            setSuccess(true);
            setEditing(false);
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : (err && typeof err === 'object' && 'message' in err ? String((err as { message?: unknown }).message) : 'Erreur lors de la sauvegarde');
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-white">
                <DashboardTabs />
                <div className="mx-auto w-full px-4 py-8 lg:w-3/4">
                    <div className="rounded-md border border-gray-200 bg-white p-8">
                        <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                            Verification du profil...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <DashboardTabs />
            <div className="mx-auto w-full px-4 py-8 lg:w-3/4">
                <div className="w-full rounded-md border border-gray-200 bg-white p-8">
                {company && !editing ? (
                    <>
                        <div className="mb-8 flex flex-col gap-4 border-b border-gray-100 pb-6 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Votre entreprise</p>
                                <h2 className="mt-2 text-2xl font-bold tracking-tighter text-primary">Tableau de bord Woralink</h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Retrouvez les informations essentielles de votre fiche et accedez aux actions rapides.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => openEditor(false)}
                                    className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                                >
                                    Modifier mon profil
                                </button>
                                <Link
                                    href={`/pme/${company.slug}`}
                                    className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                                >
                                    Voir ma page publique
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => openEditor(true)}
                                    className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                                >
                                    Ajouter des photos
                                </button>
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                                >
                                    Retour au dashboard
                                </Link>
                                <Link
                                    href="/dashboard/media"
                                    className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                                >
                                    Ouvrir les médias
                                </Link>
                            </div>
                        </div>

                        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
                        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">Profil mis à jour avec succès !</div>}
                        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                            <section className="rounded-md border border-gray-200 bg-white p-6">
                                <div className="mb-5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Resume</p>
                                        <h3 className="mt-2 text-xl font-semibold text-black">Votre fiche entreprise</h3>
                                        <p className="mt-1 text-sm text-gray-600">Les informations visibles par vos visiteurs sur Woralink.</p>
                                    </div>
                                    <span className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">En ligne</span>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-md border border-gray-200 bg-white p-4">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500">Statut</p>
                                        <p className="mt-2 text-3xl font-medium tracking-tighter text-black">En ligne</p>
                                    </div>
                                    <div className="rounded-md border border-gray-200 bg-white p-4">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500">Ville</p>
                                        <p className="mt-2 text-3xl font-medium tracking-tighter text-black">{company.city}</p>
                                    </div>
                                    <div className="rounded-md border border-gray-200 bg-white p-4">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500">Secteur</p>
                                        <p className="mt-2 text-3xl font-medium tracking-tighter text-black">{company.sector}</p>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-md border border-gray-200 bg-white p-6">
                                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Details</p>
                                <h3 className="mt-2 text-xl font-semibold text-black">Fiche detaillee</h3>
                                <div className="mt-5 overflow-hidden rounded-md border border-gray-200">
                                    <ul className="tabular-nums">
                                        <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">Nom de l&apos;entité</span>
                                            <span className="text-sm font-medium text-gray-900 text-right">{company.name}</span>
                                        </li>
                                        <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">Type de profil</span>
                                            <span className="text-sm font-medium text-gray-900 text-right">{company.profile_type}</span>
                                        </li>
                                        <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">Secteur d&apos;activité</span>
                                            <span className="text-sm font-medium text-gray-900 text-right">{company.sector}</span>
                                        </li>
                                        <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">Ville</span>
                                            <span className="text-sm font-medium text-gray-900 text-right">{company.city}</span>
                                        </li>
                                        <li className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">Numéro WhatsApp</span>
                                            <span className="text-sm font-medium text-gray-900 text-right tabular-nums">{company.whatsapp}</span>
                                        </li>
                                        <li className="flex items-center justify-between gap-4 border-t border-gray-100 px-4 py-3 hover:bg-gray-50">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">Années d&apos;expérience</span>
                                            <span className="text-sm font-medium text-gray-900 text-right tabular-nums">{company.years_experience ?? 'À renseigner'}</span>
                                        </li>
                                        <li className="flex items-center justify-between gap-4 border-t border-gray-100 px-4 py-3 hover:bg-gray-50">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">Projets terminés</span>
                                            <span className="text-sm font-medium text-gray-900 text-right tabular-nums">{company.completed_projects ?? 'À renseigner'}</span>
                                        </li>
                                        <li className="flex items-center justify-between gap-4 border-t border-gray-100 px-4 py-3 hover:bg-gray-50">
                                            <span className="text-xs uppercase tracking-widest text-gray-500">Nombre d&apos;employés</span>
                                            <span className="text-sm font-medium text-gray-900 text-right tabular-nums">{company.employee_count ?? 'À renseigner'}</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-4 space-y-3 rounded-md border border-gray-200 p-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-gray-500">Histoire de l&apos;entreprise</p>
                                        <p className="mt-1 text-sm text-gray-700">{company.company_story || 'À renseigner'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-gray-500">Mot du fondateur</p>
                                        <p className="mt-1 text-sm text-gray-700">{company.founder_message || 'À renseigner'}</p>
                                    </div>
                                </div>
                            </section>

                            {company.logo_url && (
                                <div className="rounded-md border border-gray-200 bg-white p-6">
                                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Logo</label>
                                    <Image
                                        src={company.logo_url}
                                        alt="Logo de l'entreprise"
                                        width={80}
                                        height={80}
                                        className="object-cover rounded-lg border"
                                    />
                                </div>
                            )}

                            {company.founder_photo_url && (
                                <div className="rounded-md border border-gray-200 bg-white p-6">
                                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Photo du fondateur</label>
                                    <Image
                                        src={company.founder_photo_url}
                                        alt="Photo du fondateur"
                                        width={80}
                                        height={80}
                                        className="object-cover rounded-lg border"
                                    />
                                </div>
                            )}

                            <div className="rounded-md border border-gray-200 bg-white p-6 lg:col-span-2">
                                <label className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-gray-500 tabular-nums">Galerie ({galleryUrls.filter(Boolean).length}/5)</label>
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
                                                    className="object-cover rounded-lg border"
                                                />
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">Aucune photo de galerie.</p>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mb-6 text-center">
                            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Dashboard Woralink</p>
                            <h1 className="mt-2 text-2xl font-bold tracking-tighter text-primary">
                            {editing ? 'Modifier votre profil' : 'Créer un profil professionnel'}
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                {editing
                                    ? 'Mettez à jour votre fiche et vos médias pour garder une page publique complète.'
                                    : 'Configurez votre fiche entreprise pour apparaître sur Woralink et commencer à recevoir des demandes.'}
                            </p>
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                                >
                                    Retour au dashboard
                                </Link>
                                <Link
                                    href="/dashboard/media"
                                    className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                                >
                                    Gérer mes médias
                                </Link>
                                {company && (
                                    <Link
                                        href={`/pme/${company.slug}`}
                                        className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                                    >
                                        Voir ma page publique
                                    </Link>
                                )}
                            </div>
                        </div>

                        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
                        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                            {editing ? 'Profil mis à jour avec succès !' : 'Profil créé avec succès !'}
                        </div>}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <section className="space-y-5 rounded-md border border-gray-200 bg-white p-6">
                        <div>
                            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Nom de l&apos;entité</label>
                            <input
                                type="text"
                                {...register('entityName', { required: 'Ce champ est requis' })}
                                className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white"
                            />
                            {errors.entityName && <p className="mt-1 text-sm text-red-600">{String(errors.entityName.message)}</p>}
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Type de profil</label>
                                <select
                                    {...register('profileType', { required: 'Ce champ est requis' })}
                                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white"
                                >
                                    <option value="">Sélectionnez un type</option>
                                    {profileTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                {errors.profileType && <p className="mt-1 text-sm text-red-600">{String(errors.profileType.message)}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Secteur d&apos;activité</label>
                                <select
                                    {...register('sector', { required: 'Ce champ est requis' })}
                                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white"
                                >
                                    <option value="">Sélectionnez un secteur</option>
                                    {sectors.map(sector => (
                                        <option key={sector} value={sector}>{sector}</option>
                                    ))}
                                </select>
                                {errors.sector && <p className="mt-1 text-sm text-red-600">{String(errors.sector.message)}</p>}
                            </div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Ville</label>
                                <input
                                    type="text"
                                    {...register('city', { required: 'Ce champ est requis' })}
                                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white"
                                />
                                {errors.city && <p className="mt-1 text-sm text-red-600">{String(errors.city.message)}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Numéro WhatsApp</label>
                                <input
                                    type="tel"
                                    {...register('whatsapp', {
                                        required: 'Ce champ est requis',
                                        pattern: {
                                            value: /^\+\d{1,4}\d{6,14}$/,
                                            message: 'Format invalide. Utilisez le format international : +33123456789'
                                        }
                                    })}
                                    placeholder="+33123456789"
                                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white"
                                />
                                {errors.whatsapp && <p className="mt-1 text-sm text-red-600">{String(errors.whatsapp.message)}</p>}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-5 rounded-md border border-gray-200 bg-white p-6">
                        <div>
                            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Histoire de l&apos;entreprise</label>
                            <textarea
                                rows={6}
                                {...register('companyStory')}
                                placeholder="Racontez l'histoire de votre entreprise, votre mission et vos points forts."
                                className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white"
                            />
                        </div>

                        <div>
                            <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-gray-500">Chiffres clés</p>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Années d&apos;expérience</label>
                                    <input
                                        type="number"
                                        min={0}
                                        inputMode="numeric"
                                        {...register('yearsExperience')}
                                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white tabular-nums"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Projets terminés</label>
                                    <input
                                        type="number"
                                        min={0}
                                        inputMode="numeric"
                                        {...register('completedProjects')}
                                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white tabular-nums"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Nombre d&apos;employés</label>
                                    <input
                                        type="number"
                                        min={1}
                                        inputMode="numeric"
                                        {...register('employeeCount')}
                                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white tabular-nums"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-5 rounded-md border border-gray-200 bg-white p-6">
                        <div>
                            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Mot du fondateur</label>
                            <textarea
                                rows={5}
                                {...register('founderMessage')}
                                placeholder="Partagez un message personnel du fondateur pour créer un lien de confiance."
                                className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Photo du fondateur</label>
                            <small className="mb-2 block text-xs text-gray-500">Formats acceptés : PNG, JPG, GIF. Taille max : 5MB.</small>
                            <ImageUpload
                                key={founderPhotoUrl || 'empty-founder-photo'}
                                onUploadComplete={(url) => setFounderPhotoUrl(url)}
                                className="max-w-md"
                            />
                            {founderPhotoUrl && (
                                <p className="mt-2 text-sm text-green-700">Photo du fondateur sélectionnée et prête à être enregistrée.</p>
                            )}
                        </div>
                    </section>

                    <section className="space-y-5 rounded-md border border-gray-200 bg-white p-6">
                    <div>
                        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Logo de l&apos;entreprise (optionnel)</label>
                        <small className="mb-2 block text-xs text-gray-500">Formats acceptés : PNG, JPG, GIF. Taille max : 5MB.</small>
                        <ImageUpload
                            key={logoUrl || 'empty-logo'}
                            onUploadComplete={(url) => setLogoUrl(url)}
                            className="max-w-md"
                        />
                        {logoUrl && (
                            <p className="mt-2 text-sm text-green-700">Logo sélectionné et prêt à être uploadé.</p>
                        )}
                    </div>

                    <div ref={gallerySectionRef}>
                        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">Galerie de l&apos;entreprise</label>
                        <small className="mb-2 block text-xs text-gray-500">Ajoutez exactement 5 photos pour finaliser votre profil.</small>
                        <div className="mx-auto grid max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
                            {Array.from({ length: 5 }).map((_, index) => {
                                const photoUrl = galleryUrls[index];
                                const isUploading = galleryUploadingIndex === index;

                                if (photoUrl) {
                                    return (
                                        <div key={`slot-${index}`} className="relative h-28">
                                            <Image
                                                src={photoUrl}
                                                alt={`Photo galerie ${index + 1}`}
                                                fill
                                                sizes="(max-width: 640px) 50vw, 180px"
                                                className="object-cover rounded-lg border"
                                            />
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
                                                className="absolute top-2 right-10 inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:text-black"
                                                title="Modifier"
                                            >
                                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                                                    <path d="M15.232 5.232a2.5 2.5 0 0 0-3.536 0l-6.75 6.75a1.5 1.5 0 0 0-.39.72l-.57 2.394a.75.75 0 0 0 .909.91l2.394-.57a1.5 1.5 0 0 0 .72-.39l6.75-6.75a2.5 2.5 0 0 0 0-3.536l-.527-.528Z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveGalleryPhoto(index)}
                                                className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:text-black"
                                                title="Supprimer"
                                            >
                                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M8.5 3.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V4h3a.75.75 0 0 1 0 1.5h-.538l-.586 9.086A2 2 0 0 1 11.382 16.5H8.618a2 2 0 0 1-1.994-1.914L6.038 5.5H5.5a.75.75 0 0 1 0-1.5h3v-.5Zm-1 2 .586 9.086a.5.5 0 0 0 .499.414h2.83a.5.5 0 0 0 .499-.414L12.5 5.5h-5Z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={`slot-${index}`} className="h-28">
                                        <label className="flex h-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-600 hover:bg-white hover:border-black">
                                            {isUploading ? 'Upload...' : 'Uploader'}
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
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-2 text-xs text-gray-500 tabular-nums">{galleryUrls.filter(Boolean).length}/5 photo(s) ajoutée(s)</p>
                        {galleryError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mt-2">
                                {galleryError}
                            </div>
                        )}
                    </div>
                    </section>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-md bg-black py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? (editing ? 'Mise à jour...' : 'Création...') : (editing ? 'Mettre à jour' : 'Créer le Profil')}
                        </button>
                    </form>
                </>
                )}
                </div>
            </div>
        </div>
    );
}

export default function SetupPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white">
                    <DashboardTabs />
                    <div className="mx-auto w-full px-4 py-8 lg:w-3/4">
                        <div className="rounded-md border border-gray-200 bg-white p-8">
                            <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                                Chargement des parametres...
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <SetupPageContent />
        </Suspense>
    );
}
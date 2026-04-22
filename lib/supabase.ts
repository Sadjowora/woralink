import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase =
    typeof window === 'undefined'
        ? createClient(supabaseUrl, supabaseAnonKey)
        : createBrowserClient(supabaseUrl, supabaseAnonKey);

export type GalleryPhotoInput = {
    url: string;
    legend?: string | null;
    uploadedAt?: string | null;
};

function isColumnCompatibilityError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybeError = error as { code?: string; message?: string };
    const message = (maybeError.message || '').toLowerCase();

    return maybeError.code === '42703' || message.includes('column') || message.includes('schema cache');
}

export async function saveCompanyGalleryPhotos(companyId: string, photos: Array<string | GalleryPhotoInput>) {
    const normalizedPhotos = photos
        .map((item) => {
            if (typeof item === 'string') {
                return { url: item.trim(), legend: null, uploadedAt: null };
            }

            return {
                url: item.url?.trim() || '',
                legend: item.legend?.trim() || null,
                uploadedAt: item.uploadedAt || null,
            };
        })
        .filter((item) => Boolean(item.url));

    if (normalizedPhotos.length > 5) {
        throw new Error('La galerie ne peut pas contenir plus de 5 photos.');
    }

    const { error: deleteError } = await supabase
        .from('company_photos')
        .delete()
        .eq('company_id', companyId);

    if (deleteError) {
        throw deleteError;
    }

    if (normalizedPhotos.length === 0) {
        return true;
    }

    const insertStrategies = [
        (photo: { url: string; legend: string | null; uploadedAt: string | null }) => ({
            company_id: companyId,
            url: photo.url,
            legend: photo.legend,
            uploaded_at: photo.uploadedAt,
        }),
        (photo: { url: string; legend: string | null; uploadedAt: string | null }) => ({
            company_id: companyId,
            url: photo.url,
            caption: photo.legend,
            uploaded_at: photo.uploadedAt,
        }),
        (photo: { url: string; legend: string | null; uploadedAt: string | null }) => ({
            company_id: companyId,
            photo_url: photo.url,
            legend: photo.legend,
            uploaded_at: photo.uploadedAt,
        }),
        (photo: { url: string; legend: string | null; uploadedAt: string | null }) => ({
            company_id: companyId,
            photo_url: photo.url,
            caption: photo.legend,
            uploaded_at: photo.uploadedAt,
        }),
        (photo: { url: string; legend: string | null; uploadedAt: string | null }) => ({
            company_id: companyId,
            url: photo.url,
            legend: photo.legend,
        }),
        (photo: { url: string; legend: string | null; uploadedAt: string | null }) => ({
            company_id: companyId,
            url: photo.url,
            caption: photo.legend,
        }),
        (photo: { url: string; legend: string | null; uploadedAt: string | null }) => ({
            company_id: companyId,
            photo_url: photo.url,
            legend: photo.legend,
        }),
        (photo: { url: string; legend: string | null; uploadedAt: string | null }) => ({
            company_id: companyId,
            photo_url: photo.url,
            caption: photo.legend,
        }),
        (photo: { url: string; legend: string | null; uploadedAt: string | null }) => ({
            company_id: companyId,
            url: photo.url,
        }),
        (photo: { url: string; legend: string | null; uploadedAt: string | null }) => ({
            company_id: companyId,
            photo_url: photo.url,
        }),
    ];

    let lastError: unknown = null;

    for (const buildRow of insertStrategies) {
        const rows = normalizedPhotos.map(buildRow);
        const { error } = await supabase.from('company_photos').insert(rows);

        if (!error) {
            return true;
        }

        if (!isColumnCompatibilityError(error)) {
            throw error;
        }

        lastError = error;
    }

    if (lastError) {
        throw lastError;
    }

    return true;
}
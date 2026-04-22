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
                return { url: item.trim() };
            }

            return {
                url: item.url?.trim() || '',
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

    const buildRow = (photo: { url: string }): { company_id: string; url: string } => ({
        company_id: companyId,
        url: photo.url,
    });

    const rows = normalizedPhotos.map(buildRow);
    const { error } = await supabase.from('company_photos').insert(rows);

    if (error) {
        throw error;
    }

    return true;
}
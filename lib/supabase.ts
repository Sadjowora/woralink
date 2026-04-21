import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase =
    typeof window === 'undefined'
        ? createClient(supabaseUrl, supabaseAnonKey)
        : createBrowserClient(supabaseUrl, supabaseAnonKey);

export async function saveCompanyGalleryPhotos(companyId: string, photoUrls: string[]) {
    if (photoUrls.length !== 5) {
        throw new Error('La galerie doit contenir exactement 5 URLs.');
    }

    const galleryRows = photoUrls.map((url) => ({
        company_id: companyId,
        url,
    }));

    const { error: deleteError } = await supabase
        .from('company_photos')
        .delete()
        .eq('company_id', companyId);

    if (deleteError) {
        throw deleteError;
    }

    const { error } = await supabase
        .from('company_photos')
        .insert(galleryRows);

    if (error) {
        throw error;
    }

    return true;
}
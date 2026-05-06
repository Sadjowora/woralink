import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// URL du site (doit être définie en .env.local ET .env.production)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!siteUrl) {
    console.warn(
        '[Auth] NEXT_PUBLIC_SITE_URL non défini. Vérifiez .env.local ou .env.production'
    );
}

/**
 * Construit une URL de redirection OAuth absolue et sécurisée.
 *
 * - Accepte un chemin relatif (ex: '/dashboard') et le normalise
 * - Détecte automatiquement si on est en localhost → HTTP permis
 * - Force HTTPS en production
 * - Jamais de slash final
 *
 * @param path Chemin relatif, ex: '/dashboard' ou 'dashboard'
 * @returns URL complète absolue, ex: 'https://woralink.com/dashboard'
 */
export function buildAuthRedirectTo(path = '/dashboard'): string {
    const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const baseUrl = runtimeOrigin || siteUrl || 'https://woralink.com';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    let url: URL;

    try {
        // Si baseUrl est déjà une URL complète
        url = new URL(baseUrl);
    } catch {
        // Sinon, ajouter https:// par défaut
        url = new URL(`https://${baseUrl}`);
    }

    // Force HTTPS sauf en local
    const isLocalHost =
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
        url.hostname.endsWith('.local');

    if (!isLocalHost && url.protocol === 'http:') {
        url.protocol = 'https:';
    }

    // Remplace le chemin, supprime query strings et hash
    url.pathname = normalizedPath;
    url.search = '';
    url.hash = '';

    const result = url.toString();

    // Validation : pas de slash final
    return result.endsWith('/') ? result.slice(0, -1) : result;
}

export const supabase =
    typeof window === 'undefined'
        ? createClient(supabaseUrl, supabaseAnonKey)
        : createBrowserClient(supabaseUrl, supabaseAnonKey);

export type GalleryPhotoInput = {
    url: string;
    caption?: string | null;
    uploadedAt?: string | null;
};

export async function saveCompanyGalleryPhotos(companyId: string, photos: Array<string | GalleryPhotoInput>) {
    const normalizedPhotos = photos
        .map((item) => {
            if (typeof item === 'string') {
                return { url: item.trim(), caption: null as string | null };
            }

            return {
                url: item.url?.trim() || '',
                caption: item.caption ?? null,
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

    const buildRow = (photo: { url: string; caption?: string | null }): { company_id: string; url: string; caption: string | null } => ({
        company_id: companyId,
        url: photo.url,
        caption: photo.caption ?? null,
    });

    const rows = normalizedPhotos.map(buildRow);
    const { error } = await supabase.from('company_photos').insert(rows);

    if (error) {
        throw error;
    }

    return true;
}
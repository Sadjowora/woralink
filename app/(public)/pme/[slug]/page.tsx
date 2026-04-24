import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase } from '../../../../lib/supabase';
import CompanyProfile from './CompanyProfile';
import Navbar from '../../../components/layout/Navbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type GalleryPost = {
    url: string;
    caption: string;
    uploadedAt: string | null;
};

type PageProps = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    const { data: company } = await supabase
        .from('companies')
        .select('name, city, logo_url')
        .eq('slug', slug)
        .single();

    if (!company) return { title: 'Profil introuvable' };

    const city = typeof company.city === 'string' && company.city.trim() ? company.city.trim() : 'Guinée';
    const title = `${company.name} sur Woralink`;
    const description = `Découvrez les services, avis et réalisations de ${company.name} à ${city}. Contactez-les directement sur Woralink.`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const profileUrl = `${siteUrl.replace(/\/$/, '')}/pme/${slug}`;
    const imageSource = typeof company.logo_url === 'string' && company.logo_url.trim()
        ? company.logo_url.trim()
        : '/woralink.png';
    const imageUrl = imageSource.startsWith('http')
        ? imageSource
        : `${siteUrl.replace(/\/$/, '')}${imageSource.startsWith('/') ? imageSource : `/${imageSource}`}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: profileUrl,
            type: 'website',
            images: [
                {
                    url: imageUrl,
                    alt: `Profil de ${company.name} sur Woralink`,
                },
            ],
        },
    };
}

export default async function PmeProfilePage({ params }: PageProps) {
    const { slug } = await params;

    const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !company) {
        notFound();
    }

    const { data: photosData } = await supabase
        .from('company_photos')
        .select('*')
        .eq('company_id', company.id);

    const photos = (photosData ?? [])
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
            } satisfies GalleryPost;
        })
        .filter((item): item is GalleryPost => Boolean(item));

    return (
        <>
            <Navbar />
            <CompanyProfile company={company} photos={photos} />
        </>
    );
}

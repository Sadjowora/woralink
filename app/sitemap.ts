import type { MetadataRoute } from 'next';
import { supabase } from '../lib/supabase';

const GUINEA_MAIN_CITIES = ['Conakry', 
    'Kindia', 
    'Labé', 
    'Kankan', 
    'Mamou', 
    'Nzérékoré',
    'Mali', 
    'Coyah',
    'Dubréka',
    'Forécariah',
    'Fria',
    'Gaoual',
    'Koundara',
    'Pita',
    'Boffa',
    'Boké',
    'Télimélé',
    'Tougué',
    'Yomou',
    'Dinguiraye',
    'Kissidougou',
    'Kérouané',
    'Siguiri',
    'Mandiana',
    'Beyla',
    'Kouroussa',
    'Dabola',
    'Lola',
    'Koubia',
    'Dalaba',
    'Banankoro',
    'Faranah',
    'Kamsar', 
    'Sangaredi',
];

function getBaseUrl() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) return siteUrl.replace(/\/$/, '');

    return 'https://woralink.com';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getBaseUrl();
    const now = new Date();

    const staticUrls: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/search`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/politique-confidentialite`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/conditions-utilisation`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/instructions-suppression-donnees`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.4,
        },
    ];

    const citySearchUrls: MetadataRoute.Sitemap = GUINEA_MAIN_CITIES.map((city) => ({
        url: `${baseUrl}/search?city=${encodeURIComponent(city)}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.8,
    }));

    const { data: companies, error } = await supabase
        .from('companies')
        .select('slug, updated_at')
        .not('slug', 'is', null);

    if (error || !companies) {
        return [...staticUrls, ...citySearchUrls];
    }

    const companyUrls: MetadataRoute.Sitemap = companies
        .filter((company) => typeof company.slug === 'string' && company.slug.trim().length > 0)
        .map((company) => ({
            url: `${baseUrl}/pme/${company.slug}`,
            lastModified:
                typeof company.updated_at === 'string' && company.updated_at.trim().length > 0
                    ? new Date(company.updated_at)
                    : now,
            changeFrequency: 'weekly',
            priority: 0.7,
        }));

    return [...staticUrls, ...citySearchUrls, ...companyUrls];
}

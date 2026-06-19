'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Company = {
  id: string;
  name: string;
  profile_type: string;
  sector: string;
  city: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
};

export default function ClientFeed() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      setError(null);
      try {
        // Récupérer la session utilisateur
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setError('Utilisateur non connecté');
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // Étape 1 : récupérer les IDs des votes du client
        const { data: voteData, error: voteError } = await supabase
          .from('company_votes')
          .select('company_id')
          .eq('user_id', userId);

        if (voteError) throw voteError;

        const companyIds = (voteData || [])
          .map((v: { company_id: string }) => v.company_id)
          .filter(Boolean);

        // Si aucune entreprise favorite, on arrête ici
        if (companyIds.length === 0) {
          setCompanies([]);
          setLoading(false);
          return;
        }

        // Étape 2 : récupérer les fiches complètes des entreprises
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds);

        if (companyError) throw companyError;

        // Normaliser le champ logo_url (null → undefined) pour éviter les warnings
        const comps = (companyData || []).map((c: Company) => ({
          ...c,
          logo_url: c.logo_url === null ? undefined : c.logo_url,
        })) as Company[];

        setCompanies(comps);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement du fil d'actualités");
      } finally {
        setLoading(false);
      }
    };

    void fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-600">{error}</p>;
  }

  if (companies.length === 0) {
    return (
      <p className="text-center text-gray-600">Vous n’avez pas encore d’entreprises favorites.</p>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {companies.map((company) => (
          <motion.article
            key={company.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative h-48 bg-gray-100 dark:bg-slate-800">
              {company.logo_url ? (
                <Image src={company.logo_url} alt={company.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-gray-400">
                  {company.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {company.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {company.sector} • {company.city}
              </p>
              {company.description && (
                <p className="mt-2 line-clamp-3 text-gray-700 dark:text-slate-300">
                  {company.description}
                </p>
              )}
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}

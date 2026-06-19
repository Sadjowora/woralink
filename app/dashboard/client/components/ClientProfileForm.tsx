'use client';

import { useEffect, useState, FormEvent } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Type représentant les champs du profil client.
 * Les champs sont optionnels car ils peuvent être null dans la base.
 */
type Profile = {
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  preferences?: string | null;
};

/**
 * Composant de formulaire permettant à l'utilisateur connecté
 * de mettre à jour ses informations de profil.
 *
 * Fonctionnalités principales :
 * - Chargement des données actuelles du profil via Supabase.
 * - Gestion du formulaire (états, validation minimale).
 * - Soumission sécurisée avec `.update()` sur la table `profiles`.
 * - Indicateurs d'état : chargement, succès (toast vert), erreur.
 * - Design moderne, responsive et cohérent avec la charte Tailwind du projet.
 */
export default function ClientProfileForm() {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Récupération du profil actuel du client
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchProfile = async () => {
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

        const uid = session.user.id;
        setUserId(uid);

        // Récupérer les champs du profil
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, phone, city, neighborhood, preferences')
          .eq('user_id', uid)
          .single();

        if (profileError) throw profileError;

        setProfile(data as Profile);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger le profil');
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  // -------------------------------------------------------------------------
  // Gestion du changement de champ
  // -------------------------------------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // -------------------------------------------------------------------------
  // Soumission du formulaire
  // -------------------------------------------------------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('Utilisateur non identifié');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          city: profile.city,
          neighborhood: profile.neighborhood,
          preferences: profile.preferences,
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setSuccess('Profil mis à jour avec succès');
      // Masquer le toast après 3 s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la mise à jour du profil');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Rendu
  // -------------------------------------------------------------------------
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

  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-md dark:bg-slate-900">
      {/* Toast de succès */}
      {success && (
        <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800">{success}</div>
      )}

      <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
        Modifier mon profil
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nom complet */}
        <div>
          <label
            htmlFor="full_name"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            Nom complet
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={profile.full_name ?? ''}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Téléphone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            Téléphone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={profile.phone ?? ''}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Ville */}
        <div>
          <label
            htmlFor="city"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            Ville
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={profile.city ?? ''}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Quartier */}
        <div>
          <label
            htmlFor="neighborhood"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            Quartier / Arrondissement
          </label>
          <input
            type="text"
            id="neighborhood"
            name="neighborhood"
            value={profile.neighborhood ?? ''}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Préférences (texte libre) */}
        <div>
          <label
            htmlFor="preferences"
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            Préférences (ex : langues, notifications, etc.)
          </label>
          <textarea
            id="preferences"
            name="preferences"
            rows={4}
            value={profile.preferences ?? ''}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Bouton de soumission */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Enregistrer les modifications'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

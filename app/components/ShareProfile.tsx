'use client';

import { useMemo } from 'react';
import { FaLinkedinIn } from 'react-icons/fa';
import { MessageCircle, Share2 } from 'lucide-react';

type ShareProfileProps = {
  companyName: string;
  profileUrl: string;
  message?: string;
};

export default function ShareProfile({ companyName, profileUrl, message }: ShareProfileProps) {
  const shareMessage = useMemo(
    () =>
      `Bonjour ! Découvrez le profil de ${companyName} sur Woralink, la plateforme des pros en Guinée : ${profileUrl}`,
    [companyName, profileUrl],
  );

  const whatsappHref = useMemo(
    () => `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    [shareMessage],
  );

  const facebookHref = useMemo(
    () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
    [profileUrl],
  );

  const linkedinHref = useMemo(
    () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
    [profileUrl],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
          Partager votre profil
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          {message || `Diffusez la fiche de ${companyName} en un clic.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </a>

        <a
          href={facebookHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Facebook
        </a>

        <a
          href={linkedinHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          <FaLinkedinIn className="h-4 w-4" aria-hidden="true" />
          LinkedIn
        </a>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useMemo, useState } from 'react';
import { Check, Copy, MessageCircle, Share2 } from 'lucide-react';

type ShareProfileProps = {
  companyName: string;
  profileUrl: string;
  message?: string;
};

export default function ShareProfile({ companyName, profileUrl, message }: ShareProfileProps) {
  const [copied, setCopied] = useState(false);

  const shareMessage = useMemo(
    () => `Bonjour ! Découvrez le profil de ${companyName} sur Woralink, la plateforme des pros en Guinée : ${profileUrl}`,
    [companyName, profileUrl]
  );

  const whatsappHref = useMemo(
    () => `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    [shareMessage]
  );

  const facebookHref = useMemo(
    () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
    [profileUrl]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [profileUrl]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-900">Partager ce profil</p>
        <p className="mt-1 text-xs text-gray-500">{message || `Diffusez la fiche de ${companyName} en un clic.`}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-white px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </a>

        <a
          href={facebookHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-white px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Facebook
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-white px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? 'Lien copié' : 'Copier le lien'}
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`mt-2 text-xs text-emerald-600 transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}
      >
        Lien copié avec succès.
      </p>
    </div>
  );
}

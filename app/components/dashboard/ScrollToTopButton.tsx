'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-4 right-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors duration-150 hover:border-green-700 hover:text-green-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-green-500 dark:hover:text-green-400"
      aria-label="Remonter en haut de la page"
      title="Remonter en haut"
    >
      <ChevronUp className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const BANNER_SHOW_AFTER_MS = 3 * 60 * 1000;
const BANNER_SLIDE_DELAY_MS = 2000;
const SESSION_START_KEY = 'woralink:guest-banner-session-start';

export default function GuestBanner() {
  const [isGuest, setIsGuest] = useState(false);
  const [closed, setClosed] = useState(false);
  const [shouldDisplay, setShouldDisplay] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      setIsGuest(!user);
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsGuest(!session?.user);
      if (session?.user) {
        setClosed(false);
        setShouldDisplay(false);
        setIsVisible(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isGuest || closed) return;

    const now = Date.now();
    const saved = window.sessionStorage.getItem(SESSION_START_KEY);
    const sessionStart = saved ? Number(saved) : now;

    if (!saved || Number.isNaN(sessionStart)) {
      window.sessionStorage.setItem(SESSION_START_KEY, String(now));
    }

    const elapsed = now - sessionStart;
    const remaining = Math.max(0, BANNER_SHOW_AFTER_MS - elapsed);

    const displayTimer = window.setTimeout(() => {
      setShouldDisplay(true);
    }, remaining);

    return () => {
      window.clearTimeout(displayTimer);
    };
  }, [isGuest, closed]);

  useEffect(() => {
    if (!shouldDisplay || closed || !isGuest) return;

    const animationTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, BANNER_SLIDE_DELAY_MS);

    return () => {
      window.clearTimeout(animationTimer);
    };
  }, [shouldDisplay, closed, isGuest]);

  if (!isGuest || closed || !shouldDisplay) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 bg-primary text-white shadow-2xl transform transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
        <p className="flex-1 text-xs font-medium leading-relaxed sm:text-sm">
          Vous êtes un professionnel ? Créez votre vitrine gratuite sur Woralink
        </p>

        <div className="flex items-center gap-2">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-black px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/90 sm:px-4 sm:text-sm"
          >
            S&apos;inscrire
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-white/60 bg-transparent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:px-4 sm:text-sm"
          >
            Se connecter
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setClosed(true)}
          aria-label="Fermer le bandeau"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/30 text-white transition-colors hover:bg-white/10"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
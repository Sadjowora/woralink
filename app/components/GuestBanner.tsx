'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const BANNER_SHOW_AFTER_MS = 3 * 60 * 1000;
const BANNER_SLIDE_DELAY_MS = 2000;
const SESSION_START_KEY = 'woralink:guest-banner-session-start';
const PWA_INSTALL_DISMISSED_KEY = 'woralink:pwa-install-banner-dismissed';
const BANNER_SESSION_MARKER_KEY = 'woralink:banner-session-marker';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function detectMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const mobileByUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent,
  );
  const mobileByViewport =
    window.matchMedia('(max-width: 1024px)').matches &&
    window.matchMedia('(pointer: coarse)').matches;

  return mobileByUA || mobileByViewport;
}

function detectiOS(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = window.navigator.userAgent;
  const isAppleMobileUA = /iPhone|iPad|iPod/.test(ua);
  const isIPadOSDesktopMode =
    window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);

  return (isAppleMobileUA || isIPadOSDesktopMode) && isSafari;
}

function detectInstalledPwa(): boolean {
  if (typeof window === 'undefined') return false;

  const standaloneByMedia = window.matchMedia('(display-mode: standalone)').matches;
  const standaloneByNavigator =
    'standalone' in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return standaloneByMedia || standaloneByNavigator;
}

function isInstallBannerDismissedForCurrentSession(): boolean {
  if (typeof window === 'undefined') return false;

  const marker = getOrCreateSessionMarker();
  return window.localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === marker;
}

function getOrCreateSessionMarker(): string {
  if (typeof window === 'undefined') return '';

  let marker = window.sessionStorage.getItem(BANNER_SESSION_MARKER_KEY);
  if (!marker) {
    marker = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(BANNER_SESSION_MARKER_KEY, marker);
  }

  return marker;
}

export default function GuestBanner() {
  const pathname = usePathname();
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const [isAuthKnown, setIsAuthKnown] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [closed, setClosed] = useState(false);
  const [shouldDisplay, setShouldDisplay] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(detectInstalledPwa);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState<boolean>(
    isInstallBannerDismissedForCurrentSession,
  );
  const [sessionMarker] = useState<string>(getOrCreateSessionMarker);
  const [isMobileDevice] = useState<boolean>(detectMobileDevice);
  const [isIOSDevice] = useState<boolean>(detectiOS);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setIsGuest(!session?.user);
      setIsAuthKnown(true);
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsGuest(!session?.user);
      setIsAuthKnown(true);
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
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [sessionMarker]);

  useEffect(() => {
    if (isOnboardingRoute || !isMobileDevice || !isGuest || closed) return;

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
  }, [isOnboardingRoute, isMobileDevice, isGuest, closed]);

  useEffect(() => {
    if (isOnboardingRoute || !isMobileDevice || !shouldDisplay || closed || !isGuest) return;

    const animationTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, BANNER_SLIDE_DELAY_MS);

    return () => {
      window.clearTimeout(animationTimer);
    };
  }, [isOnboardingRoute, isMobileDevice, shouldDisplay, closed, isGuest]);

  const handleInstallNow = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const handleCloseInstallBanner = () => {
    if (!sessionMarker) return;
    window.localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, sessionMarker);
    setInstallDismissed(true);
  };

  const isAuthenticated = isAuthKnown && !isGuest;
  const canShowInstallBanner = isAuthenticated && !isInstalled && !installDismissed;

  if (isOnboardingRoute || !isMobileDevice || !isAuthKnown) {
    return null;
  }

  if (isInstalled) {
    return null;
  }

  if (canShowInstallBanner) {
    if (isIOSDevice) {
      return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 sm:text-base">
                Woralink est plus rapide sur mobile !
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-600 sm:text-sm">
                Pour installer Woralink sur votre iPhone : appuyez sur Partager ↑ puis sur{' '}
                <span className="font-semibold">« Sur l&apos;écran d&apos;accueil »</span> ⊕.
              </p>
            </div>

            <div className="relative flex flex-col items-center gap-2">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-gray-50">
                <span className="text-xl leading-none">↗</span>
              </div>

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full animate-bounce pt-1">
                <div className="relative h-2 w-2 -rotate-45 transform border-b-2 border-r-2 border-gray-400" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseInstallBanner}
              aria-label="Fermer le bandeau"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 sm:text-base">
              Woralink est plus rapide sur mobile !
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600 sm:text-sm">
              Installez l&apos;application sur votre écran d&apos;accueil pour accéder à vos
              services en un clic.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {installEvent ? (
              <button
                type="button"
                onClick={handleInstallNow}
                className="inline-flex items-center justify-center rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-800 sm:px-4 sm:text-sm"
              >
                Installer maintenant
              </button>
            ) : (
              <p className="max-w-56 text-right text-xs leading-relaxed text-gray-600 sm:text-sm">
                Ouvrez le menu du navigateur puis choisissez Installer l&apos;application.
              </p>
            )}

            <button
              type="button"
              onClick={handleCloseInstallBanner}
              aria-label="Fermer le bandeau"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isGuest || closed || !shouldDisplay) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transform border-t border-white/20 bg-primary text-white shadow-2xl transition-all duration-500 ease-out ${
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

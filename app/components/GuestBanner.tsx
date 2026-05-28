'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabase';

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
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-sm transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 transition-colors duration-200 dark:text-slate-100 sm:text-base">
                Woralink est plus rapide sur mobile !
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300 sm:text-sm">
                Pour installer Woralink sur votre iPhone : appuyez sur Partager ↑ puis sur{' '}
                <span className="font-semibold">« Sur l&apos;écran d&apos;accueil »</span> ⊕.
              </p>
            </div>

            <div className="relative flex flex-col items-center gap-2">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 transition-colors duration-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
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
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-sm transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 transition-colors duration-200 dark:text-slate-100 sm:text-base">
              Woralink est plus rapide sur mobile !
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300 sm:text-sm">
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
              <p className="max-w-56 text-right text-xs leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300 sm:text-sm">
                Ouvrez le menu du navigateur puis choisissez Installer l&apos;application.
              </p>
            )}

            <button
              type="button"
              onClick={handleCloseInstallBanner}
              aria-label="Fermer le bandeau"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

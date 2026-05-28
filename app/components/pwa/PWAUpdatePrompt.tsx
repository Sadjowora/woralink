'use client';

import { useEffect, useRef, useState } from 'react';

export default function PWAUpdatePrompt() {
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const waitingRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const shouldReloadRef = useRef(false);

  const activateWaitingWorker = (registration: ServiceWorkerRegistration) => {
    const waitingWorker = registration.waiting;
    if (!waitingWorker) return;

    shouldReloadRef.current = true;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const appliedOnReloadKey = 'pwa-update-applied-on-reload';

    const isManualReloadNavigation = () => {
      const navEntry = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;

      if (navEntry?.type) {
        return navEntry.type === 'reload';
      }

      // Fallback for older navigation API.
      const legacyNavigation = performance.navigation;
      return legacyNavigation?.type === 1;
    };

    const markUpdateReady = (registration: ServiceWorkerRegistration) => {
      waitingRegistrationRef.current = registration;

      if (isManualReloadNavigation() && sessionStorage.getItem(appliedOnReloadKey) !== '1') {
        sessionStorage.setItem(appliedOnReloadKey, '1');
        activateWaitingWorker(registration);
        return;
      }

      setUpdateReady(true);
    };

    const watchRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        markUpdateReady(registration);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            markUpdateReady(registration);
          }
        });
      });
    };

    const onControllerChange = () => {
      if (!shouldReloadRef.current) return;
      sessionStorage.removeItem(appliedOnReloadKey);
      window.location.reload();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      void navigator.serviceWorker.getRegistration().then((registration) => {
        if (!registration) return;
        void registration.update();
        if (registration.waiting) {
          markUpdateReady(registration);
        } else {
          sessionStorage.removeItem(appliedOnReloadKey);
        }
      });
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    document.addEventListener('visibilitychange', onVisibilityChange);

    void navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;
      watchRegistration(registration);
      void registration.update();
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const handleRefresh = () => {
    const registration = waitingRegistrationRef.current;
    if (!registration) return;

    activateWaitingWorker(registration);
  };

  if (!updateReady || dismissed) return null;

  return (
    <div className="z-80 fixed bottom-4 right-4 max-w-xs rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-medium text-gray-900">Une nouvelle version est disponible.</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center rounded-lg bg-green-700 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-green-800"
        >
          Rafraichir
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}

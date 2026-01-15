"use client";

import { useEffect, useState, useCallback } from "react";

interface UseServiceWorkerReturn {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  updateServiceWorker: () => void;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        setRegistration(reg);
        setIsRegistered(true);

        // Check for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New version available
                setIsUpdateAvailable(true);
                setWaitingWorker(newWorker);
              }
            });
          }
        });

        // Check if there's already a waiting worker
        if (reg.waiting) {
          setIsUpdateAvailable(true);
          setWaitingWorker(reg.waiting);
        }

        // Handle controller change (after update)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    registerSW();

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data.type === "SYNC_PROGRESS") {
        // Trigger a sync in the app
        window.dispatchEvent(new CustomEvent("sw-sync-progress"));
      }
    });
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  }, [waitingWorker]);

  return {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    registration,
    updateServiceWorker,
  };
}

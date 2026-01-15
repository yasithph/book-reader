"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UsePWAInstallReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<boolean>;
  dismissPrompt: () => void;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (typeof window !== "undefined") {
      // Check display-mode
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      // Check iOS standalone mode
      const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);

      // Check if iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Install prompt error:", error);
      return false;
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setDeferredPrompt(null);
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    promptInstall,
    dismissPrompt,
  };
}

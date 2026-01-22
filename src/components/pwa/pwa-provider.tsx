"use client";

import { useEffect } from "react";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { OfflineBanner } from "./offline-banner";
import { InstallPrompt } from "./install-prompt";
import { PushNotificationPrompt } from "./push-notification-prompt";

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  // Show update prompt when new version is available
  useEffect(() => {
    if (isUpdateAvailable) {
      // You could show a toast or banner here
      console.log("New version available!");
    }
  }, [isUpdateAvailable]);

  return (
    <>
      <OfflineBanner />
      {children}
      <InstallPrompt />
      <PushNotificationPrompt delay={15000} />

      {/* Update available banner */}
      {isUpdateAvailable && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 flex items-center justify-between">
          <span className="text-sm">A new version is available!</span>
          <button
            onClick={updateServiceWorker}
            className="px-3 py-1.5 bg-[var(--auth-burgundy)] text-white rounded-lg text-sm font-medium"
          >
            Update
          </button>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";

type PushSubscriptionState = "unsupported" | "denied" | "default" | "granted" | "loading";

interface UsePushNotificationsReturn {
  permission: PushSubscriptionState;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  checkSubscription: () => Promise<boolean>;
}

/**
 * Hook for managing push notification subscriptions
 * Handles subscription, unsubscription, and permission checking
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushSubscriptionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }

    // Get current permission state
    const currentPermission = Notification.permission;
    setPermission(currentPermission as PushSubscriptionState);

    // Check if already subscribed
    checkSubscription();
  }, []);

  /**
   * Checks if the user already has an active push subscription
   */
  const checkSubscription = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const subscribed = subscription !== null;
      setIsSubscribed(subscribed);
      return subscribed;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  }, []);

  /**
   * Subscribes the user to push notifications
   * 1. Requests notification permission
   * 2. Gets service worker registration
   * 3. Subscribes to push manager with VAPID public key
   * 4. Sends subscription to server
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (permission === "unsupported") {
      console.error("Push notifications are not supported");
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result as PushSubscriptionState);

      if (result !== "granted") {
        console.log("Notification permission denied");
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push notifications with VAPID public key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (!vapidPublicKey) {
          throw new Error("VAPID public key not configured");
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // Send subscription to server
      const response = await fetch("/api/user/push-subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
            auth: arrayBufferToBase64(subscription.getKey("auth")),
          },
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription to server");
      }

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      setIsLoading(false);
      return false;
    }
  }, [permission]);

  /**
   * Unsubscribes the user from push notifications
   * 1. Gets current subscription
   * 2. Unsubscribes from push manager
   * 3. Removes subscription from server
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        setIsLoading(false);
        return true;
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove from server
      await fetch(`/api/user/push-subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
        method: "DELETE",
      });

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}

/**
 * Converts a URL-safe base64 string to a Uint8Array
 * Required for VAPID public key conversion
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Converts an ArrayBuffer to a base64 string
 * Required for sending subscription keys to server
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

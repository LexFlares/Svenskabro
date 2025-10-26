import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import "@/styles/globals.css";
import "@/styles/professional.css";
import '@/styles/mobile.css';
import '@/styles/light-theme.css';
import "@/styles/skanska-inspired.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { pushNotifications } from "@/lib/pushNotifications";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize Service Worker and Push Notifications on app mount
    if (typeof window !== "undefined") {
      initializeServiceWorker();
    }
  }, []);

  const initializeServiceWorker = async () => {
    try {
      // Register Service Worker
      const isInitialized = await pushNotifications.initialize();
      
      if (isInitialized) {
        console.log("✅ Push notifications enabled for LexHub");
        
        // Get push subscription
        const subscription = await pushNotifications.getSubscription();
        if (subscription) {
          console.log("📱 Push subscription active:", subscription.endpoint);
        }
      } else {
        console.log("⚠️ Push notifications not available");
      }
    } catch (error) {
      console.error("Failed to initialize Service Worker:", error);
    }
  };

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
      <Toaster />
    </ErrorBoundary>
  );
}

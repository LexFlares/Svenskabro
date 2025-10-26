class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  public isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "default";
    }
    return Notification.permission;
  }

  public async initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn("Push notifications not supported");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission denied");
        return false;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/"
      });

      await navigator.serviceWorker.ready;
      this.registration = registration;

      console.log("✅ Push notifications initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
      return false;
    }
  }

  public async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.warn("Service worker not registered");
      return null;
    }

    try {
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          console.warn("VAPID public key not configured");
          return null;
        }

        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicKey)
        });

        console.log("✅ Created new push subscription");
      }

      this.subscription = subscription;
      return subscription;
    } catch (error) {
      console.error("Failed to get push subscription:", error);
      return null;
    }
  }

  public async showLocalNotification(
    title: string,
    options?: NotificationOptions & { vibrate?: number | readonly number[] }
  ): Promise<void> {
    if (!this.registration) {
      console.warn("Service worker not registered");
      return;
    }

    if (this.getPermissionStatus() !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    try {
      const notificationOptions = {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        vibrate: [200, 100, 200],
        requireInteraction: false,
        ...options
      };
      await this.registration.showNotification(title, notificationOptions);
    } catch (error) {
      console.error("Failed to show notification:", error);
    }
  }

  public async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();
      if (success) {
        this.subscription = null;
        console.log("✅ Unsubscribed from push notifications");
      }
      return success;
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  public async testNotification(): Promise<void> {
    await this.showLocalNotification("Test Notification", {
      body: "Push notifications are working correctly!",
      tag: "test-notification"
    });
  }
}

export const pushNotifications = new PushNotificationService();

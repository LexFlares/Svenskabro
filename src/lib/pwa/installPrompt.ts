interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export const pwaInstallPrompt = {
  init() {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      console.log('📱 PWA install prompt available');
    });

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      deferredPrompt = null;
    });
  },

  isAvailable(): boolean {
    return deferredPrompt !== null;
  },

  async show(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!deferredPrompt) {
      console.warn('PWA install prompt not available');
      return 'unavailable';
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`User ${outcome} the install prompt`);
      deferredPrompt = null;

      return outcome;
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return 'dismissed';
    }
  },

  isInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }
};

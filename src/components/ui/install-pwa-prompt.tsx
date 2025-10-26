'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { pwaInstallPrompt } from '@/lib/pwa/installPrompt';

export function InstallPWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    pwaInstallPrompt.init();

    const checkInstallPrompt = setInterval(() => {
      if (pwaInstallPrompt.isAvailable() && !dismissed && !pwaInstallPrompt.isInstalled()) {
        setShowPrompt(true);
      }
    }, 2000);

    return () => clearInterval(checkInstallPrompt);
  }, [dismissed]);

  const handleInstall = async () => {
    const result = await pwaInstallPrompt.show();
    if (result === 'accepted') {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt || pwaInstallPrompt.isInstalled()) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="bg-gray-800 border-orange-500/30 p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Stäng"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Download className="h-5 w-5 text-orange-500" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">
              Installera LexHub
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Få snabb åtkomst och arbeta offline
            </p>

            <Button
              onClick={handleInstall}
              size="sm"
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Installera nu
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

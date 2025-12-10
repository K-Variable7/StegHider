'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      // Hide the install button when the app is installed
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if ('standalone' in window.navigator && (window.navigator as any).standalone) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // Reset the deferred prompt
    setDeferredPrompt(null);
    setShowInstallButton(false);

    // Optionally, send analytics event with outcome
    console.log(`User ${outcome} the install prompt`);
  };

  if (!showInstallButton) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-xl shadow-2xl border border-red-500/30 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">📱</div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">Install VaultWars</h3>
            <p className="text-xs text-red-100">Add to home screen for the best experience!</p>
          </div>
          <button
            onClick={handleInstallClick}
            className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
          >
            Install
          </button>
        </div>
        <button
          onClick={() => setShowInstallButton(false)}
          className="absolute top-2 right-2 text-red-200 hover:text-white text-lg"
        >
          ×
        </button>
      </div>
    </div>
  );
}
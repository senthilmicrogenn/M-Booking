import { useState, useEffect } from "react";

interface PWAState {
  isStandalone: boolean;
  isInstallable: boolean;
  canInstall: () => Promise<boolean>;
  install: () => Promise<boolean>;
}

export function usePWA(): PWAState {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const checkStandalone = () => {
      const standalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(standalone);
    };

    checkStandalone();

    // Listen for PWA install events
    const handleInstallable = (e: CustomEvent) => {
      setIsInstallable(e.detail.installable);
    };

    window.addEventListener('pwa-installable', handleInstallable as EventListener);
    
    return () => {
      window.removeEventListener('pwa-installable', handleInstallable as EventListener);
    };
  }, []);

  const canInstall = async () => isInstallable;
  
  const install = async (): Promise<boolean> => {
    const { getPWAState } = await import("@/utils/pwa");
    const state = getPWAState();
    return await state.install();
  };

  return {
    isStandalone,
    isInstallable,
    canInstall,
    install
  };
}
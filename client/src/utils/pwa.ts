// PWA utilities for service worker registration and app install prompt

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isStandalone: boolean;
  canInstall: () => Promise<boolean>;
  install: () => Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Check if app is running in standalone mode
export const isStandalone = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Check if PWA is installable
export const isPWAInstallable = (): boolean => {
  return deferredPrompt !== null;
};

// Register service worker
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('[PWA] Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('[PWA] Service worker registered:', registration.scope);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log('[PWA] New version available');
                showUpdateNotification();
              } else {
                // Content cached for offline use
                console.log('[PWA] Content cached for offline use');
              }
            }
          });
        }
      });
      
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  } else {
    console.log('[PWA] Service workers not supported');
  }
};

// Show update notification
const showUpdateNotification = () => {
  if (confirm('New version available! Click OK to refresh and get the latest features.')) {
    window.location.reload();
  }
};

// Listen for install prompt
export const setupInstallPrompt = (): void => {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    console.log('[PWA] Install prompt available');
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Trigger custom install UI
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App was installed');
    deferredPrompt = null;
    hideInstallButton();
  });
};

// Show install button in UI
const showInstallButton = () => {
  const event = new CustomEvent('pwa-installable', {
    detail: { installable: true }
  });
  window.dispatchEvent(event);
};

// Hide install button in UI
const hideInstallButton = () => {
  const event = new CustomEvent('pwa-installable', {
    detail: { installable: false }
  });
  window.dispatchEvent(event);
};

// Trigger app installation
export const installPWA = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('[PWA] User choice:', outcome);
    
    if (outcome === 'accepted') {
      deferredPrompt = null;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[PWA] Install failed:', error);
    return false;
  }
};

// Get PWA installation state
export const getPWAState = (): PWAInstallState => {
  return {
    isInstallable: isPWAInstallable(),
    isStandalone: isStandalone(),
    canInstall: async () => isPWAInstallable(),
    install: installPWA
  };
};

// Initialize PWA features
export const initializePWA = async (): Promise<void> => {
  console.log('[PWA] Initializing PWA features...');
  
  // Register service worker
  await registerServiceWorker();
  
  // Setup install prompt
  setupInstallPrompt();
  
  // Check if already standalone
  if (isStandalone()) {
    console.log('[PWA] Running in standalone mode');
    document.body.classList.add('standalone');
  }
  
  console.log('[PWA] PWA initialization complete');
};

// Offline storage utilities
export const storeOfflineData = async (key: string, data: any): Promise<void> => {
  try {
    if ('indexedDB' in window) {
      // Use IndexedDB for larger data
      console.log('[PWA] Storing offline data:', key);
      localStorage.setItem(`pwa_offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    }
  } catch (error) {
    console.error('[PWA] Failed to store offline data:', error);
  }
};

export const getOfflineData = async (key: string): Promise<any | null> => {
  try {
    const stored = localStorage.getItem(`pwa_offline_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if data is not too old (24 hours)
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return parsed.data;
      } else {
        // Clean up old data
        localStorage.removeItem(`pwa_offline_${key}`);
      }
    }
    return null;
  } catch (error) {
    console.error('[PWA] Failed to get offline data:', error);
    return null;
  }
};
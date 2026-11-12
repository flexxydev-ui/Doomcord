import React, { useEffect, useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuide(true);
          }
        }}
        title="Install Doomcord Desktop / Mobile App (PWA)"
        className={
          compact
            ? 'h-7 px-2.5 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[11px] font-medium text-[#C4B1FF] flex items-center gap-1.5 transition-colors'
            : 'h-8 px-3 rounded-lg bg-[#17171F] hover:bg-[#22212C] border border-[#8957F5]/40 text-xs font-semibold text-[#C4B1FF] flex items-center gap-1.5 transition-colors'
        }
      >
        <Download className="w-3.5 h-3.5 text-[#8957F5]" />
        <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#101014] border border-[#282631] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#17171F] border border-[#8957F5]/40 flex items-center justify-center text-[#8957F5]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F5F3FA]">
                    Install Doomcord App
                  </h3>
                  <p className="text-[11px] text-[#A19DAD]">
                    Progressive Web App (Desktop, Android & iOS)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 text-[#706C7B] hover:text-[#F5F3FA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="p-3.5 rounded-lg bg-[#17171F] border border-[#282631] space-y-2 text-xs text-[#A19DAD]">
                <p className="font-semibold text-[#F5F3FA]">
                  Install on iPhone or iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>
                    Tap the <strong className="text-[#F5F3FA]">Share</strong>{' '}
                    icon in your Safari toolbar.
                  </li>
                  <li>
                    Scroll down and select{' '}
                    <strong className="text-[#F5F3FA]">
                      Add to Home Screen
                    </strong>
                    .
                  </li>
                  <li>
                    Tap <strong className="text-[#8957F5]">Add</strong> to launch
                    Doomcord in standalone full-screen mode.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-[#17171F] border border-[#282631] space-y-2 text-xs text-[#A19DAD]">
                <p className="font-semibold text-[#F5F3FA]">
                  Install on Desktop Chrome / Edge or Android:
                </p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>
                    Open Doomcord in a top-level browser tab and click the{' '}
                    <strong className="text-[#F5F3FA]">Install Doomcord</strong>{' '}
                    icon in your browser address bar (or browser menu →{' '}
                    <strong className="text-[#F5F3FA]">Install App</strong>).
                  </li>
                  <li>
                    Doomcord will run in its own standalone window with offline
                    shell caching and home-screen shortcut support.
                  </li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full h-8 rounded-lg bg-[#8957F5] hover:bg-[#7846E4] text-white text-xs font-semibold transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#E8B768] px-3 py-1.5 text-xs font-semibold text-[#09090D] shadow-lg">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — Reconnecting to Doomcord real-time sync...</span>
    </div>
  );
};

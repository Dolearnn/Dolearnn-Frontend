'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

// Chrome on Android hands the page this event when the app can be installed.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'dolearn.installDismissedAt';
// After "Not now", ask again a week later at most.
const ASK_AGAIN_MS = 7 * 86_400_000;

function recentlyDismissed() {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && Date.now() - at < ASK_AGAIN_MS;
  } catch {
    return false;
  }
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iPhone home-screen apps
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Invites a learner to add DoLearnn to their home screen: a one-tap install on
 * Android, and the Share → Add to Home Screen steps on iPhone. Hidden once
 * installed, on desktop, or for a week after "Not now".
 */
export default function InstallAppCard({ className }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    const onInstalled = () => setHidden(true);
    window.addEventListener('appinstalled', onInstalled);
    // iPhones and iPads never fire beforeinstallprompt; show the manual steps there.
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setIos(true);
      setHidden(false);
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private mode: it just asks again next visit.
    }
    setHidden(true);
  };

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    if (outcome === 'accepted') setHidden(true);
  };

  return (
    <section
      aria-labelledby="install-heading"
      className={`relative flex items-start gap-3 rounded-3xl border border-gray-200/80 bg-white p-4 pr-12 dark:border-border dark:bg-card ${className ?? ''}`}
    >
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 rounded-2xl ring-1 ring-gray-200 dark:ring-border"
      />
      <div className="min-w-0 flex-1">
        <h2 id="install-heading" className="font-display text-base font-bold text-gray-950 dark:text-foreground">
          Add DoLearnn to your home screen
        </h2>
        {ios ? (
          <p className="mt-0.5 text-sm leading-6 text-gray-600 dark:text-muted-foreground">
            Tap <Share className="mx-0.5 inline h-4 w-4 align-[-2px]" aria-label="Share" /> in Safari, then{' '}
            <strong className="font-semibold">Add to Home Screen</strong>. It opens like an app.
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-sm leading-6 text-gray-600 dark:text-muted-foreground">
              Open it in one tap, like an app. It uses little data and space.
            </p>
            <Button className="mt-3 h-11 rounded-2xl px-5" onClick={install}>
              <Download className="mr-2 h-4 w-4" /> Install app
            </Button>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>
    </section>
  );
}

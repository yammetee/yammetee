'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { useLanguage } from '../contexts/LanguageContext';

const CONSENT_KEY = 'yt_cookie_consent';
const CONSENT_EVENT = 'yt-cookie-consent-change';

type CookieDecision = 'accepted' | 'declined' | null;

function getCookieDecisionSnapshot(): CookieDecision {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(CONSENT_KEY);
  return saved === 'accepted' || saved === 'declined' ? saved : null;
}

function subscribeToCookieDecision(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === CONSENT_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(CONSENT_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CONSENT_EVENT, onStoreChange);
  };
}

function updateCookieDecision(nextDecision: Exclude<CookieDecision, null>) {
  localStorage.setItem(CONSENT_KEY, nextDecision);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export default function CookieConsent() {
  const { t } = useLanguage();
  const decision = useSyncExternalStore(
    subscribeToCookieDecision,
    getCookieDecisionSnapshot,
    () => null,
  );

  const onAccept = () => {
    updateCookieDecision('accepted');
  };

  const onDecline = () => {
    updateCookieDecision('declined');
  };

  const showBanner = decision === null;

  return (
    <>
      {decision === 'accepted' ? <Analytics /> : null}

      {showBanner ? (
        <div className="fixed bottom-4 left-4 right-4 z-[60] max-w-3xl mx-auto bg-neutral-950 border border-neutral-800 rounded-xl p-4">
          <p className="text-sm text-neutral-200">
            {t.cookieConsent.message}{' '}
            <Link href="/legal/cookies" className="underline text-white">
              {t.cookieConsent.learnMore}
            </Link>
            .
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onAccept}
              className="px-3 py-1.5 rounded-md bg-white text-black text-sm font-medium"
            >
              {t.cookieConsent.accept}
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="px-3 py-1.5 rounded-md border border-neutral-700 text-sm text-neutral-200"
            >
              {t.cookieConsent.decline}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

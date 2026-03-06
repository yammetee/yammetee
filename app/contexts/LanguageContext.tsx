'use client';

import { createContext, useContext, useSyncExternalStore, ReactNode } from 'react';
import { Language, Dictionary, dictionaries } from '../lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_KEY = 'language';
const languageListeners = new Set<() => void>();

function emitLanguageChange() {
  languageListeners.forEach((listener) => listener());
}

function subscribeLanguage(listener: () => void) {
  languageListeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === LANGUAGE_KEY) {
      listener();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    languageListeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

function readLanguageSnapshot(): Language {
  if (typeof window === 'undefined') return 'ru';
  const saved = localStorage.getItem(LANGUAGE_KEY);
  return saved === 'en' || saved === 'ru' ? saved : 'ru';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribeLanguage,
    readLanguageSnapshot,
    () => 'ru',
  );

  const setLanguage = (lang: Language) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LANGUAGE_KEY, lang);
    emitLanguageChange();
  };

  const t = dictionaries[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

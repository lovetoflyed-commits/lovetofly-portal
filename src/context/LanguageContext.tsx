'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import ptTranslations from '@/translations/pt.json';
import enTranslations from '@/translations/en.json';
import esTranslations from '@/translations/es.json';

type Language = 'pt' | 'en' | 'es';

interface Translation {
  [key: string]: string | Translation;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translation> = {
  pt: ptTranslations,
  en: enTranslations,
  es: esTranslations,
};

// Default context for server-side and non-mounted scenarios
const createDefaultContext = (): LanguageContextType => ({
  language: 'pt',
  setLanguage: () => {},
  t: (key: string, defaultValue?: string) => defaultValue || key,
});

// Helper to initialize language from localStorage or browser
const initializeLanguage = (): Language => {
  if (typeof window === 'undefined') return 'pt';
  
  const savedLanguage = localStorage.getItem('preferredLanguage') as Language | null;
  if (savedLanguage && ['pt', 'en', 'es'].includes(savedLanguage)) {
    return savedLanguage;
  }
  
  // Try to detect browser language
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'en') return 'en';
  if (browserLang === 'es') return 'es';
  return 'pt';
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => initializeLanguage());
  const [mounted, setMounted] = useState(false);

  // Set mounted flag after first render
  useEffect(() => {
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  // Helper function to get nested translation keys
  const t = (key: string, defaultValue: string = key): string => {
    const keys = key.split('.');
    let current: any = translations[language];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return defaultValue;
      }
    }

    return typeof current === 'string' ? current : defaultValue;
  };

  // Provide context immediately - avoid returning children without provider
  // This allows server-side rendering and components outside provider to use default context
  return (
    <LanguageContext.Provider value={mounted ? { language, setLanguage, t } : createDefaultContext()}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  // Return default context if not found instead of throwing error
  // This prevents build errors during SSR and pre-rendering
  if (!context) {
    return createDefaultContext();
  }
  return context;
}

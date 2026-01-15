'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-semibold text-slate-700 border border-slate-200"
        title="Select language / Seleccionar idioma"
      >
        <span className="text-xl">{currentLang?.flag}</span>
        <span className="hidden sm:inline">{currentLang?.name}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as 'pt' | 'en' | 'es');
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-center gap-3 ${
                language === lang.code ? 'bg-blue-50' : ''
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div>
                <div className="font-semibold text-slate-900">{lang.name}</div>
                <div className="text-xs text-slate-500">
                  {lang.code === 'pt' && 'Português Brasileiro'}
                  {lang.code === 'en' && 'United States'}
                  {lang.code === 'es' && 'Español'}
                </div>
              </div>
              {language === lang.code && (
                <div className="ml-auto">
                  <span className="text-blue-600 font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

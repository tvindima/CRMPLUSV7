'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="fixed top-6 right-6 z-50 flex gap-2 bg-black/50 backdrop-blur-md border border-pink-500/30 rounded-full px-4 py-2">
      <button
        onClick={() => setLocale('pt')}
        className={`px-3 py-1 rounded-full transition-all font-medium text-sm ${
          locale === 'pt'
            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
        aria-label="Switch to Portuguese"
      >
        PT
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1 rounded-full transition-all font-medium text-sm ${
          locale === 'en'
            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}

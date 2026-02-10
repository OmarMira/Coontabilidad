import React from 'react';
import { useI18n } from '../contexts/I18nContext';

export function LanguageSelector() {
    const { locale, setLocale } = useI18n();

    const toggleLanguage = () => {
        setLocale(locale === 'es' ? 'en' : 'es');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
            </svg>
            <span className="font-medium text-sm">
                {locale === 'es' ? 'ES' : 'EN'}
            </span>
        </button>
    );
}

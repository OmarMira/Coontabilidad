import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import esTranslations from '../locales/es.json';
import enTranslations from '../locales/en.json';

type Locale = 'es' | 'en';

type Translations = typeof esTranslations;

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    translations: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'accountexpress_locale';

const translations: Record<Locale, Translations> = {
    es: esTranslations,
    en: enTranslations
};

export function I18nProvider({ children }: { children: ReactNode }) {
    // Cargar idioma desde localStorage o usar español por defecto
    const [locale, setLocaleState] = useState<Locale>(() => {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
        return (stored === 'es' || stored === 'en') ? stored : 'es';
    });

    // Persistir cambios de idioma en localStorage
    useEffect(() => {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        // Actualizar atributo lang del documento
        document.documentElement.lang = locale;
    }, [locale]);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
    };

    // Función de traducción con soporte para interpolación
    const t = (key: string, params?: Record<string, string | number>): string => {
        const keys = key.split('.');
        let value: any = translations[locale];

        // Navegar por el objeto de traducciones
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback a español si no existe la clave en inglés
                if (locale === 'en') {
                    let fallbackValue: any = translations.es;
                    for (const fk of keys) {
                        if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
                            fallbackValue = fallbackValue[fk];
                        } else {
                            return key; // Si tampoco existe en español, devolver la clave
                        }
                    }
                    value = fallbackValue;
                } else {
                    return key; // Devolver la clave si no se encuentra
                }
            }
        }

        // Si el valor no es string, devolver la clave
        if (typeof value !== 'string') {
            return key;
        }

        // Interpolación de parámetros
        if (params) {
            return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
                return paramKey in params ? String(params[paramKey]) : match;
            });
        }

        return value;
    };

    const value: I18nContextType = {
        locale,
        setLocale,
        t,
        translations: translations[locale]
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
}

// Hook para obtener solo la función de traducción (más conveniente)
export function useTranslation() {
    const { t, locale } = useI18n();
    return { t, locale };
}

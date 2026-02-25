import React, { createContext, useContext, useState, ReactNode } from 'react';
import esTranslations from '@/locales/es.json';

type Locale = 'es';
type Translations = typeof esTranslations;

interface I18nContextType {
    locale: Locale;
    t: (key: string, params?: Record<string, string | number>) => string;
    translations: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * I18nProvider simplificado para soporte UNICAMENTE de español.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale] = useState<Locale>('es');

    // Función de traducción con soporte para interpolación
    const t = (key: string, params?: Record<string, string | number>): string => {
        const keys = key.split('.');
        let value: any = esTranslations;

        // Navegar por el objeto de traducciones
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key;
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
        t,
        translations: esTranslations
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

export function useTranslation() {
    const { t, locale } = useI18n();
    return { t, locale };
}

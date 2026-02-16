import { useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { translationEngine } from '@/features/i18n/TranslationEngine';

/**
 * Hook para usar traducciones desde el motor central.
 * Mantiene compatibilidad con la API anterior.
 */
export const useLocale = () => {
    const { language } = useLanguage();

    const t = useCallback(<T = string>(key: string, params?: Record<string, string | number>): T => {
        let value = translationEngine.t(key);

        // Interpolación de parámetros {{param}} o {param} solo si es string
        if (typeof value === 'string' && params) {
            return value.replace(/\{{1,2}(\w+)\}{1,2}/g, (match, paramKey) => {
                return paramKey in params ? String(params[paramKey]) : match;
            }) as unknown as T;
        }

        return value as T;
    }, [language]);

    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }, [language]);

    return { t, language, formatCurrency };
};

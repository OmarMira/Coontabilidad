import { useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { translationEngine } from '../core/i18n/TranslationEngine';

/**
 * Hook para usar traducciones desde el motor central.
 * Mantiene compatibilidad con la API anterior.
 */
export const useLocale = () => {
    const { language } = useLanguage();

    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        let value = translationEngine.t(key);

        // Interpolación de parámetros {{param}} o {param}
        if (params && value !== key) {
            return value.replace(/\{{1,2}(\w+)\}{1,2}/g, (match, paramKey) => {
                return paramKey in params ? String(params[paramKey]) : match;
            });
        }

        return value;
    }, [language]);

    return { t, language };
};

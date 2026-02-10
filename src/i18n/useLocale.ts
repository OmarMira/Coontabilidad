import { useLanguage } from './LanguageContext';
import esTranslations from '../locales/es.json';
import enTranslations from '../locales/en.json';

type Translations = typeof esTranslations;

/**
 * Hook para usar traducciones desde archivos JSON
 * Soporta claves anidadas con notación de punto (ej: "dashboard.title")
 */
export const useLocale = () => {
    const { language } = useLanguage();

    const translations: Record<'es' | 'en', Translations> = {
        es: esTranslations,
        en: enTranslations
    };

    const t = (key: string, params?: Record<string, string | number>): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        // Navegar por el objeto de traducciones
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Retornar la clave si no se encuentra
            }
        }

        if (typeof value !== 'string') {
            return key;
        }

        // Interpolación de parámetros {{param}}
        if (params) {
            return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
                return paramKey in params ? String(params[paramKey]) : match;
            });
        }

        return value;
    };

    return { t, language };
};

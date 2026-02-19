/**
 * I18nHelper - Utilidad para pasar traducciones a servicios y workers
 * 
 * Permite que servicios backend y web workers accedan a las traducciones
 * sin necesidad de importar React Context
 * SIMPLIFICADO: Solo soporte para español.
 */

import esTranslations from '../assets/locales/es.json';

type Locale = 'es';
type Translations = typeof esTranslations;

const translations: Record<Locale, Translations> = {
    es: esTranslations
};

export class I18nHelper {
    /**
     * Obtener locale actual (fijo a es)
     */
    static getCurrentLocale(): Locale {
        return 'es';
    }

    /**
     * Obtener traducciones para un locale específico
     */
    static getTranslations(locale?: Locale): Translations {
        return translations.es;
    }

    /**
     * Traducir una clave
     */
    static translate(key: string, locale?: Locale, params?: Record<string, string | number>): string {
        const keys = key.split('.');
        let value: any = translations.es;

        // Navegar por el objeto de traducciones
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key;
            }
        }

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
    }

    /**
     * Crear función de traducción
     */
    static createTranslator(locale?: Locale) {
        return (key: string, params?: Record<string, string | number>) => {
            return this.translate(key, 'es', params);
        };
    }

    /**
     * Obtener objeto de traducciones completo para pasar a workers
     */
    static getTranslationsForWorker(locale?: Locale): { locale: Locale; translations: Translations } {
        return {
            locale: 'es',
            translations: translations.es
        };
    }
}

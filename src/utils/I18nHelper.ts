/**
 * I18nHelper - Utilidad para pasar traducciones a servicios y workers
 * 
 * Permite que servicios backend y web workers accedan a las traducciones
 * sin necesidad de importar React Context
 */

import esTranslations from '../locales/es.json';
import enTranslations from '../locales/en.json';

type Locale = 'es' | 'en';
type Translations = typeof esTranslations;

const translations: Record<Locale, Translations> = {
    es: esTranslations,
    en: enTranslations
};

export class I18nHelper {
    /**
     * Obtener locale actual desde localStorage
     */
    static getCurrentLocale(): Locale {
        const stored = localStorage.getItem('accountexpress_locale');
        return (stored === 'es' || stored === 'en') ? stored : 'es';
    }

    /**
     * Obtener traducciones para un locale específico
     */
    static getTranslations(locale?: Locale): Translations {
        const currentLocale = locale || this.getCurrentLocale();
        return translations[currentLocale];
    }

    /**
     * Traducir una clave con fallback a español
     */
    static translate(key: string, locale?: Locale, params?: Record<string, string | number>): string {
        const currentLocale = locale || this.getCurrentLocale();
        const keys = key.split('.');
        let value: any = translations[currentLocale];

        // Navegar por el objeto de traducciones
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback a español si no existe la clave
                if (currentLocale === 'en') {
                    let fallbackValue: any = translations.es;
                    for (const fk of keys) {
                        if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
                            fallbackValue = fallbackValue[fk];
                        } else {
                            return key;
                        }
                    }
                    value = fallbackValue;
                } else {
                    return key;
                }
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
     * Crear función de traducción para un locale específico
     */
    static createTranslator(locale?: Locale) {
        const currentLocale = locale || this.getCurrentLocale();
        return (key: string, params?: Record<string, string | number>) => {
            return this.translate(key, currentLocale, params);
        };
    }

    /**
     * Obtener objeto de traducciones completo para pasar a workers
     */
    static getTranslationsForWorker(locale?: Locale): { locale: Locale; translations: Translations } {
        const currentLocale = locale || this.getCurrentLocale();
        return {
            locale: currentLocale,
            translations: translations[currentLocale]
        };
    }
}

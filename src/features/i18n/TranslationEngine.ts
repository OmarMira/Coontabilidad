import es from '@/assets/locales/es.json';
import en from '@/assets/locales/en.json';
import { logger } from '@/core/logging/SystemLogger';


export type Language = 'es' | 'en';
export type Dictionary = typeof es;
export type TranslationKey = keyof Dictionary;

/**
 * TRANSLATION ENGINE (CORE LAYER 1 - RECONECTADO)
 * 
 * Motor singleton para la gestión de idiomas y localización.
 * Implementa persistencia automática y carga reactiva de diccionarios.
 */
export class TranslationEngine {
    private static instance: TranslationEngine;
    private currentLanguage: Language = 'es'; // Forzado a ES por defecto
    private dictionaries: Record<Language, any> = { es, en };

    private constructor() {
        this.loadPreference();
    }

    static getInstance(): TranslationEngine {
        if (!this.instance) {
            this.instance = new TranslationEngine();
        }
        return this.instance;
    }

    /**
     * Carga el idioma preferido desde localStorage.
     */
    private loadPreference() {
        const saved = localStorage.getItem('app_language');
        if (saved === 'es' || saved === 'en') {
            this.currentLanguage = saved;
        } else {
            this.currentLanguage = 'es'; // Asegurar default
        }
        document.documentElement.lang = this.currentLanguage;
    }


    /**
     * Cambia el idioma global y persiste la elección.
     */
    public setLanguage(lang: Language) {
        this.currentLanguage = lang;
        localStorage.setItem('app_language', lang);
        document.documentElement.lang = lang;
        logger.info('TranslationEngine', 'language_changed', `Idioma cambiado a: ${lang}`);

        // Notificar a la app mediante evento global
        window.dispatchEvent(new CustomEvent('languageChange', { detail: { language: lang } }));
    }

    /**
     * Retorna el idioma activo.
     */
    public getLanguage(): Language {
        return this.currentLanguage;
    }

    private debug: boolean = true;
    private fallbackLng: Language = 'en';

    /**
     * Función de traducción núcleo con Fallback.
     */
    public t(key: string): any {
        // Convert key to lowercase for case-insensitive lookup
        const normalizedKey = key.toLowerCase();
        let value = this.getValueFromDictionary(this.dictionaries[this.currentLanguage], normalizedKey);

        // Fallback a inglés si no se encuentra en el idioma actual
        if (value === normalizedKey && this.currentLanguage !== this.fallbackLng) {
            if (this.debug) {
                console.warn(`[i18n] Missing key '${key}' in '${this.currentLanguage}'. Falling back to '${this.fallbackLng}'.`);
            }
            value = this.getValueFromDictionary(this.dictionaries[this.fallbackLng], normalizedKey);
        }

        return value;
    }

    private getValueFromDictionary(dictionary: any, key: string): any {
        // First, try exact match for flat keys (e.g., "navigation.dashboard")
        // This handles case where JSON keys contain dots
        const exactMatch = Object.keys(dictionary).find(k => k.toLowerCase() === key.toLowerCase());
        if (exactMatch) {
            return dictionary[exactMatch];
        }

        // If not found as flat key, try nested traversal
        const keys = key.split('.');
        let value = dictionary;

        for (const k of keys) {
            if (value && typeof value === 'object') {
                // Try exact match first
                if (k in value) {
                    value = value[k];
                } else {
                    // Try case-insensitive match
                    const matchingKey = Object.keys(value).find(objKey => objKey.toLowerCase() === k.toLowerCase());
                    if (matchingKey) {
                        value = value[matchingKey];
                    } else {
                        return key;
                    }
                }
            } else {
                return key;
            }
        }
        return value;
    }

    /**
     * Mapeo dinámico para entidades contables (Capa 1).
     */
    public translateEntity(entity: string): string {
        // Mapeo especial para entidades que vienen de DB
        const entityMap: Record<string, string> = {
            'asset': 'customer', // Ejemplo de mapeo si fuera necesario
            'liability': 'bill'
        };
        const key = entityMap[entity.toLowerCase()] || entity.toLowerCase();
        return this.t(key);
    }
}

// Exportación única para uso global
export const translationEngine = TranslationEngine.getInstance();
export const t = (key: string) => translationEngine.t(key);

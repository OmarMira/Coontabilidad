import es from '../../assets/locales/es.json';
import en from '../../assets/locales/en.json';
import { logger } from '../logging/SystemLogger';

export type Language = 'es' | 'en';
export type Dictionary = typeof es;
export type TranslationKey = keyof Dictionary;

/**
 * TRANSLATION ENGINE (CORE LAYER 1)
 * 
 * Motor singleton para la gestión de idiomas y localización.
 * Implementa persistencia automática y carga reactiva de diccionarios.
 */
export class TranslationEngine {
    private static instance: TranslationEngine;
    private currentLanguage: Language = 'en';
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

    /**
     * Función de traducción núcleo.
     */
    public t(key: string): string {
        const dictionary = this.dictionaries[this.currentLanguage];
        return dictionary[key as TranslationKey] || key;
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

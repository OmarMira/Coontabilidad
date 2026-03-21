import es from '@/locales/es.json';
import { logger } from '../../core/logging/SystemLogger';

export type Language = 'es';
export type Dictionary = typeof es;
export type TranslationKey = keyof Dictionary;

/**
 * TRANSLATION ENGINE (CORE LAYER 1 - RECONECTADO)
 * 
 * Motor singleton para la gestión de idiomas y localización.
 * Implementa persistencia automática y carga reactiva de diccionarios.
 * SIMPLIFICADO: Solo soporte para español.
 */
export class TranslationEngine {
    private static instance: TranslationEngine;
    private currentLanguage: Language = 'es';
    public dictionaries: Record<Language, any> = { es };

    private constructor() {
        this.loadPreference();
        // Exponer para debugging (Solo si es necesario para logs técnicos)
        if (typeof window !== 'undefined') {
            (window as any).translationEngine = this;
        }
    }

    static getInstance(): TranslationEngine {
        if (!this.instance) {
            this.instance = new TranslationEngine();
        }
        return this.instance;
    }

    /**
     * Carga el idioma preferido (fijo a es).
     */
    private loadPreference() {
        this.currentLanguage = 'es';
        if (typeof document !== 'undefined') {
            document.documentElement.lang = this.currentLanguage;
        }
    }


    /**
     * Cambia el idioma global (fijo a es).
     */
    public setLanguage(lang: Language) {
        this.currentLanguage = 'es';
        if (typeof document !== 'undefined') {
            document.documentElement.lang = 'es';
        }
        logger.info('TranslationEngine', 'language_changed', `Idioma fijado a: es`);
    }

    /**
     * Retorna el idioma activo.
     */
    public getLanguage(): Language {
        return 'es';
    }

    /**
     * Función de traducción núcleo.
     */
    public t(key: string): any {
        const normalizedKey = key.toLowerCase();
        let value = this.getValueFromDictionary(this.dictionaries[this.currentLanguage], normalizedKey);
        return value;
    }

    private getValueFromDictionary(dictionary: any, key: string): any {
        // Primero, intentar coincidencia exacta para claves planas (ej. "navigation.dashboard")
        const exactMatch = Object.keys(dictionary).find(k => k.toLowerCase() === key.toLowerCase());
        if (exactMatch) {
            return dictionary[exactMatch];
        }

        // Si no se encuentra como clave plana, intentar recorrido anidado
        const keys = key.split('.');
        let value = dictionary;

        for (const k of keys) {
            if (value && typeof value === 'object') {
                if (k in value) {
                    value = value[k];
                } else {
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
     * Mapeo dinámico para entidades contables.
     */
    public translateEntity(entity: string): string {
        const entityMap: Record<string, string> = {
            'asset': 'customer',
            'liability': 'bill'
        };
        const key = entityMap[entity.toLowerCase()] || entity.toLowerCase();
        return this.t(key);
    }
}

// Exportación única para uso global
export const translationEngine = TranslationEngine.getInstance();
export const t = (key: string) => translationEngine.t(key);

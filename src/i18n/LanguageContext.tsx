import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translationEngine } from '../features/i18n/TranslationEngine';

interface LanguageContextType {
    language: 'es';
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

/**
 * LanguageProvider simplificado para soporte UNICAMENTE de español.
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    // Forzamos el idioma a español fijo
    const [language] = useState<'es'>('es');

    // Función de traducción directa desde el engine
    const t = (key: string): string => translationEngine.t(key);

    return (
        <LanguageContext.Provider value={{ language, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const useTranslation = useLanguage;

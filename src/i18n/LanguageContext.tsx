import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translationEngine, Language, TranslationKey } from '../features/i18n/TranslationEngine';
import es from '@/assets/locales/es.json';
import en from '@/assets/locales/en.json';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => translationEngine.getLanguage());

    const setLanguage = (lang: Language) => {
        translationEngine.setLanguage(lang);
        setLanguageState(lang);
    };

    // Escuchar cambios externos del engine (ej. desde fuera de React)
    useEffect(() => {
        const handleLanguageChange = (e: any) => {
            setLanguageState(e.detail.language);
        };
        window.addEventListener('languageChange', handleLanguageChange);
        return () => window.removeEventListener('languageChange', handleLanguageChange);
    }, []);

    const t = (key: string): string => translationEngine.t(key);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
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

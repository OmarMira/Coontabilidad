import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LanguageSwitcherProps {
    variant?: 'sidebar' | 'header' | 'compact';
    className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    variant = 'sidebar',
    className = ''
}) => {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'es' ? 'en' : 'es');
    };

    // Variante para Sidebar (botón completo)
    if (variant === 'sidebar') {
        return (
            <button
                onClick={toggleLanguage}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl font-bold transition-all border border-slate-800 group uppercase text-xs ${className}`}
                title={language === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish'}
            >
                <div className="flex items-center gap-3">
                    <Languages className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{language === 'es' ? 'ESPAÑOL' : 'ENGLISH'}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${language === 'es'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-600'
                        }`}>
                        ES
                    </span>
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${language === 'en'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-600'
                        }`}>
                        EN
                    </span>
                </div>
            </button>
        );
    }

    // Variante para Header (compacto)
    if (variant === 'header') {
        return (
            <button
                onClick={toggleLanguage}
                className={`flex items-center gap-2 px-3 py-2 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg font-bold transition-all border border-slate-800 group ${className}`}
                title={language === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish'}
            >
                <Languages className="w-4 h-4" />
                <span className="text-xs font-black">{language.toUpperCase()}</span>
            </button>
        );
    }

    // Variante compacta (solo banderas/códigos)
    return (
        <button
            onClick={toggleLanguage}
            className={`flex items-center gap-1 p-2 bg-slate-900/50 hover:bg-slate-800 rounded-lg transition-all border border-slate-800 ${className}`}
            title={language === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish'}
        >
            <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black transition-all ${language === 'es'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-600'
                }`}>
                ES
            </span>
            <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black transition-all ${language === 'en'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-600'
                }`}>
                EN
            </span>
        </button>
    );
};

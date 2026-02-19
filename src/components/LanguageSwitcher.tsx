import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useLocale } from '../i18n/useLocale';

interface LanguageSwitcherProps {
    variant?: 'sidebar' | 'header' | 'compact';
    className?: string;
}

/**
 * LanguageSwitcher deshabilitado (Soporte solo Español).
 * Mantenido para evitar errores de compilación.
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    variant = 'sidebar',
    className = ''
}) => {
    const { language } = useLanguage();
    const { t } = useLocale();

    const tooltip = "Próximamente: Inglés";

    // Variante para Sidebar (botón completo)
    if (variant === 'sidebar') {
        return (
            <div
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-900/20 text-slate-600 rounded-xl font-bold border border-slate-800/50 opacity-50 cursor-not-allowed ${className}`}
                title={tooltip}
            >
                <div className="flex items-center gap-3">
                    <Languages className="w-4 h-4" />
                    <span>{t('common.spanish').toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black bg-blue-600/50 text-white/50">
                        ES
                    </span>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black bg-slate-800 text-slate-700">
                        EN
                    </span>
                </div>
            </div>
        );
    }

    // Variante para Header (compacto)
    if (variant === 'header') {
        return (
            <div
                className={`flex items-center gap-2 px-3 py-2 bg-slate-900/20 text-slate-600 rounded-lg font-bold border border-slate-800/50 opacity-50 cursor-not-allowed ${className}`}
                title={tooltip}
            >
                <Languages className="w-4 h-4" />
                <span className="text-xs font-black">{language.toUpperCase()}</span>
            </div>
        );
    }

    // Variante compacta (solo banderas/códigos)
    return (
        <div
            className={`flex items-center gap-1 p-2 bg-slate-900/20 rounded-lg border border-slate-800/50 opacity-50 cursor-not-allowed ${className}`}
            title={tooltip}
        >
            <span className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black bg-blue-600/50 text-white/50">
                ES
            </span>
            <span className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black bg-slate-800 text-slate-700">
                EN
            </span>
        </div>
    );
};

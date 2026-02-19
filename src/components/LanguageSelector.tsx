import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

/**
 * LanguageSelector deshabilitado (Soporte solo Español).
 * Mantenido para evitar errores de compilación, pero renderiza null o estado inactivo.
 */
export function LanguageSelector() {
    const { language } = useLanguage();

    // El selector está deshabilitado por ahora ya que solo soportamos Español
    return (
        <div
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/20 border border-slate-800/50 opacity-50 cursor-not-allowed"
            title="Próximamente: Inglés"
        >
            <div className="p-1 bg-slate-800 rounded-full">
                <Globe className="w-3 h-3 text-slate-500" />
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                {language === 'es' ? 'ESP' : 'ENG'}
            </span>
        </div>
    );
}

import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'es' ? 'en' : 'es');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/40 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/60 transition-all group"
            title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
            <div className="p-1 bg-slate-800 rounded-full group-hover:bg-blue-500/10 transition-colors">
                <Globe className="w-3 h-3 text-slate-400 group-hover:text-blue-400" />
            </div>
            <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-300 uppercase tracking-widest leading-none">
                {language === 'es' ? 'ESP' : 'ENG'}
            </span>
        </button>
    );
}

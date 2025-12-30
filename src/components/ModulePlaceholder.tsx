import React from 'react';
import { Construction, ArrowRight } from 'lucide-react';

interface ModulePlaceholderProps {
    title: string;
    description?: string;
    features?: string[];
    estimatedDate?: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
    title,
    description = "Este módulo está actualmente en desarrollo activo.",
    features = [],
    estimatedDate
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] p-12 text-center bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative">
            {/* Background Decorative Element */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl"></div>

            <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="relative w-24 h-24 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mb-8 transform group-hover:scale-110 transition-transform duration-500 shadow-xl">
                    <Construction className="w-12 h-12 text-blue-500 animate-pulse" />
                </div>
            </div>

            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">
                {title}
            </h2>

            <p className="text-xl text-slate-400 max-w-2xl mb-12 font-medium leading-relaxed">
                {description}
            </p>

            {features.length > 0 && (
                <div className="bg-slate-900/50 p-8 rounded-3xl max-w-lg w-full mb-10 text-left border border-slate-800 shadow-inner group transition-all hover:bg-slate-900">
                    <h3 className="font-black text-slate-500 mb-6 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        En Hoja de Ruta (Roadmap)
                    </h3>
                    <ul className="space-y-4">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-start text-slate-300 font-bold group/item">
                                <div className="p-1 bg-blue-500/10 rounded-md mr-3 mt-0.5 group-hover/item:bg-blue-500/20 transition-colors">
                                    <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                                </div>
                                <span className="text-sm tracking-tight">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {estimatedDate && (
                <div className="inline-flex items-center gap-2 text-xs font-black text-blue-400 px-6 py-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl uppercase tracking-widest hover:bg-blue-500/10 transition-all cursor-default">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Disponibilidad: {estimatedDate}
                </div>
            )}
        </div>
    );
};

/**
 * HelpCenter.tsx - Centro de Ayuda del Sistema
 * 
 * Muestra las guías de uso y operaciones comunes del sistema.
 * Basado en el contenido de knowledge/SystemKnowledge.ts
 */

import React, { useState } from 'react';
import {
    BookOpen,
    Lightbulb,
    Search,
    ChevronDown,
    ChevronUp,
    FileText,
    HelpCircle,
    ArrowLeft
} from 'lucide-react';
import { SYSTEM_GUIDES, QUICK_OPERATIONS, FAQ } from '../knowledge/SystemKnowledge';

interface HelpCenterProps {
    // Props opcionales si se necesitan
}

export const HelpCenter: React.FC<HelpCenterProps> = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

    // NEW: Active Guide View mode (for immediate visibility)
    const [viewingGuide, setViewingGuide] = useState<string | null>(null);

    // Filtrar guías
    const filteredGuides = Object.entries(SYSTEM_GUIDES).filter(([_, guide]) => {
        const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guide.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guide.steps.some(step => step.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory ? guide.category === selectedCategory : true;

        return matchesSearch && matchesCategory;
    });

    const formatGuideContent = (guide: typeof SYSTEM_GUIDES[string]) => {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-2xl font-black tracking-tight text-white mb-2">{guide.title}</h2>
                    <p className="text-slate-400 mb-6 text-lg">{guide.description}</p>

                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800">
                        <h4 className="text-sm font-semibold text-blue-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Pasos a seguir
                        </h4>
                        <ol className="relative space-y-6 pl-2">
                            {guide.steps.map((step, idx) => (
                                <li key={idx} className="pl-6 relative border-l-2 border-slate-800 last:border-0 pb-1">
                                    <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-800 border-2 border-blue-500/50 flex items-center justify-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    </span>
                                    <p className="text-slate-200 text-base leading-relaxed">{step}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                {guide.tips && guide.tips.length > 0 && (
                    <div className="bg-emerald-900/10 p-6 rounded-2xl border border-emerald-500/20 shadow-lg">
                        <h4 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5" />
                            Tips Profesionales
                        </h4>
                        <ul className="space-y-3">
                            {guide.tips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-3 bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/10">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                                    <span className="text-slate-200 text-sm leading-relaxed">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-4 justify-end">
                    <span className="font-semibold">Ruta del sistema:</span>
                    <code className="bg-slate-800 px-3 py-1 rounded-md text-blue-300 font-mono border border-slate-700">{guide.relatedMenu}</code>
                </div>
            </div>
        );
    };

    // Main Render Logic
    const activeGuideData = viewingGuide ? SYSTEM_GUIDES[viewingGuide] : null;

    if (activeGuideData && viewingGuide) {
        return (
            <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center gap-4 bg-slate-900/30">
                    <button
                        onClick={() => setViewingGuide(null)}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white">Guía del Sistema</h1>
                        <p className="text-slate-400 text-xs">Volver al centro de ayuda</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        {formatGuideContent(activeGuideData)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/20">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white tracking-tight">Centro de Ayuda</h1>
                        <p className="text-slate-400 text-sm mt-1">Documentación oficial y guías paso a paso del sistema</p>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar guías (ej: factura, reporte, cliente)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                        <button
                            onClick={() => {
                                setSelectedCategory(null);
                                setSearchTerm('');
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap ${!selectedCategory
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                                }`}
                        >
                            Inicio
                        </button>
                        {['ventas', 'compras', 'inventario', 'contabilidad', 'impuestos', 'sistema'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap ${selectedCategory === cat
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                {/* Quick Operations (Only show if no search/filter active) */}
                {!searchTerm && !selectedCategory && (
                    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-400" />
                            Accesos Directos
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {QUICK_OPERATIONS.map((op, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        const guideEntry = Object.entries(SYSTEM_GUIDES).find(([key]) => key === op.guide);
                                        if (guideEntry) {
                                            setViewingGuide(op.guide); // OPEN IMMEDIATELY
                                        }
                                    }}
                                    className="bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/30 p-4 rounded-xl text-center group transition-all"
                                >
                                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">{op.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Guides List */}
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Guías Disponibles
                </h2>

                <div className="space-y-4">
                    {filteredGuides.length > 0 ? (
                        filteredGuides.map(([key, guide]) => (
                            <div
                                key={key}
                                className={`bg-slate-900 border rounded-xl overflow-hidden transition-all duration-300 border-slate-800 hover:border-slate-700`}
                            >
                                <button
                                    onClick={() => setViewingGuide(key)} // OPEN IMMEDIATELY
                                    className="w-full flex items-center justify-between p-4 text-left group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 rounded-lg mt-0.5 bg-slate-800 text-slate-500 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-base text-slate-200 group-hover:text-white transition-colors">
                                                {guide.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm mt-0.5">{guide.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
                                        <ChevronDown className="w-5 h-5 -rotate-90" />
                                    </div>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                            <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium">No se encontraron guías</p>
                            <p className="text-slate-600 text-sm mt-1">Intenta con otros términos de búsqueda</p>
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}
                                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </div>

                {/* FAQ Section */}
                <div className="mt-12 mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-purple-400" />
                        Preguntas Frecuentes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {FAQ.map((item, idx) => (
                            <div key={idx} className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl hover:bg-slate-900 transition-colors">
                                <h4 className="font-semibold text-slate-200 mb-2">{item.question}</h4>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

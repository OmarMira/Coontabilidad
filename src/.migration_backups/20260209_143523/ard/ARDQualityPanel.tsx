import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, BarChart3, Star, Info, AlertTriangle, TrendingUp, Gem } from 'lucide-react';
import { getARDCustomerSummary } from '../../database/simple-db';
import { calculateCustomerQuality, QualityScore } from '../../modules/ard/ARDQualityScorer';
import { ARDCustomerSummary } from '../../modules/ard/ARD.types';

interface ARDCustomerQuality extends ARDCustomerSummary {
    quality: QualityScore;
}

export const ARDQualityPanel: React.FC = () => {
    const [customerQualities, setCustomerQualities] = useState<ARDCustomerQuality[]>([]);

    useEffect(() => {
        const summaries = getARDCustomerSummary();
        const withScores = summaries.map(s => ({
            ...s,
            quality: calculateCustomerQuality(s)
        })).sort((a, b) => b.quality.score - a.quality.score);

        setCustomerQualities(withScores);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Header Section */}
            <div className="flex items-center justify-between p-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-[40px] relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-amber-500/20 rounded-3xl border border-amber-500/30">
                        <Gem className="w-10 h-10 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">Análisis de Calidad PRO</h3>
                        <p className="text-amber-200/60 font-medium text-sm">Motor de Scoring Inteligente basado en comportamiento documental y financiero.</p>
                    </div>
                </div>
                <div className="hidden md:flex flex-col items-end relative z-10">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Algoritmo Activo</span>
                    <div className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] text-amber-400 font-black uppercase">
                        SCS_CORE_V2.5
                    </div>
                </div>
                <Star className="absolute -right-12 -top-12 w-64 h-64 text-amber-500/5 rotate-12" />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {customerQualities.map((item) => (
                    <div key={item.id} className="card-elite !p-0 overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
                        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">

                            {/* Profile & Main Score */}
                            <div className="lg:w-1/3 p-8 flex flex-col items-center justify-center text-center bg-white/[0.01]">
                                <div className="relative mb-6">
                                    {/* Circular Score Visual */}
                                    <div className="w-32 h-32 rounded-full border-4 border-white/5 flex flex-col items-center justify-center relative">
                                        <div
                                            className={`absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent transition-all duration-1000 rotate-45 ${item.quality.color.replace('text', 'border')}`}
                                            style={{ transform: `rotate(${item.quality.score * 3.6}deg)` }}
                                        ></div>
                                        <span className="text-4xl font-black text-white tabular-nums">{item.quality.score}%</span>
                                        <span className="text-[10px] font-black text-gray-500 uppercase">Score</span>
                                    </div>
                                    <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-lg bg-slate-900 border border-white/10 font-black text-lg ${item.quality.color}`}>
                                        {item.quality.rating}
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tight mb-1">{item.name}</h4>
                                <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${item.quality.color}`}>
                                    {item.quality.label}
                                </div>
                            </div>

                            {/* Metrics Breakdown */}
                            <div className="flex-1 p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                                {[
                                    { label: 'Precisión IA', val: item.quality.metrics.precision, icon: ShieldCheck, color: 'text-emerald-400' },
                                    { label: 'Velocidad Ef.', val: item.quality.metrics.speed, icon: Zap, color: 'text-indigo-400' },
                                    { label: 'Volumen Oper.', val: item.quality.metrics.volume, icon: BarChart3, color: 'text-amber-400' },
                                    { label: 'Consistencia', val: item.quality.metrics.consistency, icon: TrendingUp, color: 'text-rose-400' },
                                ].map((metric, i) => (
                                    <div key={i} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <metric.icon className={`w-4 h-4 ${metric.color}`} />
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{metric.label}</span>
                                        </div>
                                        <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 delay-300 ${metric.color.replace('text', 'bg')}`}
                                                style={{ width: `${metric.val}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs font-black text-white/80">{metric.val}%</div>
                                    </div>
                                ))}
                            </div>

                            {/* Recommendations */}
                            <div className="lg:w-1/4 p-8 bg-white/[0.02] flex flex-col justify-center">
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Recomendación IA</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                        {item.quality.score > 80
                                            ? "Mantenga este flujo operativo para calificar para beneficios fiscales avanzados y auditoría simplificada."
                                            : "Se recomienda reducir el tiempo entre digitalización y cobro para mejorar el Score de Velocidad Operativa."}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                ))}

                {customerQualities.length === 0 && (
                    <div className="py-20 text-center card-elite border-dashed border-2 border-white/5 opacity-50">
                        <AlertTriangle className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-xs">No hay datos suficientes para generar Calidad PRO</p>
                        <p className="text-gray-600 text-[10px] font-bold mt-2 italic">Procese al menos 1 documento y asigne un cliente para iniciar el motor.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

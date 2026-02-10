import React from 'react';
import { Rocket, Target, Zap, Shield, Cpu, Globe, CheckCircle2, Circle, Clock } from 'lucide-react';

export const ARDRoadmap: React.FC = () => {
    const steps = [
        {
            phase: 'Fase 4',
            title: 'Digitalización & Conversión',
            description: 'Generación de PDFs forenses y conversión automática a Ventas/Cobros.',
            status: 'completed',
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10'
        },
        {
            phase: 'Fase 5',
            title: 'Integración CORE',
            description: 'Sincronización con Contabilidad Central e Inventario Dinámico.',
            status: 'current',
            icon: Target,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10'
        },
        {
            phase: 'Fase 6',
            title: 'Conciliación Smart AI',
            description: 'Motor de matching automático entre banco y documentos registrados.',
            status: 'upcoming',
            icon: Cpu,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10'
        },
        {
            phase: 'Fase 7',
            title: 'Cumplimiento Multijurisdiccional',
            description: 'Adaptación automática a regulaciones de otros estados y países.',
            status: 'upcoming',
            icon: Globe,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10'
        },
        {
            phase: 'Fase 8',
            title: 'AccountExpress Mobile ARD',
            description: 'App nativa para escaneo en el punto de venta con procesamiento local.',
            status: 'upcoming',
            icon: Rocket,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center gap-6 p-10 bg-indigo-600/5 border border-indigo-500/20 rounded-[40px] relative overflow-hidden">
                <div className="p-5 bg-indigo-600/20 rounded-3xl border border-indigo-500/30 relative z-10">
                    <Rocket className="w-10 h-10 text-indigo-400 animate-pulse" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Hoja de Ruta: ARD Evolution</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">Plan de despliegue para el motor de inteligencia documental más avanzado de Florida.</p>
                </div>
                <Zap className="absolute -right-20 -top-20 w-80 h-80 text-white/5 rotate-45" />
            </div>

            <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                {steps.map((step, i) => (
                    <div key={i} className="relative group">
                        {/* Dot / Icon */}
                        <div className={`absolute -left-[41px] p-2 rounded-full border-4 border-slate-950 z-10 transition-transform duration-500 group-hover:scale-110 ${step.status === 'completed' ? 'bg-emerald-500 text-slate-950' : step.status === 'current' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                            {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : step.status === 'current' ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>

                        {/* Card */}
                        <div className={`card-elite relative overflow-hidden transition-all duration-500 ${step.status === 'current' ? 'border-indigo-500/40 bg-indigo-500/[0.03]' : 'hover:border-white/10'}`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className={`text-[10px] font-black uppercase tracking-[0.3em] ${step.color}`}>
                                        {step.phase} — {step.status === 'completed' ? 'Finalizada' : step.status === 'current' ? 'En Desarrollo' : 'Próximamente'}
                                    </div>
                                    <h4 className="text-xl font-black text-white uppercase tracking-tight">{step.title}</h4>
                                    <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-2xl">{step.description}</p>
                                </div>

                                <div className={`hidden md:flex p-6 rounded-3xl ${step.bg}`}>
                                    <step.icon className={`w-12 h-12 ${step.color} opacity-40`} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 text-center">
                <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">
                    ¿Tienes una idea para la siguiente fase? Contacta al equipo de desarrollo de AccountExpress.
                </p>
                <div className="mt-4 flex justify-center gap-4">
                    <span className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[9px] font-black text-indigo-400 uppercase">Prioridad: Cliente-Driven</span>
                    <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase">Updates: Semanales</span>
                </div>
            </div>
        </div>
    );
};

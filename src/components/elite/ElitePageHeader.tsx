import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface ElitePageHeaderProps {
    /** Icono principal del header */
    icon: LucideIcon;
    /** Color del icono (emerald, blue, purple, amber, rose) */
    iconColor?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
    /** Título principal de la página */
    title: string;
    /** Subtítulo descriptivo */
    subtitle: string;
    /** Acciones/botones a mostrar en el lado derecho */
    actions?: ReactNode;
    /** Color del glow effect (emerald, blue, purple, amber, rose) */
    glowColor?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
}

const colorMap = {
    emerald: {
        icon: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        glow: 'bg-emerald-500/5'
    },
    blue: {
        icon: 'text-blue-400',
        bg: 'bg-blue-500/10',
        glow: 'bg-blue-500/5'
    },
    purple: {
        icon: 'text-purple-400',
        bg: 'bg-purple-500/10',
        glow: 'bg-purple-500/5'
    },
    amber: {
        icon: 'text-amber-400',
        bg: 'bg-amber-500/10',
        glow: 'bg-amber-500/5'
    },
    rose: {
        icon: 'text-rose-400',
        bg: 'bg-rose-500/10',
        glow: 'bg-rose-500/5'
    }
};

/**
 * ElitePageHeader
 * 
 * Componente de header estandarizado para todas las páginas del sistema.
 * Incluye glow effect, icono, título, subtítulo y acciones.
 * 
 * @example
 * ```tsx
 * <ElitePageHeader
 *   icon={Package}
 *   iconColor="emerald"
 *   title="Gestión de Activos"
 *   subtitle="Administración y Depreciación"
 *   actions={
 *     <button className="btn-elite-primary">
 *       <Plus className="w-4 h-4" />
 *       Nuevo Activo
 *     </button>
 *   }
 * />
 * ```
 */
export const ElitePageHeader: React.FC<ElitePageHeaderProps> = ({
    icon: Icon,
    iconColor = 'emerald',
    title,
    subtitle,
    actions,
    glowColor = 'emerald'
}) => {
    const colors = colorMap[iconColor];
    const glowColors = colorMap[glowColor];

    return (
        <div className="relative mb-8">
            {/* Glow Effect */}
            <div className={`absolute top-0 right-0 w-96 h-96 ${glowColors.glow} blur-[100px] -mr-32 -mt-32 pointer-events-none`}></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-3 ${colors.bg} rounded-2xl`}>
                                <Icon className={`w-7 h-7 ${colors.icon}`} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight">
                                    {title}
                                </h1>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                                    {subtitle}
                                </p>
                            </div>
                        </div>
                    </div>

                    {actions && (
                        <div className="flex items-center gap-3">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

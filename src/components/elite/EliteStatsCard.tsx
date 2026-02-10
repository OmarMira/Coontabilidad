import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EliteStatsCardProps {
    /** Icono del stat */
    icon: LucideIcon;
    /** Color del icono (emerald, blue, purple, amber, rose) */
    iconColor?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
    /** Label superior del stat */
    label: string;
    /** Valor principal (número o texto) */
    value: string | number;
    /** Color del valor (white, emerald, blue, purple, amber, rose) */
    valueColor?: 'white' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
    /** Descripción inferior */
    description: string;
    /** Contenido adicional opcional */
    children?: ReactNode;
    /** Clase CSS adicional */
    className?: string;
}

const iconColorMap = {
    emerald: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400'
    },
    blue: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400'
    },
    purple: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400'
    },
    amber: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400'
    },
    rose: {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400'
    }
};

const valueColorMap = {
    white: 'text-white',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400'
};

/**
 * EliteStatsCard
 * 
 * Componente de tarjeta de estadísticas estandarizado.
 * Incluye icono, label, valor grande, y descripción.
 * 
 * @example
 * ```tsx
 * <EliteStatsCard
 *   icon={DollarSign}
 *   iconColor="blue"
 *   label="Total"
 *   value="$1,234.56"
 *   valueColor="emerald"
 *   description="Costo de Adquisición"
 * />
 * ```
 */
export const EliteStatsCard: React.FC<EliteStatsCardProps> = ({
    icon: Icon,
    iconColor = 'blue',
    label,
    value,
    valueColor = 'white',
    description,
    children,
    className = ''
}) => {
    const iconColors = iconColorMap[iconColor];
    const valueColorClass = valueColorMap[valueColor];

    return (
        <div className={`card-elite ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${iconColors.bg} rounded-2xl`}>
                    <Icon className={`w-6 h-6 ${iconColors.text}`} />
                </div>
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                    {label}
                </span>
            </div>

            <p className={`text-3xl font-black ${valueColorClass} tabular-nums`}>
                {value}
            </p>

            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">
                {description}
            </p>

            {children && (
                <div className="mt-4">
                    {children}
                </div>
            )}
        </div>
    );
};

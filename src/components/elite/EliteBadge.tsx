import React, { ReactNode } from 'react';

interface EliteBadgeProps {
    /** Contenido del badge */
    children: ReactNode;
    /** Variante de color */
    variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'purple';
    /** Tamaño del badge */
    size?: 'sm' | 'md' | 'lg';
    /** Mostrar punto animado */
    showDot?: boolean;
    /** Clase CSS adicional */
    className?: string;
}

const variantMap = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
};

const dotColorMap = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-500',
    purple: 'bg-purple-500'
};

const sizeMap = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
};

/**
 * EliteBadge
 * 
 * Componente de badge estandarizado.
 * Incluye múltiples variantes de color, tamaños, y punto animado opcional.
 * 
 * @example
 * ```tsx
 * <EliteBadge variant="success" showDot>
 *   ACTIVO
 * </EliteBadge>
 * 
 * <EliteBadge variant="error" size="lg">
 *   VENCIDO
 * </EliteBadge>
 * ```
 */
export const EliteBadge: React.FC<EliteBadgeProps> = ({
    children,
    variant = 'neutral',
    size = 'md',
    showDot = false,
    className = ''
}) => {
    const variantClass = variantMap[variant];
    const sizeClass = sizeMap[size];
    const dotColor = dotColorMap[variant];

    return (
        <span className={`inline-flex items-center gap-2 font-bold uppercase tracking-widest rounded-lg border ${variantClass} ${sizeClass} ${className}`}>
            {showDot && (
                <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></span>
            )}
            {children}
        </span>
    );
};

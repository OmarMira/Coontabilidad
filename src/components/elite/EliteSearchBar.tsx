import React from 'react';
import { Search } from 'lucide-react';

interface EliteSearchBarProps {
    /** Valor actual del input */
    value: string;
    /** Función que se ejecuta al cambiar el valor */
    onChange: (value: string) => void;
    /** Placeholder del input */
    placeholder?: string;
    /** Clase CSS adicional */
    className?: string;
}

/**
 * EliteSearchBar
 * 
 * Componente de barra de búsqueda estandarizado.
 * Incluye icono de búsqueda y estilos elite.
 * 
 * @example
 * ```tsx
 * <EliteSearchBar
 *   value={searchTerm}
 *   onChange={setSearchTerm}
 *   placeholder="Buscar por nombre o código..."
 * />
 * ```
 */
export const EliteSearchBar: React.FC<EliteSearchBarProps> = ({
    value,
    onChange,
    placeholder = 'Buscar...',
    className = ''
}) => {
    return (
        <div className={`card-elite ${className}`}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
                />
            </div>
        </div>
    );
};

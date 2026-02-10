import React, { ReactNode } from 'react';

interface EliteTableColumn {
    /** Clave única de la columna */
    key: string;
    /** Texto del header */
    header: string;
    /** Alineación del contenido */
    align?: 'left' | 'center' | 'right';
    /** Ancho fijo (opcional) */
    width?: string;
    /** Renderizador personalizado para las celdas */
    render?: (value: any, row: any) => ReactNode;
}

interface EliteTableProps {
    /** Definición de columnas */
    columns: EliteTableColumn[];
    /** Datos a mostrar */
    data: any[];
    /** Función que se ejecuta al hacer click en una fila */
    onRowClick?: (row: any) => void;
    /** Mensaje cuando no hay datos */
    emptyMessage?: string;
    /** Icono para el estado vacío */
    emptyIcon?: ReactNode;
    /** Estado de carga */
    loading?: boolean;
    /** Mensaje de carga */
    loadingMessage?: string;
    /** Clase CSS adicional para la tabla */
    className?: string;
}

/**
 * EliteTable
 * 
 * Componente de tabla estandarizado con headers elite.
 * Incluye estados de loading y empty, hover effects, y renderizado personalizado.
 * 
 * @example
 * ```tsx
 * <EliteTable
 *   columns={[
 *     { key: 'id', header: 'ID', width: '80px' },
 *     { key: 'name', header: 'Nombre', align: 'left' },
 *     { key: 'amount', header: 'Monto', align: 'right', render: (val) => `$${val}` }
 *   ]}
 *   data={items}
 *   onRowClick={(row) => console.log(row)}
 *   emptyMessage="No hay registros"
 * />
 * ```
 */
export const EliteTable: React.FC<EliteTableProps> = ({
    columns,
    data,
    onRowClick,
    emptyMessage = 'No hay datos disponibles',
    emptyIcon,
    loading = false,
    loadingMessage = 'Cargando...',
    className = ''
}) => {
    const getAlignClass = (align?: string) => {
        switch (align) {
            case 'center': return 'text-center';
            case 'right': return 'text-right';
            default: return 'text-left';
        }
    };

    return (
        <div className={`card-elite !p-0 overflow-hidden ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ${getAlignClass(column.align)}`}
                                    style={{ width: column.width }}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm text-slate-400 font-bold">{loadingMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        {emptyIcon || (
                                            <div className="p-4 bg-white/5 rounded-2xl">
                                                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                </svg>
                                            </div>
                                        )}
                                        <p className="text-sm text-slate-400 font-bold">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => (
                                <tr
                                    key={index}
                                    className={`border-b border-white/5 hover:bg-white/5 transition-all group ${onRowClick ? 'cursor-pointer' : ''}`}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`p-4 ${getAlignClass(column.align)}`}
                                        >
                                            {column.render ? (
                                                column.render(row[column.key], row)
                                            ) : (
                                                <span className="text-sm text-white font-medium">
                                                    {row[column.key]}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

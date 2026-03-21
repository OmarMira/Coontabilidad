import { logger } from '../../core/logging/SystemLogger';
import React, { useEffect, useState } from 'react';
import { getUserRoles } from '@/database/modules/db-users';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

export const RolesDiagnostic: React.FC = () => {
    const [roles, setRoles] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const availableRoles = getUserRoles();
            logger.info('RolesDiagnostic', 'info', 'ðŸ” DiagnÃ³stico de Roles:', availableRoles);
            setRoles(availableRoles);
        } catch (err) {
            logger.error('RolesDiagnostic', 'error', 'âŒ Error cargando roles:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        }
    }, []);

    return (
        <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl max-w-md z-50">
            <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-bold">DiagnÃ³stico de Roles</h3>
            </div>

            {error ? (
                <div className="flex items-start gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Error:</p>
                        <p>{error}</p>
                    </div>
                </div>
            ) : roles.length === 0 ? (
                <div className="flex items-start gap-2 text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">No hay roles en la base de datos</p>
                        <p className="mt-2 text-slate-400">SoluciÃ³n:</p>
                        <ol className="list-decimal list-inside mt-1 text-slate-400">
                            <li>Abre DevTools (F12)</li>
                            <li>Application â†’ Storage â†’ Clear site data</li>
                            <li>Recarga la pÃ¡gina (Ctrl+Shift+R)</li>
                        </ol>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold">{roles.length} roles encontrados</span>
                    </div>
                    <div className="space-y-1">
                        {roles.map((role) => (
                            <div key={role.id} className="text-sm text-slate-300 pl-6">
                                â€¢ {role.name} (nivel {role.level})
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

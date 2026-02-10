import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, Shield, Plus, Lock } from 'lucide-react';

export const UserRoleManager: React.FC = () => {
    const [roles, setRoles] = useState([
        { id: 1, name: 'Administrador', users: 1, permissions: ['all'] },
        { id: 2, name: 'Contador', users: 2, permissions: ['accounting.*', 'reports.*'] },
        { id: 3, name: 'Ventas', users: 4, permissions: ['invoices.*', 'customers.*'] },
    ]);

    return (
        <Card className="bg-gray-900 border-gray-800 text-white w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-400" />
                    Gestión de Usuarios y Roles
                </CardTitle>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Rol
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map(role => (
                        <div key={role.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-blue-900/30 rounded-full">
                                    <Shield className="w-5 h-5 text-blue-400" />
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Lock className="w-4 h-4 text-gray-500" />
                                </Button>
                            </div>
                            <h3 className="font-bold text-lg">{role.name}</h3>
                            <p className="text-gray-400 text-sm mt-1">{role.users} {role.users === 1 ? 'Usuario Asignado' : 'Usuarios Asignados'}</p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {role.permissions.map((p, i) => (
                                    <span key={i} className="text-xs bg-gray-900 px-2 py-1 rounded border border-gray-700 font-mono text-gray-300">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

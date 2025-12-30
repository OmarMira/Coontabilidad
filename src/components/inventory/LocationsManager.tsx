import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Store, Box, Archive } from 'lucide-react';

export const LocationsManager: React.FC = () => {
    // Mock locations
    const locations = [
        { id: 1, name: 'Main Warehouse', type: 'warehouse', address: '123 Ind. Blvd' },
        { id: 2, name: 'Miami Store', type: 'store', address: '456 Ocean Dr' },
        { id: 3, name: 'Back Room Shelf A', type: 'shelf', address: 'Zone B' },
    ];

    return (
        <Card className="bg-gray-900 border-gray-800 text-white w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    Gestión de Ubicaciones
                </CardTitle>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Ubicación
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    {locations.map(loc => (
                        <div key={loc.id} className="flex items-center justify-between p-4 bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                                    {loc.type === 'warehouse' && <Box className="w-5 h-5 text-gray-400" />}
                                    {loc.type === 'store' && <Store className="w-5 h-5 text-blue-400" />}
                                    {loc.type === 'shelf' && <Archive className="w-5 h-5 text-orange-400" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{loc.name}</h4>
                                    <p className="text-xs text-gray-400">{loc.address}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs border uppercase ${loc.type === 'warehouse' ? 'bg-gray-700 border-gray-600 text-gray-300' :
                                        loc.type === 'store' ? 'bg-blue-900/30 border-blue-900 text-blue-300' :
                                            'bg-orange-900/30 border-orange-900 text-orange-300'
                                    }`}>
                                    {loc.type}
                                </span>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Editar</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

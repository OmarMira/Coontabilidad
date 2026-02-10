import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Store, Box, Archive, Save, X } from 'lucide-react';
import { getLocations, createLocation } from '@/database/simple-db';
import { toast } from 'react-hot-toast';

export const LocationsManager: React.FC = () => {
    const [locations, setLocations] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newLocation, setNewLocation] = useState({
        name: '',
        code: '',
        address: '',
        type: 'warehouse', // warehouse, store, shelf
        description: ''
    });

    const loadLocations = () => {
        try {
            const data = getLocations();
            setLocations(data);
        } catch (error) {
            console.error('Error loading locations:', error);
            toast.error('Error al cargar ubicaciones');
        }
    };

    useEffect(() => {
        loadLocations();
    }, []);

    const handleSave = () => {
        if (!newLocation.name || !newLocation.code) {
            toast.error('Nombre y Código son requeridos');
            return;
        }

        const result = createLocation({
            name: newLocation.name,
            code: newLocation.code,
            address: newLocation.address,
            description: newLocation.description,
            is_active: true
        });

        if (result.success) {
            toast.success('Ubicación creada exitosamente');
            setIsCreating(false);
            setNewLocation({ name: '', code: '', address: '', type: 'warehouse', description: '' });
            loadLocations();
        } else {
            toast.error('Error: ' + result.message);
        }
    };

    return (
        <Card className="bg-gray-900 border-gray-800 text-white w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-800">
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    Gestión de Ubicaciones
                </CardTitle>
                {!isCreating && (
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsCreating(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Ubicación
                    </Button>
                )}
            </CardHeader>
            <CardContent className="pt-4">
                {isCreating && (
                    <div className="mb-6 p-4 bg-gray-800/50 border border-purple-500/30 rounded-lg animate-in fade-in slide-in-from-top-2">
                        <h3 className="text-sm font-bold text-purple-300 mb-4 uppercase tracking-wider">Nueva Ubicación</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Nombre</label>
                                <input
                                    className="w-full bg-gray-900 border-gray-700 rounded p-2 text-white focus:border-purple-500 outline-none"
                                    value={newLocation.name}
                                    onChange={e => setNewLocation({ ...newLocation, name: e.target.value })}
                                    placeholder="Ej. Almacén Central"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Código (Único)</label>
                                <input
                                    className="w-full bg-gray-900 border-gray-700 rounded p-2 text-white focus:border-purple-500 outline-none font-mono"
                                    value={newLocation.code}
                                    onChange={e => setNewLocation({ ...newLocation, code: e.target.value.toUpperCase() })}
                                    placeholder="Ej. WH-MIA-01"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-400 block mb-1">Dirección</label>
                                <input
                                    className="w-full bg-gray-900 border-gray-700 rounded p-2 text-white focus:border-purple-500 outline-none"
                                    value={newLocation.address}
                                    onChange={e => setNewLocation({ ...newLocation, address: e.target.value })}
                                    placeholder="Dirección física..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-400 block mb-1">Descripción</label>
                                <input
                                    className="w-full bg-gray-900 border-gray-700 rounded p-2 text-white focus:border-purple-500 outline-none"
                                    value={newLocation.description}
                                    onChange={e => setNewLocation({ ...newLocation, description: e.target.value })}
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                                <X className="w-4 h-4 mr-2" /> Cancelar
                            </Button>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={handleSave}>
                                <Save className="w-4 h-4 mr-2" /> Guardar Ubicación
                            </Button>
                        </div>
                    </div>
                )}

                <div className="grid gap-3">
                    {locations.length === 0 ? (
                        <div className="text-center p-8 text-gray-500 bg-gray-800/20 rounded border border-gray-800 border-dashed">
                            No hay ubicaciones registradas.
                        </div>
                    ) : (
                        locations.map(loc => (
                            <div key={loc.id} className="flex items-center justify-between p-4 bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center group-hover:bg-purple-900/30 group-hover:text-purple-400 transition-colors">
                                        <Box className="w-5 h-5 text-gray-400 group-hover:text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-white">{loc.name}</h4>
                                            <span className="text-xs font-mono bg-black/30 px-1.5 rounded text-gray-400">{loc.code}</span>
                                        </div>
                                        <p className="text-xs text-gray-400">{loc.address || 'Sin dirección'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs border uppercase ${'bg-gray-700 border-gray-600 text-gray-300'
                                        }`}>
                                        ACTIVO
                                    </span>
                                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Editar</Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

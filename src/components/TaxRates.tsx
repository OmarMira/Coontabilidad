import React, { useState, useEffect } from 'react';
import { MapPin, Save, Plus, Trash2, AlertCircle } from 'lucide-react';

interface CountyTaxRate {
    id: string;
    county: string;
    surtaxRate: number; // Discretionary Sales Surtax (e.g., 0.01 for 1%)
    active: boolean;
}

// Initial data based on common Florida counties
const INITIAL_RATES: CountyTaxRate[] = [
    { id: '1', county: 'Miami-Dade', surtaxRate: 0.01, active: true },
    { id: '2', county: 'Broward', surtaxRate: 0.02, active: true }, // Verified common rate
    { id: '3', county: 'Palm Beach', surtaxRate: 0.01, active: true },
    { id: '4', county: 'Orange', surtaxRate: 0.005, active: true },
    { id: '5', county: 'Hillsborough', surtaxRate: 0.025, active: true },
];

export const TaxRates: React.FC = () => {
    const [rates, setRates] = useState<CountyTaxRate[]>(INITIAL_RATES);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newRate, setNewRate] = useState<number>(0);

    const handleRateChange = (id: string, newRate: number) => {
        setRates(rates.map(r => r.id === id ? { ...r, surtaxRate: newRate } : r));
    };

    const toggleActive = (id: string) => {
        setRates(rates.map(r => r.id === id ? { ...r, active: !r.active } : r));
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-blue-600" />
                            Tasas por Condado (Florida Discretionary Sales Surtax)
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Configure las tasas discrecionales de sus condados de operación. La tasa base de Florida es 6.0%.
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold border-b dark:border-gray-700">Condado</th>
                                <th className="p-4 font-semibold border-b dark:border-gray-700">Tasa Base (State)</th>
                                <th className="p-4 font-semibold border-b dark:border-gray-700">Surtax (Condado)</th>
                                <th className="p-4 font-semibold border-b dark:border-gray-700">Total Impuesto</th>
                                <th className="p-4 font-semibold border-b dark:border-gray-700 text-center">Estado</th>
                                <th className="p-4 font-semibold border-b dark:border-gray-700 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {rates.map((rate) => (
                                <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="p-4 font-medium text-gray-800 dark:text-white">
                                        {rate.county}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                        6.00%
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="5"
                                                value={(rate.surtaxRate * 100).toFixed(2)}
                                                onChange={(e) => handleRateChange(rate.id, parseFloat(e.target.value) / 100)}
                                                className="w-20 px-2 py-1 text-right border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                            <span className="text-gray-500">%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-blue-600 dark:text-blue-400">
                                        {((0.06 + rate.surtaxRate) * 100).toFixed(2)}%
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => toggleActive(rate.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${rate.active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                                }`}
                                        >
                                            {rate.active ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/10 text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>
                        <strong>Nota Importante:</strong> Las tasas de Surtax pueden variar por condado y están sujetas a límites (generalmente aplicables a los primeros $5,000 de una venta única de propiedad personal tangible). Asegúrese de verificar las tasas vigentes con el Departamento de Ingresos de Florida.
                    </p>
                </div>
            </div>
        </div>
    );
};

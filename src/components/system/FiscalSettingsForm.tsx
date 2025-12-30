import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, AlertTriangle } from 'lucide-react';
import { type FiscalSettings } from '../../modules/system/System.types';

export const FiscalSettingsForm: React.FC = () => {
    const [settings, setSettings] = useState<FiscalSettings>({
        tax_year_start: '2025-01-01',
        tax_frequency: 'monthly',
        sales_tax_method: 'accrual',
        default_tax_rate: 0.06,
        dr15_filing_day: 20,
        active: true
    });

    return (
        <Card className="bg-gray-900 border-gray-800 text-white w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-orange-400" />
                    Configuración Fiscal
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-orange-900/20 p-3 rounded border border-orange-800/50 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-300">
                        Estos ajustes afectan el cálculo automático de impuestos y los reportes regulatorios (DR-15). Cambie con precaución.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">Inicio Año Fiscal</label>
                        <input
                            type="date"
                            className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white"
                            value={settings.tax_year_start}
                            onChange={(e) => setSettings({ ...settings, tax_year_start: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">Frecuencia Declaración</label>
                        <select
                            className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white"
                            value={settings.tax_frequency}
                            onChange={(e) => setSettings({ ...settings, tax_frequency: e.target.value as any })}
                        >
                            <option value="monthly">Mensual</option>
                            <option value="quarterly">Trimestral</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                        <div>
                            <p className="text-sm font-medium">Método de Impuesto sobre Venta</p>
                            <p className="text-xs text-gray-500">Accrual (Devengado) vs Cash (Efectivo)</p>
                        </div>
                        <select
                            className="bg-gray-800 border-gray-700 rounded p-1 text-sm text-white"
                            value={settings.sales_tax_method}
                            onChange={(e) => setSettings({ ...settings, sales_tax_method: e.target.value as any })}
                        >
                            <option value="accrual">Devengado (Accrual)</option>
                            <option value="cash">Efectivo (Cash)</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                        <div>
                            <p className="text-sm font-medium">Día de Corte DR-15</p>
                            <p className="text-xs text-gray-500">Día del mes siguiente para declarar sin mora</p>
                        </div>
                        <input
                            type="number"
                            className="w-16 bg-gray-800 border-gray-700 rounded p-1 text-center text-white"
                            value={settings.dr15_filing_day}
                            onChange={(e) => setSettings({ ...settings, dr15_filing_day: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Guardar Configuración
                </Button>
            </CardContent>
        </Card>
    );
};

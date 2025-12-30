import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Save, Globe } from 'lucide-react';
import { type CompanyInfo } from '../../modules/system/System.types';

export const CompanyInfoForm: React.FC = () => {
    const [info, setInfo] = useState<CompanyInfo>({
        name: 'Account Express LLC',
        tax_id: '12-3456789',
        address: '123 Business Rd',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
        currency_code: 'USD',
        email: 'info@accountexpress.com',
        phone: '305-555-0101'
    });

    const handleChange = (f: keyof CompanyInfo, v: string) => setInfo({ ...info, [f]: v });

    return (
        <Card className="bg-gray-900 border-gray-800 text-white w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-400" />
                    Información de la Empresa
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-6">
                    <div className="w-32 h-32 bg-gray-800 rounded flex items-center justify-center border border-gray-700">
                        <span className="text-gray-500 text-xs text-center p-2">Click para subir Logo</span>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Nombre Legal</label>
                                <input className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" value={info.name} onChange={e => handleChange('name', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Tax ID / EIN</label>
                                <input className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" value={info.tax_id} onChange={e => handleChange('tax_id', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">Dirección</label>
                            <input className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" value={info.address} onChange={e => handleChange('address', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Ciudad</label>
                                <input className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" value={info.city} onChange={e => handleChange('city', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Estado</label>
                                <input className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" value={info.state} onChange={e => handleChange('state', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Código Postal</label>
                                <input className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" value={info.zip} onChange={e => handleChange('zip', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-4 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">Email Contacto</label>
                        <input className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" value={info.email} onChange={e => handleChange('email', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">Moneda Base</label>
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-500" />
                            <select className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" value={info.currency_code} onChange={e => handleChange('currency_code', e.target.value)}>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

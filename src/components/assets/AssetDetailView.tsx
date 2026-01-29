import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    Edit,
    Calendar,
    DollarSign,
    TrendingDown,
    Package,
    MapPin,
    Hash,
    Building2,
    FileText,
    AlertCircle
} from 'lucide-react';
import {
    FixedAsset,
    AssetCategory,
    AssetDepreciation,
    getAssetDepreciations
} from '../../database/simple-db';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface AssetDetailViewProps {
    asset: FixedAsset;
    category?: AssetCategory;
    onEdit: () => void;
    onBack: () => void;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({ asset, category, onEdit, onBack }) => {
    const [depreciations, setDepreciations] = useState<AssetDepreciation[]>([]);

    useEffect(() => {
        if (asset.id) {
            setDepreciations(getAssetDepreciations(asset.id));
        }
    }, [asset.id]);

    const netBookValue = (asset.current_value || asset.acquisition_cost) - (asset.accumulated_depreciation || 0);
    const depreciationRate = category?.default_depreciation_rate || 0;
    const monthlyDepreciation = asset.useful_life_months > 0
        ? (asset.acquisition_cost - (asset.salvage_value || 0)) / asset.useful_life_months
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-all font-bold"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Volver a Activos
                </button>
                <Button
                    onClick={onEdit}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black"
                >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Activo
                </Button>
            </div>

            {/* Asset Header */}
            <Card className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 border-slate-800">
                <CardContent className="p-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-blue-400 font-mono text-sm mb-2">{asset.asset_code}</p>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-1">{asset.name}</h2>
                            <p className="text-slate-400 text-sm">{category?.name || 'Sin categoría'}</p>
                            {asset.description && (
                                <p className="text-slate-500 text-sm mt-3 max-w-2xl">{asset.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {asset.status === 'active' && (
                                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase">
                                    Activo
                                </span>
                            )}
                            {asset.status === 'disposed' && (
                                <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black uppercase">
                                    Dado de Baja
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Financial Summary */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Costo Original</span>
                                    <DollarSign className="w-5 h-5 text-indigo-400" />
                                </div>
                                <p className="text-2xl font-black text-white">${asset.acquisition_cost.toLocaleString()}</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Depreciación Acum.</span>
                                    <TrendingDown className="w-5 h-5 text-rose-400" />
                                </div>
                                <p className="text-2xl font-black text-rose-400">-${(asset.accumulated_depreciation || 0).toLocaleString()}</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800 border-t-4 border-emerald-500">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor en Libros</span>
                                    <Building2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <p className="text-2xl font-black text-emerald-400">${netBookValue.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Depreciation History */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                Historial de Depreciación
                            </h3>

                            {depreciations.length === 0 ? (
                                <div className="py-8 text-center">
                                    <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                                    <p className="text-slate-600 font-bold">No se han registrado depreciaciones para este activo.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {depreciations.map((dep, idx) => (
                                        <div key={dep.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-white mb-1">
                                                        Período: {new Date(dep.period_date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[10px] text-slate-600 font-mono">
                                                        Acumulado: ${dep.accumulated_depreciation.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-mono text-rose-400">-${dep.depreciation_amount.toLocaleString()}</p>
                                                    <p className="text-[10px] text-emerald-400 font-mono">NBV: ${dep.net_book_value.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Asset Details */}
                <div className="space-y-6">
                    {/* Acquisition Info */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Información de Adquisición</h3>

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Fecha de Compra</p>
                                <p className="text-white font-bold flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-400" />
                                    {new Date(asset.acquisition_date).toLocaleDateString('es-ES')}
                                </p>
                            </div>

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Vida Útil</p>
                                <p className="text-white font-bold">{asset.useful_life_years} años ({asset.useful_life_months} meses)</p>
                            </div>

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Valor de Salvamento</p>
                                <p className="text-white font-bold">${(asset.salvage_value || 0).toLocaleString()}</p>
                            </div>

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Depreciación Mensual</p>
                                <p className="text-rose-400 font-bold font-mono">-${monthlyDepreciation.toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Physical Details */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Detalles Físicos</h3>

                            {asset.location && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Ubicación</p>
                                    <p className="text-white font-bold flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-400" />
                                        {asset.location}
                                    </p>
                                </div>
                            )}

                            {asset.serial_number && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Número de Serie</p>
                                    <p className="text-white font-bold font-mono flex items-center gap-2">
                                        <Hash className="w-4 h-4 text-blue-400" />
                                        {asset.serial_number}
                                    </p>
                                </div>
                            )}

                            {asset.manufacturer && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Fabricante</p>
                                    <p className="text-white font-bold">{asset.manufacturer}</p>
                                </div>
                            )}

                            {asset.model && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Modelo</p>
                                    <p className="text-white font-bold">{asset.model}</p>
                                </div>
                            )}

                            {asset.purchase_order && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Orden de Compra</p>
                                    <p className="text-blue-400 font-bold font-mono">{asset.purchase_order}</p>
                                </div>
                            )}

                            {asset.warranty_expiration && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Garantía hasta</p>
                                    <p className="text-white font-bold">
                                        {new Date(asset.warranty_expiration).toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {asset.notes && (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="p-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3">Notas</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{asset.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

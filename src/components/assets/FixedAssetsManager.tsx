import React, { useState, useEffect } from 'react';
import {
    Building2,
    Plus,
    Search,
    Filter,
    Package,
    Edit,
    Trash2,
    Calendar,
    DollarSign,
    TrendingDown,
    Info,
    ChevronRight,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import {
    FixedAsset,
    AssetCategory,
    getFixedAssets,
    getAssetCategories,
    createFixedAsset,
    updateFixedAsset,
    calculateMonthlyDepreciation
} from '../../database/simple-db';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { AssetForm } from './AssetForm';
import { AssetDetailView } from './AssetDetailView';

type ViewMode = 'list' | 'form' | 'detail';

export const FixedAssetsManager: React.FC = () => {
    const { user } = useAuth();
    const [assets, setAssets] = useState<FixedAsset[]>([]);
    const [categories, setCategories] = useState<AssetCategory[]>([]);
    const [filteredAssets, setFilteredAssets] = useState<FixedAsset[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
    const [isProcessingDepreciation, setIsProcessingDepreciation] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [assets, searchTerm, filterStatus, filterCategory]);

    const loadData = () => {
        const allAssets = getFixedAssets();
        setAssets(allAssets);
        setCategories(getAssetCategories());
    };

    const applyFilters = () => {
        let filtered = [...assets];

        // Filtro por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.serial_number && a.serial_number.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Filtro por estado
        if (filterStatus !== 'all') {
            filtered = filtered.filter(a => a.status === filterStatus);
        }

        // Filtro por categoría
        if (filterCategory !== 'all') {
            filtered = filtered.filter(a => a.category_id === parseInt(filterCategory));
        }

        setFilteredAssets(filtered);
    };

    const handleCreateAsset = () => {
        setSelectedAsset(null);
        setViewMode('form');
    };

    const handleEditAsset = (asset: FixedAsset) => {
        setSelectedAsset(asset);
        setViewMode('form');
    };

    const handleViewAsset = (asset: FixedAsset) => {
        setSelectedAsset(asset);
        setViewMode('detail');
    };

    const handleSaveAsset = (assetData: Partial<FixedAsset>) => {
        if (!user) return;

        if (selectedAsset?.id) {
            // Actualizar
            const res = updateFixedAsset(selectedAsset.id, assetData);
            if (res.success) {
                toast.success('Activo actualizado');
                loadData();
                setViewMode('list');
            } else {
                toast.error(res.message);
            }
        } else {
            // Crear nuevo
            const res = createFixedAsset(assetData, user.id);
            if (res.success) {
                toast.success(res.message);
                loadData();
                setViewMode('list');
            } else {
                toast.error(res.message);
            }
        }
    };

    const handleCalculateDepreciation = async () => {
        if (!user) return;
        setIsProcessingDepreciation(true);

        // Usar el primer día del mes actual
        const today = new Date();
        const periodDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

        const res = calculateMonthlyDepreciation(periodDate, user.id);
        setIsProcessingDepreciation(false);

        if (res.success) {
            toast.success(res.message);
            loadData();
        } else {
            toast.error(res.message);
        }
    };

    const getCategoryName = (categoryId: number) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name || 'Sin categoría';
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            active: { label: 'Activo', color: 'emerald' },
            disposed: { label: 'Dado de Baja', color: 'red' },
            fully_depreciated: { label: 'Depreciado 100%', color: 'amber' },
            under_maintenance: { label: 'En Mantenimiento', color: 'blue' }
        };
        const badge = badges[status as keyof typeof badges] || { label: status, color: 'slate' };

        return (
            <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-${badge.color}-500/10 border border-${badge.color}-500/20 text-${badge.color}-400`}>
                {badge.label}
            </span>
        );
    };

    // Calcular métricas
    const totalValue = assets.reduce((sum, a) => sum + (a.current_value || a.acquisition_cost), 0);
    const totalDepreciation = assets.reduce((sum, a) => sum + (a.accumulated_depreciation || 0), 0);
    const netBookValue = totalValue - totalDepreciation;
    const activeAssets = assets.filter(a => a.status === 'active').length;

    if (viewMode === 'form') {
        return (
            <AssetForm
                asset={selectedAsset}
                categories={categories}
                onSave={handleSaveAsset}
                onCancel={() => setViewMode('list')}
            />
        );
    }

    if (viewMode === 'detail' && selectedAsset) {
        return (
            <AssetDetailView
                asset={selectedAsset}
                category={categories.find(c => c.id === selectedAsset.category_id)}
                onEdit={() => setViewMode('form')}
                onBack={() => setViewMode('list')}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Building2 className="w-8 h-8 text-indigo-500" />
                        Activos Fijos
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                        Gestión de Propiedades, Planta y Equipo
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handleCalculateDepreciation}
                        disabled={isProcessingDepreciation || activeAssets === 0}
                        variant="outline"
                        className="border-slate-800 text-slate-400 hover:text-white font-bold"
                    >
                        <TrendingDown className="w-4 h-4 mr-2" />
                        {isProcessingDepreciation ? 'Calculando...' : 'Calcular Depreciación'}
                    </Button>
                    <Button
                        onClick={handleCreateAsset}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Activo
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Activos</span>
                            <Package className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-3xl font-black text-white">{assets.length}</p>
                        <p className="text-xs text-emerald-400 font-bold mt-1">{activeAssets} activos</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Original</span>
                            <DollarSign className="w-5 h-5 text-indigo-400" />
                        </div>
                        <p className="text-3xl font-black text-white">${totalValue.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 font-bold mt-1">Costo de adquisición</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Depreciación Acumulada</span>
                            <TrendingDown className="w-5 h-5 text-rose-400" />
                        </div>
                        <p className="text-3xl font-black text-rose-400">-${totalDepreciation.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 font-bold mt-1">Total depreciado</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 border-t-4 border-emerald-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor en Libros</span>
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <p className="text-3xl font-black text-emerald-400">${netBookValue.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 font-bold mt-1">Valor neto actual</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, código o serie..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        {/* Filter by Status */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-8 py-3 text-white focus:border-indigo-500 outline-none appearance-none"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="active">Activos</option>
                                <option value="disposed">Dados de baja</option>
                                <option value="fully_depreciated">Depreciados 100%</option>
                                <option value="under_maintenance">En mantenimiento</option>
                            </select>
                        </div>

                        {/* Filter by Category */}
                        <div className="relative">
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-8 py-3 text-white focus:border-indigo-500 outline-none appearance-none"
                            >
                                <option value="all">Todas las categorías</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assets Table */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                            <tr>
                                <th className="px-6 py-4 text-left">Código / Nombre</th>
                                <th className="px-6 py-4 text-left">Categoría</th>
                                <th className="px-6 py-4 text-right">Costo Adquisición</th>
                                <th className="px-6 py-4 text-right">Depreciación</th>
                                <th className="px-6 py-4 text-right">Valor Neto</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Package className="w-12 h-12 text-slate-700" />
                                            <p className="text-slate-600 font-bold">
                                                {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
                                                    ? 'No se encontraron activos con los filtros aplicados'
                                                    : 'No hay activos registrados. Haz clic en "Nuevo Activo" para comenzar.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAssets.map(asset => {
                                    const netValue = (asset.current_value || asset.acquisition_cost) - (asset.accumulated_depreciation || 0);

                                    return (
                                        <tr key={asset.id} className="hover:bg-white/[0.01] transition-all">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-blue-400 font-mono text-xs mb-1">{asset.asset_code}</p>
                                                    <p className="text-white font-bold">{asset.name}</p>
                                                    {asset.serial_number && (
                                                        <p className="text-[10px] text-slate-600 font-mono mt-1">S/N: {asset.serial_number}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-400 text-xs">{getCategoryName(asset.category_id)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-white">
                                                ${asset.acquisition_cost.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-rose-400">
                                                -${(asset.accumulated_depreciation || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">
                                                ${netValue.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(asset.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewAsset(asset)}
                                                        className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-all"
                                                    >
                                                        <Info className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditAsset(asset)}
                                                        className="p-2 hover:bg-indigo-500/10 text-indigo-400 rounded-lg transition-all"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};

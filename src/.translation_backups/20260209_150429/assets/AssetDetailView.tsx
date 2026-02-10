import React, { useState, useEffect } from 'react';
import {
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/database/simple-db';
import { getFixedAssetsController } from '@/services/accounting/fixed-assets';
import type { FixedAsset, AssetCategory, DepreciationEntry } from '@/services/accounting/fixed-assets';

interface AssetDetailViewProps {
  asset: FixedAsset;
  onBack: () => void;
  onEdit: (asset: FixedAsset) => void;
  onDispose: (asset: FixedAsset) => void;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({
  asset,
  onBack,
  onEdit,
  onDispose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'depreciation' | 'history'>('overview');
  const [category, setCategory] = useState<AssetCategory | null>(null);
  const [depreciationHistory, setDepreciationHistory] = useState<DepreciationEntry[]>([]);
  const [depreciationSchedule, setDepreciationSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssetDetails();
  }, [asset.id]);

  const loadAssetDetails = async () => {
    try {
      setLoading(true);
      const controller = getFixedAssetsController(db);

      // Load category
      const cat = await controller.getCategoryById(asset.category_id);
      setCategory(cat);

      // Load depreciation history
      const history = await controller.getDepreciationHistory(asset.id);
      setDepreciationHistory(history);

      // Load depreciation schedule (future projections)
      if (asset.status === 'ACTIVE') {
        const schedule = await controller.getDepreciationSchedule(asset.id);
        setDepreciationSchedule(schedule);
      }

    } catch (error) {
      console.error('Error loading asset details:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Resumen', icon: Package },
    { id: 'depreciation' as const, label: 'Depreciación', icon: TrendingDown },
    { id: 'history' as const, label: 'Historial', icon: FileText }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'PENDING':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';
      case 'FULLY_DEPRECIATED':
        return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
      case 'DISPOSED':
        return 'bg-slate-700 text-slate-400 border-slate-600';
      default:
        return 'bg-slate-700 text-slate-400 border-slate-600';
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-400" />
              {asset.asset_name}
            </h1>
            <p className="text-slate-400 mt-1">
              Tag: <span className="font-mono text-blue-400">{asset.asset_tag}</span>
              {category && <span className="ml-4">Categoría: {category.name}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {asset.status !== 'DISPOSED' && (
            <>
              <Button
                onClick={() => onEdit(asset)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={() => onDispose(asset)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Disponer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <span className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(asset.status)}`}>
          {asset.status}
        </span>
        {asset.status === 'DISPOSED' && asset.disposal_date && (
          <span className="text-slate-400 text-sm">
            Dispuesto el {formatDate(asset.disposal_date)}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Information */}
            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Información del Activo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Nombre:</span>
                  <span className="font-medium">{asset.asset_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Tag:</span>
                  <span className="font-mono text-blue-400">{asset.asset_tag}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Categoría:</span>
                  <span>{category?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Descripción:</span>
                  <span className="text-right">{asset.description || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Fecha de Compra:</span>
                  <span>{formatDate(asset.purchase_date)}</span>
                </div>
                {asset.start_depreciation_date && (
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Inicio Depreciación:</span>
                    <span>{formatDate(asset.start_depreciation_date)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Información Financiera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Costo de Compra:</span>
                  <span className="font-mono text-blue-400">{formatCurrency(asset.purchase_cost)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Valor de Salvamento:</span>
                  <span className="font-mono">{formatCurrency(asset.salvage_value)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Depreciación Acumulada:</span>
                  <span className="font-mono text-amber-400">
                    {formatCurrency(asset.total_accumulated_depreciation)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Valor en Libros:</span>
                  <span className="font-mono text-green-400 text-lg font-bold">
                    {formatCurrency(asset.net_book_value || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Método de Depreciación:</span>
                  <span className="text-sm">{asset.depreciation_method}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Vida Útil:</span>
                  <span>{asset.useful_life_months} meses</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'depreciation' && (
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-400" />
                Historial de Depreciación
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-400">Cargando...</div>
              ) : depreciationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400">No hay historial de depreciación</p>
                  {asset.status === 'PENDING' && (
                    <p className="text-sm text-slate-500 mt-2">
                      El activo debe ser activado para comenzar la depreciación
                    </p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Período</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Depreciación</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Acumulada</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Valor en Libros</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Parcial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {depreciationHistory.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-sm">{formatDate(entry.period_date)}</td>
                          <td className="py-3 px-4 text-sm text-right font-mono text-amber-400">
                            {formatCurrency(entry.depreciation_amount)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-mono">
                            {formatCurrency(entry.accumulated_depreciation)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-mono text-green-400">
                            {formatCurrency(entry.net_book_value)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {entry.is_partial_month && (
                              <span className="px-2 py-1 rounded text-xs bg-yellow-900/30 text-yellow-400">
                                Parcial
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Future Schedule */}
              {asset.status === 'ACTIVE' && depreciationSchedule.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-black tracking-tight text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Proyección Futura
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Período</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Depreciación Estimada</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Acumulada Proyectada</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Valor Proyectado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depreciationSchedule.slice(0, 12).map((entry, idx) => (
                          <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="py-3 px-4 text-sm text-slate-400">{entry.period}</td>
                            <td className="py-3 px-4 text-sm text-right font-mono text-slate-400">
                              {formatCurrency(entry.depreciation_amount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-mono text-slate-400">
                              {formatCurrency(entry.accumulated_depreciation)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-mono text-slate-400">
                              {formatCurrency(entry.net_book_value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'history' && (
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Historial de Transacciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Purchase Entry */}
                <div className="p-4 border border-slate-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white">Compra de Activo</h4>
                      <p className="text-sm text-slate-400 mt-1">
                        {formatDate(asset.purchase_date)}
                      </p>
                    </div>
                    <span className="font-mono text-blue-400">{formatCurrency(asset.purchase_cost)}</span>
                  </div>
                  {asset.purchase_entry_id && (
                    <p className="text-xs text-slate-500 mt-2">
                      Journal Entry ID: {asset.purchase_entry_id}
                    </p>
                  )}
                </div>

                {/* Activation */}
                {asset.start_depreciation_date && (
                  <div className="p-4 border border-slate-800 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">Activación</h4>
                        <p className="text-sm text-slate-400 mt-1">
                          {formatDate(asset.start_depreciation_date)}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs bg-green-900/30 text-green-400">
                        Depreciación Iniciada
                      </span>
                    </div>
                  </div>
                )}

                {/* Disposal */}
                {asset.status === 'DISPOSED' && asset.disposal_date && (
                  <div className="p-4 border border-slate-800 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">Disposición</h4>
                        <p className="text-sm text-slate-400 mt-1">
                          {formatDate(asset.disposal_date)} • {asset.disposal_method}
                        </p>
                      </div>
                      {asset.disposal_amount && (
                        <span className="font-mono text-slate-400">
                          {formatCurrency(asset.disposal_amount)}
                        </span>
                      )}
                    </div>
                    {asset.disposal_entry_id && (
                      <p className="text-xs text-slate-500 mt-2">
                        Journal Entry ID: {asset.disposal_entry_id}
                      </p>
                    )}
                  </div>
                )}

                {depreciationHistory.length === 0 && !asset.disposal_date && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400">No hay transacciones adicionales</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Package,
  Plus,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  Play,
  FileText,
  Settings
} from 'lucide-react';
import { getFixedAssetsController } from '@/services/accounting/fixed-assets';
import type { FixedAsset, AssetCategory } from '@/services/accounting/fixed-assets';
import { AssetForm } from './AssetForm';
import { AssetDetailView } from './AssetDetailView';
import { AssetDisposalForm } from './AssetDisposalForm';
import { AssetRegisterReport } from './reports/AssetRegisterReport';
import { DepreciationScheduleReport } from './reports/DepreciationScheduleReport';
import { DisposalSummaryReport } from './reports/DisposalSummaryReport';
import { useLocale } from '@/i18n/useLocale';

interface FixedAssetsManagerProps {
  db: any; // Database instance passed from App
}

/**
 * FixedAssetsManager
 * 
 * Main dashboard for Fixed Assets module with:
 * - Asset summary KPIs
 * - Asset list with filters
 * - Quick actions (Add Asset, Run Depreciation, Reports)
 * - Category management
 */
export const FixedAssetsManager: React.FC<FixedAssetsManagerProps> = ({ db }) => {
  const { t } = useLocale();
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [summary, setSummary] = useState({
    total_assets: 0,
    active_assets: 0,
    total_cost: 0,
    total_depreciation: 0,
    net_book_value: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assets' | 'categories' | 'reports'>('assets');
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<FixedAsset | null>(null);
  const [disposingAsset, setDisposingAsset] = useState<FixedAsset | null>(null);
  const [activeReport, setActiveReport] = useState<'register' | 'schedule' | 'disposals' | null>(null);

  useEffect(() => {
    if (db) {
      loadData();
    }
  }, [db]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = getFixedAssetsController(db);

      // Load assets and categories
      const [assetsData, categoriesData, summaryData] = await Promise.all([
        controller.getAllAssets(),
        controller.getCategories(),
        controller.getAssetSummary()
      ]);

      setAssets(assetsData);
      setCategories(categoriesData);
      setSummary(summaryData);

    } catch (err) {
      console.error('Error loading fixed assets:', err);
      setError(err instanceof Error ? err.message : t('fixedAssets.loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleRunDepreciation = async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = getFixedAssetsController(db);
      const now = new Date();

      const result = await controller.runDepreciationBatch(now);

      setSuccess(`Depreciación procesada: ${result.total_assets_processed} activos, Total: ${(result.total_depreciation_amount / 100).toFixed(2)}`);

      // Reload data
      await loadData();

      setTimeout(() => setSuccess(null), 5000);

    } catch (err) {
      console.error('Error running depreciation:', err);
      setError(err instanceof Error ? err.message : t('fixedAssets.messages.depreciationError'));
    } finally {
      setLoading(false);
    }
  };

  // View asset detail
  if (viewingAsset) {
    return (
      <AssetDetailView
        asset={viewingAsset}
        onBack={() => setViewingAsset(null)}
        onEdit={(asset) => {
          setViewingAsset(null);
          setEditingAsset(asset);
          setShowAssetForm(true);
        }}
        onDispose={(asset) => {
          setViewingAsset(null);
          setDisposingAsset(asset);
        }}
      />
    );
  }

  if (loading && assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">{t('fixedAssets.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-400" />
            {t('fixedAssets.management')}
          </h1>
          <p className="text-slate-400 mt-1">{t('fixedAssets.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleRunDepreciation}
            disabled={loading || assets.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            {t('fixedAssets.runDepreciation')}
          </Button>
          <Button
            onClick={() => {
              setEditingAsset(null);
              setShowAssetForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('fixedAssets.newAsset')}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="bg-red-950/20 border-red-900/50 text-red-200">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-950/20 border-green-900/50 text-green-200">
          <AlertTitle>{t('common.success')}</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {t('fixedAssets.totalCost')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-blue-400 font-mono">
              ${(summary.total_cost / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t('fixedAssets.acquisitionCost')}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              {t('fixedAssets.accumulatedDepreciation')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-amber-400 font-mono">
              ${(summary.total_depreciation / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t('fixedAssets.totalDepreciated')}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Package className="w-4 h-4" />
              {t('fixedAssets.bookValue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-green-400 font-mono">
              ${(summary.net_book_value / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t('fixedAssets.netBookValue')}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('fixedAssets.activeAssets')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-200">
              {summary.active_assets}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t('fixedAssets.inDepreciation')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'assets'
            ? 'text-blue-400 border-b-2 border-blue-400'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          {t('fixedAssets.assetList')}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'categories'
            ? 'text-blue-400 border-b-2 border-blue-400'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          {t('fixedAssets.categories')}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'reports'
            ? 'text-blue-400 border-b-2 border-blue-400'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          {t('common.reports')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'assets' && (
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
              <CardTitle>{t('fixedAssets.assetList')}</CardTitle>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">{t('fixedAssets.noAssets')}</p>
                  <Button
                    onClick={() => {
                      setEditingAsset(null);
                      setShowAssetForm(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('fixedAssets.addAsset')}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Tag</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">{t('common.name')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">{t('common.category')}</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">{t('common.cost')}</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">{t('fixedAssets.accumulatedDepreciation')}</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">{t('fixedAssets.netValue')}</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => (
                        <tr
                          key={asset.id}
                          onClick={() => setViewingAsset(asset)}
                          className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 text-sm font-mono text-blue-400">{asset.asset_code}</td>
                          <td className="py-3 px-4 text-sm">{asset.name}</td>
                          <td className="py-3 px-4 text-sm text-slate-400">
                            {categories.find(c => c.id === asset.category_id)?.name || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-mono">
                            ${((asset.acquisition_cost || 0) / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-mono text-amber-400">
                            ${((asset.total_accumulated_depreciation || 0) / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-mono text-green-400">
                            ${((asset.net_book_value || 0) / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${asset.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' :
                              asset.status === 'FULLY_DEPRECIATED' ? 'bg-blue-900/30 text-blue-400' :
                                'bg-slate-700 text-slate-400'
                              }`}>
                              {asset.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'categories' && (
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
              <CardTitle>{t('fixedAssets.categories')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="p-4 border border-slate-800 rounded-lg hover:border-blue-500/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-white">{category.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{category.code}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${category.is_active ? 'bg-green-900/30 text-green-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                        {category.is_active ? t('fixedAssets.active') : t('fixedAssets.inactive')}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t('fixedAssets.method')}:</span>
                        <span className="text-slate-200">{category.default_depreciation_method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t('fixedAssets.usefulLife')}:</span>
                        <span className="text-slate-200">{category.default_useful_life_months} {t('fixedAssets.months')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t('fixedAssets.assetAccount')}:</span>
                        <span className="text-slate-200 font-mono">{category.gl_asset_account}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'reports' && (
          <Card className="bg-slate-900 border-slate-800 text-white">
            <CardHeader>
              <CardTitle>{t('common.reports')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveReport('register')}
                  className="p-6 border border-slate-800 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/50 transition-all text-left"
                >
                  <FileText className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="font-medium text-white mb-1">{t('fixedAssets.assetRegister')}</h3>
                  <p className="text-sm text-slate-400">{t('fixedAssets.reports.fullList')}</p>
                </button>
                <button
                  onClick={() => setActiveReport('schedule')}
                  className="p-6 border border-slate-800 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/50 transition-all text-left"
                >
                  <Calendar className="w-8 h-8 text-amber-400 mb-3" />
                  <h3 className="font-medium text-white mb-1">{t('fixedAssets.depreciationSchedule')}</h3>
                  <p className="text-sm text-slate-400">{t('fixedAssets.reports.monthlyProjection')}</p>
                </button>
                <button
                  onClick={() => setActiveReport('disposals')}
                  className="p-6 border border-slate-800 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/50 transition-all text-left"
                >
                  <TrendingDown className="w-8 h-8 text-green-400 mb-3" />
                  <h3 className="font-medium text-white mb-1">{t('fixedAssets.disposalSummary')}</h3>
                  <p className="text-sm text-slate-400">{t('fixedAssets.reports.soldOrDisposed')}</p>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Asset Form Modal */}
      {showAssetForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <AssetForm
                asset={editingAsset}
                onSave={async () => {
                  setShowAssetForm(false);
                  setEditingAsset(null);
                  await loadData();
                  setSuccess(editingAsset ? t('fixedAssets.messages.updateSuccess') : t('fixedAssets.messages.createSuccess'));
                  setTimeout(() => setSuccess(null), 3000);
                }}
                onCancel={() => {
                  setShowAssetForm(false);
                  setEditingAsset(null);
                }}
                db={db}
              />
            </div>
          </div>
        </div>
      )}

      {/* Asset Disposal Modal */}
      {disposingAsset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <AssetDisposalForm
                asset={disposingAsset}
                onDispose={async () => {
                  setDisposingAsset(null);
                  await loadData();
                  setSuccess(t('fixedAssets.messages.disposeSuccess'));
                  setTimeout(() => setSuccess(null), 3000);
                }}
                onCancel={() => setDisposingAsset(null)}
                db={db}
              />
            </div>
          </div>
        </div>
      )}

      {/* Report Modals */}
      {activeReport === 'register' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <AssetRegisterReport
              db={db}
              onClose={() => setActiveReport(null)}
            />
          </div>
        </div>
      )}

      {activeReport === 'schedule' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <DepreciationScheduleReport
              db={db}
              onClose={() => setActiveReport(null)}
            />
          </div>
        </div>
      )}

      {activeReport === 'disposals' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <DisposalSummaryReport
              db={db}
              onClose={() => setActiveReport(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

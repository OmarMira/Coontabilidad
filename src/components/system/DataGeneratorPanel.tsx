import React, { useState } from 'react';
import { Database, Trash2, Play, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { generateMassiveTestData, clearAllTestData } from '@/database/seeding/MassiveDataGenerator';
import { initDB } from '@/database/simple-db';
import { DatabaseService } from '@/database/DatabaseService';

export const DataGeneratorPanel: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [config, setConfig] = useState({
    customers: 30,
    suppliers: 20,
    products: 100,
    invoices: 50,
    bills: 50,
    quotes: 30,
    employees: 15,
    bankAccounts: 5
  });

  const handleGenerate = async () => {
    if (!confirm('¿Generar datos de prueba masivos? Esto puede tomar unos segundos.')) {
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      // Ensure database is initialized
      const db = await initDB();
      DatabaseService.setDB(db);
      
      const result = await generateMassiveTestData(config);
      setResult(result);
      
      if (result.success) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message,
        stats: {}
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS los datos de prueba. ¿Continuar?')) {
      return;
    }

    if (!confirm('¿Estás COMPLETAMENTE seguro? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      // Ensure database is initialized
      const db = await initDB();
      DatabaseService.setDB(db);
      
      const result = clearAllTestData();
      setResult(result);
      
      if (result.success) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Generador de Datos de Prueba</h2>
            <p className="text-slate-400">Genera datos masivos para testing del sistema</p>
          </div>
        </div>

        {/* Configuración */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Clientes</label>
            <input
              type="number"
              value={config.customers}
              onChange={(e) => setConfig({ ...config, customers: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Proveedores</label>
            <input
              type="number"
              value={config.suppliers}
              onChange={(e) => setConfig({ ...config, suppliers: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Productos</label>
            <input
              type="number"
              value={config.products}
              onChange={(e) => setConfig({ ...config, products: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Facturas Venta</label>
            <input
              type="number"
              value={config.invoices}
              onChange={(e) => setConfig({ ...config, invoices: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Facturas Compra</label>
            <input
              type="number"
              value={config.bills}
              onChange={(e) => setConfig({ ...config, bills: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cotizaciones</label>
            <input
              type="number"
              value={config.quotes}
              onChange={(e) => setConfig({ ...config, quotes: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Empleados</label>
            <input
              type="number"
              value={config.employees}
              onChange={(e) => setConfig({ ...config, employees: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cuentas Bancarias</label>
            <input
              type="number"
              value={config.bankAccounts}
              onChange={(e) => setConfig({ ...config, bankAccounts: Number(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              min="1"
              max="50"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg transition-colors font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Generar Datos
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white rounded-lg transition-colors font-semibold"
          >
            <Trash2 className="w-5 h-5" />
            Limpiar Todo
          </button>
        </div>

        {/* Resultado */}
        {result && (
          <div className={`mt-6 p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-900/20 border-green-500/30' 
              : 'bg-red-900/20 border-red-500/30'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <p className={`font-semibold mb-2 ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                  {result.message}
                </p>
                {result.stats && Object.keys(result.stats).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {Object.entries(result.stats).map(([key, value]) => (
                      <div key={key} className="bg-slate-800/50 p-2 rounded">
                        <p className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-lg font-bold text-white">{value as number}</p>
                      </div>
                    ))}
                  </div>
                )}
                {result.success && (
                  <p className="text-sm text-slate-400 mt-3">
                    La página se recargará automáticamente en 3 segundos...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advertencia */}
      <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-orange-300 font-semibold mb-1">Advertencia</p>
            <p className="text-orange-200/80 text-sm">
              Esta herramienta genera datos de prueba masivos. Los datos generados incluyen:
              clientes, proveedores, productos, facturas, cotizaciones, empleados,
              movimientos de inventario, asientos contables y más. Use "Limpiar Todo" para eliminar
              todos los datos de prueba cuando termine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

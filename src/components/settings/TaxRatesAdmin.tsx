import React, { useEffect, useState } from 'react';
import { dbEngine } from '@/database/simple-db';

interface TaxRate {
  id: number;
  tax_year: number;
  rate_key: string;
  rate_value: number;
  description: string;
}

export const TaxRatesAdmin: React.FC = () => {
  const [rates, setRates] = useState<TaxRate[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!dbEngine) return;
      const result = await dbEngine.select(
        'SELECT * FROM tax_rates_config ORDER BY tax_year DESC, rate_key ASC'
      );
      setRates(result as TaxRate[]);
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Tasas Fiscales por Año</h2>
      <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-300 rounded p-3 mb-4">
        Estas tasas son proyecciones. Actualízalas cuando el IRS publique las tablas oficiales.
      </p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Año</th>
            <th className="border p-2 text-left">Clave</th>
            <th className="border p-2 text-left">Valor</th>
            <th className="border p-2 text-left">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {rates.map(r => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="border p-2">{r.tax_year}</td>
              <td className="border p-2 font-mono text-xs">{r.rate_key}</td>
              <td className="border p-2">{r.rate_value}</td>
              <td className="border p-2 text-gray-600">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaxRatesAdmin;

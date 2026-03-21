import React from 'react';

export const FloridaTaxSummary: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-yellow-50 border border-yellow-400 rounded p-4 mb-6">
        <p className="font-bold text-yellow-800 text-sm">
          RESUMEN FISCAL FLORIDA — DOCUMENTO DE TRABAJO PARA CONTADOR
        </p>
        <p className="text-yellow-700 text-sm mt-1">
          Este documento NO es el formulario DR-15 oficial.
          Presente el DR-15 oficial en: floridarevenue.com
        </p>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Resumen Fiscal Florida — Para Contador
      </h1>
      <p className="text-gray-600">
        Use este resumen para completar el formulario DR-15 oficial con su contador.
      </p>
    </div>
  );
};

export default FloridaTaxSummary;

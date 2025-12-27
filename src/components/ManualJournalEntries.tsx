import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Save, X, AlertCircle, CheckCircle, FileText, Calendar } from 'lucide-react';
import { ChartOfAccount } from '../database/simple-db';

interface JournalEntryLine {
  id: string;
  account_id: number;
  account_code: string;
  account_name: string;
  description: string;
  debit: number;
  credit: number;
}

interface ManualJournalEntry {
  id?: number;
  date: string;
  reference: string;
  description: string;
  lines: JournalEntryLine[];
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
  created_at?: string;
}

interface ManualJournalEntriesProps {
  chartOfAccounts: ChartOfAccount[];
  onEntryCreated: () => void;
}

export const ManualJournalEntries: React.FC<ManualJournalEntriesProps> = ({
  chartOfAccounts,
  onEntryCreated
}) => {
  const [entries, setEntries] = useState<ManualJournalEntry[]>([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<ManualJournalEntry>({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [],
    total_debits: 0,
    total_credits: 0,
    is_balanced: false
  });

  useEffect(() => {
    loadJournalEntries();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [currentEntry.lines]);

  const loadJournalEntries = () => {
    // En una implementación real, esto vendría de la base de datos
    const mockEntries: ManualJournalEntry[] = [];
    setEntries(mockEntries);
  };

  const calculateTotals = () => {
    const totalDebits = currentEntry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredits = currentEntry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    setCurrentEntry(prev => ({
      ...prev,
      total_debits: totalDebits,
      total_credits: totalCredits,
      is_balanced: isBalanced
    }));
  };

  const addNewLine = () => {
    const newLine: JournalEntryLine = {
      id: Date.now().toString(),
      account_id: 0,
      account_code: '',
      account_name: '',
      description: '',
      debit: 0,
      credit: 0
    };

    setCurrentEntry(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }));
  };

  const updateLine = (lineId: string, field: keyof JournalEntryLine, value: any) => {
    setCurrentEntry(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.id === lineId) {
          const updatedLine = { ...line, [field]: value };
          
          // Si se selecciona una cuenta, actualizar código y nombre
          if (field === 'account_id') {
            const account = chartOfAccounts.find(acc => acc.id === parseInt(value));
            if (account) {
              updatedLine.account_code = account.account_code;
              updatedLine.account_name = account.account_name;
            }
          }
          
          // Si se actualiza débito, limpiar crédito y viceversa
          if (field === 'debit' && parseFloat(value) > 0) {
            updatedLine.credit = 0;
          } else if (field === 'credit' && parseFloat(value) > 0) {
            updatedLine.debit = 0;
          }
          
          return updatedLine;
        }
        return line;
      })
    }));
  };

  const removeLine = (lineId: string) => {
    setCurrentEntry(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.id !== lineId)
    }));
  };

  const validateEntry = (): string[] => {
    const errors: string[] = [];

    if (!currentEntry.reference.trim()) {
      errors.push('La referencia es obligatoria');
    }

    if (!currentEntry.description.trim()) {
      errors.push('La descripción es obligatoria');
    }

    if (currentEntry.lines.length < 2) {
      errors.push('Se requieren al menos 2 líneas para un asiento contable');
    }

    currentEntry.lines.forEach((line, index) => {
      if (!line.account_id) {
        errors.push(`Línea ${index + 1}: Debe seleccionar una cuenta`);
      }
      if (!line.description.trim()) {
        errors.push(`Línea ${index + 1}: La descripción es obligatoria`);
      }
      if (line.debit === 0 && line.credit === 0) {
        errors.push(`Línea ${index + 1}: Debe tener un valor en débito o crédito`);
      }
      if (line.debit > 0 && line.credit > 0) {
        errors.push(`Línea ${index + 1}: No puede tener débito y crédito al mismo tiempo`);
      }
    });

    if (!currentEntry.is_balanced) {
      errors.push(`El asiento no está balanceado. Diferencia: $${Math.abs(currentEntry.total_debits - currentEntry.total_credits).toFixed(2)}`);
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateEntry();
    if (errors.length > 0) {
      alert('Errores en el asiento:\n' + errors.join('\n'));
      return;
    }

    setIsLoading(true);
    try {
      const entryToSave: ManualJournalEntry = {
        ...currentEntry,
        id: Date.now(),
        created_at: new Date().toISOString()
      };

      // Aquí iría la lógica para guardar en la base de datos
      // await createJournalEntry(entryToSave);

      setEntries(prev => [...prev, entryToSave]);
      setShowEntryForm(false);
      resetForm();
      onEntryCreated();
    } catch (error) {
      console.error('Error creating journal entry:', error);
      alert('Error al crear el asiento contable');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentEntry({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [],
      total_debits: 0,
      total_credits: 0,
      is_balanced: false
    });
  };

  const getBalanceIndicator = () => {
    if (currentEntry.lines.length === 0) return null;
    
    const difference = Math.abs(currentEntry.total_debits - currentEntry.total_credits);
    
    if (currentEntry.is_balanced) {
      return (
        <div className="flex items-center text-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Asiento Balanceado</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">
            Diferencia: ${difference.toFixed(2)}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Asientos Contables Manuales</h2>
          <p className="text-gray-300">Crea asientos contables con validación de partida doble</p>
        </div>
        <button
          onClick={() => setShowEntryForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Asiento
        </button>
      </div>

      {/* Lista de asientos */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Asientos Registrados</h3>
        </div>
        
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No hay asientos registrados</h3>
            <p className="mt-1 text-sm text-gray-300">
              Comienza creando tu primer asiento contable manual
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Referencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Débitos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Créditos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {entry.reference}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      ${entry.total_debits.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      ${entry.total_credits.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-gray-800 border-gray-700">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white">
                  Nuevo Asiento Contable Manual
                </h3>
                <button
                  onClick={() => setShowEntryForm(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información general */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Fecha
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        value={currentEntry.date}
                        onChange={(e) => setCurrentEntry(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Referencia
                    </label>
                    <input
                      type="text"
                      value={currentEntry.reference}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, reference: e.target.value }))}
                      placeholder="Ej: AST-001"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Estado del Balance
                    </label>
                    <div className="py-2">
                      {getBalanceIndicator()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Descripción General
                  </label>
                  <textarea
                    value={currentEntry.description}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    placeholder="Descripción del asiento contable..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Líneas del asiento */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-white">Líneas del Asiento</h4>
                    <button
                      type="button"
                      onClick={addNewLine}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Línea
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-600 border border-gray-600 rounded-md">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Cuenta
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Descripción
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Débito
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Crédito
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-600">
                        {currentEntry.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-4 py-3">
                              <select
                                value={line.account_id}
                                onChange={(e) => updateLine(line.id, 'account_id', e.target.value)}
                                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              >
                                <option value="">Seleccionar cuenta...</option>
                                {chartOfAccounts.map((account) => (
                                  <option key={account.id} value={account.id}>
                                    {account.account_code} - {account.account_name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={line.description}
                                onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                                placeholder="Descripción de la línea..."
                                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={line.debit || ''}
                                onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={line.credit > 0}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={line.credit || ''}
                                onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={line.debit > 0}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => removeLine(line.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-700">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-sm font-medium text-white">
                            TOTALES:
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-white">
                            ${currentEntry.total_debits.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-white">
                            ${currentEntry.total_credits.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            {getBalanceIndicator()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-600">
                  <button
                    type="button"
                    onClick={() => setShowEntryForm(false)}
                    className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !currentEntry.is_balanced || currentEntry.lines.length < 2}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Guardando...' : 'Guardar Asiento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
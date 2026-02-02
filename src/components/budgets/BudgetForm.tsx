import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, AlertTriangle, Save, X } from 'lucide-react';
import {
  createBudget,
  updateBudget,
  getChartOfAccounts,
  type Budget,
  type BudgetLine
} from '@/database/simple-db';
import { BudgetLineEditor } from './BudgetLineEditor';

interface BudgetFormProps {
  budget: Budget | null;
  onSave: () => void;
  onCancel: () => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({ budget, onSave, onCancel }) => {
  const isEditing = !!budget;

  // Form state
  const [budgetName, setBudgetName] = useState(budget?.budget_name || '');
  const [fiscalYear, setFiscalYear] = useState(budget?.fiscal_year || new Date().getFullYear());
  const [startDate, setStartDate] = useState(budget?.start_date || `${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(budget?.end_date || `${new Date().getFullYear()}-12-31`);
  const [department, setDepartment] = useState(budget?.department || '');
  const [notes, setNotes] = useState(budget?.notes || '');
  const [alertThreshold, setAlertThreshold] = useState(budget?.alert_threshold_percentage || 10);
  
  // Budget lines
  const [lines, setLines] = useState<Partial<BudgetLine>[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Auto-calculate fiscal year from start date
  useEffect(() => {
    if (startDate) {
      const year = new Date(startDate).getFullYear();
      setFiscalYear(year);
    }
  }, [startDate]);

  // Calculate total budget amount
  const totalBudgetAmount = lines.reduce((sum, line) => sum + (line.annual_amount || 0), 0);

  const validate = (): boolean => {
    const errors: string[] = [];

    if (!budgetName.trim()) {
      errors.push('El nombre del presupuesto es requerido');
    }

    if (!startDate) {
      errors.push('La fecha de inicio es requerida');
    }

    if (!endDate) {
      errors.push('La fecha de fin es requerida');
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    if (lines.length === 0) {
      errors.push('Debe agregar al menos una línea de presupuesto');
    }

    // Validate lines
    lines.forEach((line, index) => {
      if (!line.account_number) {
        errors.push(`Línea ${index + 1}: Debe seleccionar una cuenta`);
      }
      if (!line.annual_amount || line.annual_amount <= 0) {
        errors.push(`Línea ${index + 1}: El monto debe ser mayor a 0`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const budgetData = {
        budget_name: budgetName,
        fiscal_year: fiscalYear,
        start_date: startDate,
        end_date: endDate,
        status: 'DRAFT' as const,
        total_budget_amount: totalBudgetAmount,
        department: department || undefined,
        notes: notes || undefined,
        alert_threshold_percentage: alertThreshold,
        created_by: 1 // TODO: Get from auth context
      };

      if (isEditing) {
        const result = updateBudget(budget.id, budgetData, lines as Partial<BudgetLine>[]);
        if (!result.success) {
          throw new Error(result.message);
        }
      } else {
        const result = createBudget(budgetData, lines as Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[]);
        if (!result.success) {
          throw new Error(result.message);
        }
      }

      onSave();
    } catch (err) {
      console.error('Error saving budget:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar presupuesto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Budget Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Presupuesto *
              </label>
              <Input
                type="text"
                value={budgetName}
                onChange={(e) => setBudgetName(e.target.value)}
                placeholder="Ej: Presupuesto Operativo 2026"
                required
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio *
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin *
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            {/* Fiscal Year (auto-calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año Fiscal
              </label>
              <Input
                type="number"
                value={fiscalYear}
                readOnly
                className="bg-gray-50"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <Input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ej: Ventas, Operaciones"
              />
            </div>

            {/* Alert Threshold */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umbral de Alerta (%)
              </label>
              <Input
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                min="0"
                max="100"
                step="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se generará una alerta cuando la varianza exceda este porcentaje
              </p>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas adicionales sobre este presupuesto..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Lines Editor */}
      <BudgetLineEditor
        lines={lines}
        onChange={setLines}
        totalAmount={totalBudgetAmount}
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || lines.length === 0}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Actualizar' : 'Crear'} Presupuesto
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

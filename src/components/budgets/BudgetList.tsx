import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { deleteBudget, type Budget } from '@/database/simple-db';

interface BudgetListProps {
  budgets: Budget[];
  onViewBudget: (budget: Budget) => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: () => void;
  filterStatus: string;
  filterYear: number;
  onFilterStatusChange: (status: string) => void;
  onFilterYearChange: (year: number) => void;
}

export const BudgetList: React.FC<BudgetListProps> = ({
  budgets,
  onViewBudget,
  onEditBudget,
  onDeleteBudget,
  filterStatus,
  filterYear,
  onFilterStatusChange,
  onFilterYearChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filter budgets by search term
  const filteredBudgets = budgets.filter(budget =>
    budget.budget_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (budget.department && budget.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (budget: Budget) => {
    if (!confirm(`¿Está seguro de eliminar el presupuesto "${budget.budget_name}"?`)) {
      return;
    }

    setDeletingId(budget.id);
    try {
      const result = deleteBudget(budget.id);
      if (result.success) {
        onDeleteBudget();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Error al eliminar presupuesto');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: Clock },
      APPROVED: { label: 'Aprobado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      ACTIVE: { label: 'Activo', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      CLOSED: { label: 'Cerrado', color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const badge = badges[status as keyof typeof badges] || badges.DRAFT;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Lista de Presupuestos</CardTitle>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar presupuesto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            {/* Year Filter */}
            <select
              value={filterYear}
              onChange={(e) => onFilterYearChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los años</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="APPROVED">Aprobado</option>
              <option value="ACTIVE">Activo</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredBudgets.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No se encontraron presupuestos</p>
            <p className="text-gray-500 text-sm mt-2">
              {searchTerm || filterStatus || filterYear
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Crea tu primer presupuesto para comenzar'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Año Fiscal</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Período</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Departamento</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Monto Total</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBudgets.map((budget) => (
                  <tr
                    key={budget.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{budget.budget_name}</div>
                      {budget.notes && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{budget.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {budget.fiscal_year}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(budget.start_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                      {' - '}
                      {new Date(budget.end_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {budget.department || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      ${(budget.total_budget_amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(budget.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewBudget(budget)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {budget.status === 'DRAFT' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditBudget(budget)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(budget)}
                              disabled={deletingId === budget.id}
                              title="Eliminar"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results count */}
        {filteredBudgets.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {filteredBudgets.length} de {budgets.length} presupuestos
          </div>
        )}
      </CardContent>
    </Card>
  );
};

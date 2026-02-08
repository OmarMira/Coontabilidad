import React, { useState, useEffect } from 'react';
import { Eye, XCircle, Filter, Calendar, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { payrollProcessor } from '../../services/payroll/PayrollProcessor';
import { getEmployees } from '../../database/simple-db';
import type { Payroll, Employee } from '../../database/simple-db';

interface PayrollReviewProps {
  onViewPaystub?: (payrollId: number) => void;
}

export default function PayrollReview({ onViewPaystub }: PayrollReviewProps) {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filter, setFilter] = useState({
    employeeId: '',
    status: '',
    year: new Date().getFullYear().toString()
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadEmployees();
    loadPayrolls();
  }, [filter, employees.length]); // Re-load when employees change or filter changes

  const loadEmployees = () => {
    try {
      const allEmployees = getEmployees();
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadPayrolls = () => {
    try {
      // Get all payrolls from all employees
      const allPayrolls: Payroll[] = [];

      const targetEmployees = filter.employeeId
        ? employees.filter(e => e.id === parseInt(filter.employeeId))
        : employees;

      targetEmployees.forEach(emp => {
        if (emp.id) {
          const empPayrolls = payrollProcessor.getEmployeePayrolls(
            emp.id,
            filter.year ? parseInt(filter.year) : undefined
          );
          allPayrolls.push(...empPayrolls);
        }
      });

      // Apply status filter
      let filtered = allPayrolls;
      if (filter.status) {
        filtered = filtered.filter(p => p.status === filter.status);
      }

      // Sort by pay date descending
      filtered.sort((a, b) => new Date(b.pay_date).getTime() - new Date(a.pay_date).getTime());

      setPayrolls(filtered);
    } catch (error) {
      console.error('Error loading payrolls:', error);
      setMessage({ type: 'error', text: 'Error loading payrolls' });
    }
  };

  const handleVoidPayroll = (payrollId: number) => {
    if (!confirm('Are you sure you want to void this payroll? This will reverse all YTD totals.')) {
      return;
    }

    try {
      const success = payrollProcessor.voidPayroll(payrollId);

      if (success) {
        setMessage({ type: 'success', text: 'Payroll voided successfully' });
        loadPayrolls();
      } else {
        setMessage({ type: 'error', text: 'Error voiding payroll' });
      }
    } catch (error) {
      console.error('Error voiding payroll:', error);
      setMessage({ type: 'error', text: 'Error voiding payroll' });
    }
  };

  const getEmployeeName = (employeeId: number): string => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-slate-800 text-slate-400 border border-slate-700',
      approved: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50',
      paid: 'bg-blue-900/30 text-blue-400 border border-blue-800/50',
      voided: 'bg-red-900/30 text-red-400 border border-red-800/50'
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[status as keyof typeof colors] || colors.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
          Revisar Nómina
        </h1>
        <p className="text-slate-400 mt-1 text-sm font-bold">Ver y gestionar nóminas procesadas</p>
      </div>

      {message && (
        <div className={`${message.type === 'success'
            ? 'bg-emerald-900/20 border-l-4 border-emerald-500 text-emerald-400'
            : 'bg-red-900/20 border-l-4 border-red-500 text-red-400'
          } p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-bold">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto hover:opacity-70 transition-opacity"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900/50 rounded-xl shadow-xl p-6 border border-slate-800">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-black text-white tracking-tight">Filtros de Búsqueda</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Empleado
            </label>
            <select
              value={filter.employeeId}
              onChange={(e) => setFilter({ ...filter, employeeId: e.target.value })}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            >
              <option value="">Todos los Empleados</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id} className="bg-slate-950">
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Estado
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            >
              <option value="">Todos los Estados</option>
              <option value="draft" className="bg-slate-950">Borrador</option>
              <option value="approved" className="bg-slate-950">Aprobado</option>
              <option value="paid" className="bg-slate-950">Pagado</option>
              <option value="voided" className="bg-slate-950">Anulado</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Año
            </label>
            <select
              value={filter.year}
              onChange={(e) => setFilter({ ...filter, year: e.target.value })}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            >
              <option value="" className="bg-slate-950">Todos los Años</option>
              <option value="2026" className="bg-slate-950">2026</option>
              <option value="2025" className="bg-slate-950">2025</option>
              <option value="2024" className="bg-slate-950">2024</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadPayrolls}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-4 rounded-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Payroll List */}
      <div className="bg-slate-900/50 rounded-xl shadow-xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Empleado
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Periodo de Pago
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Fecha Pago
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Salario Bruto
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Salario Neto
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Estado
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900/30 divide-y divide-slate-800">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold italic">
                    No se encontraron nóminas procesadas
                  </td>
                </tr>
              ) : (
                payrolls.map(payroll => (
                  <tr key={payroll.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">
                        {getEmployeeName(payroll.employee_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(payroll.pay_period_start).toLocaleDateString()} - {new Date(payroll.pay_period_end).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-400">
                      {new Date(payroll.pay_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-300">
                      ${payroll.gross_pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-black text-emerald-400">
                      ${payroll.net_pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(payroll.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => onViewPaystub && payroll.id && onViewPaystub(payroll.id)}
                          className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                          title="Ver Comprobante"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                        {payroll.status === 'draft' && (
                          <button
                            onClick={() => payroll.id && handleVoidPayroll(payroll.id)}
                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                            title="Anular Nómina"
                          >
                            <XCircle className="w-4 h-4" />
                            Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

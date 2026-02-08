import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { payrollProcessor, PayrollInput, PayrollResult } from '../../services/payroll/PayrollProcessor';
import { getEmployees } from '../../database/simple-db';
import type { Employee } from '../../database/simple-db';
import { Calculator, DollarSign, FileText, CheckCircle2, AlertCircle, Calendar, User, ArrowRight, Wallet } from 'lucide-react';

export default function PayrollProcessorUI() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PayrollResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    payPeriodStart: '',
    payPeriodEnd: '',
    payDate: '',
    regularHours: '0',
    overtimeHours: '0',
    bonuses: '0',
    commissions: '0',
    otherDeductions: '0'
  });

  useEffect(() => {
    loadEmployees();
    setDefaultDates();
  }, []);

  const loadEmployees = () => {
    try {
      const allEmployees = getEmployees();
      const activeEmployees = allEmployees.filter(e => e.status === 'active');
      setEmployees(activeEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
      setMessage({ type: 'error', text: 'Error al cargar empleados' });
    }
  };

  const setDefaultDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFormData(prev => ({
      ...prev,
      payPeriodStart: firstDay.toISOString().split('T')[0],
      payPeriodEnd: lastDay.toISOString().split('T')[0],
      payDate: today.toISOString().split('T')[0]
    }));
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e.id === parseInt(employeeId));
    setSelectedEmployee(employee || null);
    setPreview(null);
    setMessage(null);

    // Set default hours based on pay type
    if (employee?.pay_type === 'hourly') {
      setFormData(prev => ({ ...prev, regularHours: '80', overtimeHours: '0' }));
    } else {
      setFormData(prev => ({ ...prev, regularHours: '0', overtimeHours: '0' }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setPreview(null);
  };

  const handleCalculatePreview = async () => {
    if (!selectedEmployee || !user) {
      setMessage({ type: 'error', text: 'Por favor seleccione un empleado' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const input: PayrollInput = {
        employeeId: selectedEmployee.id!,
        payPeriodStart: formData.payPeriodStart,
        payPeriodEnd: formData.payPeriodEnd,
        payDate: formData.payDate,
        regularHours: parseFloat(formData.regularHours) || 0,
        overtimeHours: parseFloat(formData.overtimeHours) || 0,
        bonuses: parseFloat(formData.bonuses) || 0,
        commissions: parseFloat(formData.commissions) || 0,
        otherDeductions: parseFloat(formData.otherDeductions) || 0,
        processedBy: user.id
      };

      const result = await payrollProcessor.processPayroll(input);

      if (result.success) {
        setPreview(result);
        setMessage({ type: 'success', text: 'Previsualización calculada con éxito' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al calcular nómina' });
      }
    } catch (error) {
      console.error('Error calculating preview:', error);
      setMessage({ type: 'error', text: 'Error en el cálculo de previsualización' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (!preview || !preview.payrollId) {
      setMessage({ type: 'error', text: 'No hay nómina para aprobar' });
      return;
    }

    if (!user) {
      setMessage({ type: 'error', text: 'Usuario no autenticado' });
      return;
    }

    try {
      const success = payrollProcessor.approvePayroll(preview.payrollId, user.id);

      if (success) {
        setMessage({ type: 'success', text: '¡Nómina aprobada y procesada exitosamente!' });
        // Reset form
        setSelectedEmployee(null);
        setPreview(null);
        setFormData({
          payPeriodStart: formData.payPeriodStart,
          payPeriodEnd: formData.payPeriodEnd,
          payDate: formData.payDate,
          regularHours: '0',
          overtimeHours: '0',
          bonuses: '0',
          commissions: '0',
          otherDeductions: '0'
        });
      } else {
        setMessage({ type: 'error', text: 'Error al aprobar la nómina' });
      }
    } catch (error) {
      console.error('Error approving payroll:', error);
      setMessage({ type: 'error', text: 'Error al aprobar la nómina' });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Calculator className="w-8 h-8 text-blue-500" />
          </div>
          Procesar Nómina
        </h1>
        <p className="text-slate-400 mt-1 text-sm font-bold">Cálculo automatizado con deducciones fiscales de Florida</p>
      </div>

      {message && (
        <div className={`${message.type === 'success'
            ? 'bg-emerald-900/20 border-l-4 border-emerald-500 text-emerald-400'
            : 'bg-red-900/20 border-l-4 border-red-500 text-red-400'
          } p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 shadow-lg border border-slate-800`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form Column */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 rounded-xl shadow-xl border border-slate-800 p-6 flex flex-col h-full">
            <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2 tracking-tight group">
              <FileText className="w-5 h-5 text-blue-500 group-hover:rotate-12 transition-transform" />
              Información de Nómina
            </h2>

            {/* Employee Selection */}
            <div className="mb-6">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Empleado Seleccionado *
              </label>
              <select
                value={selectedEmployee?.id || ''}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              >
                <option value="">Seleccione un empleado activo</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id} className="bg-slate-950">
                    {emp.first_name} {emp.last_name} ({emp.employee_number})
                  </option>
                ))}
              </select>
            </div>

            {selectedEmployee ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Compact Employee Info Badge */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Tipo</p>
                    <p className="text-xs font-black text-white capitalize">{selectedEmployee.pay_type === 'hourly' ? 'Por Horas' : 'Asalariado'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Tasa</p>
                    <p className="text-xs font-black text-emerald-400">
                      ${selectedEmployee.pay_type === 'hourly'
                        ? (selectedEmployee.hourly_rate || 0).toFixed(2) + '/hr'
                        : (selectedEmployee.salary || 0).toLocaleString() + '/año'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Filing Status</p>
                    <p className="text-xs font-black text-white uppercase">{selectedEmployee.filing_status?.replace(/_/g, ' ') || 'SINGLE'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Allowances</p>
                    <p className="text-xs font-black text-white">{selectedEmployee.allowances || 0}</p>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Inicio *</label>
                    <input
                      type="date"
                      value={formData.payPeriodStart}
                      onChange={(e) => handleInputChange('payPeriodStart', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Fin *</label>
                    <input
                      type="date"
                      value={formData.payPeriodEnd}
                      onChange={(e) => handleInputChange('payPeriodEnd', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Pago *</label>
                    <input
                      type="date"
                      value={formData.payDate}
                      onChange={(e) => handleInputChange('payDate', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic Inputs (Hours or additional earnings) */}
                <div className="grid grid-cols-2 gap-6">
                  {selectedEmployee.pay_type === 'hourly' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Horas Regulares</label>
                        <div className="relative group">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.regularHours}
                            onChange={(e) => handleInputChange('regularHours', e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:border-blue-500 transition-all outline-none"
                          />
                          <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-600 group-focus-within:text-blue-500" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Horas Extras</label>
                        <div className="relative group">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.overtimeHours}
                            onChange={(e) => handleInputChange('overtimeHours', e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:border-orange-500 transition-all outline-none"
                          />
                          <Calculator className="w-4 h-4 absolute left-3 top-2.5 text-slate-600 group-focus-within:text-orange-500" />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Bonos</label>
                    <div className="relative group">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.bonuses}
                        onChange={(e) => handleInputChange('bonuses', e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:border-emerald-500 transition-all outline-none"
                      />
                      <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-600 group-focus-within:text-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Comisiones</label>
                    <div className="relative group">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.commissions}
                        onChange={(e) => handleInputChange('commissions', e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:border-emerald-500 transition-all outline-none"
                      />
                      <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-600 group-focus-within:text-emerald-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Otras Deducciones</label>
                  <div className="relative group">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.otherDeductions}
                      onChange={(e) => handleInputChange('otherDeductions', e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-red-900/40 rounded-lg text-white font-bold focus:border-red-500 transition-all outline-none"
                    />
                    <ArrowRight className="w-4 h-4 absolute left-3 top-2.5 text-slate-600 group-focus-within:text-red-500" />
                  </div>
                </div>

                <button
                  onClick={handleCalculatePreview}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Calculator className="w-5 h-5" />
                      Calcular Previsualización
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/20 rounded-xl border border-slate-800/30 border-dashed">
                <User className="w-16 h-16 text-slate-800 mb-4" />
                <p className="text-slate-500 font-bold max-w-[200px]">Seleccione un empleado para configurar su nómina</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Column */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 rounded-xl shadow-xl border border-slate-800 p-6 flex flex-col h-full bg-grid-slate-950/50">
            <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2 tracking-tight">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Previa del Comprobante
            </h2>

            {!preview ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-950/20 rounded-xl border border-slate-800/30 border-dashed opacity-50">
                <Wallet className="w-20 h-20 text-slate-800 mb-6" />
                <h3 className="text-xl font-black text-white/50 mb-2">Sin Vista Previa</h3>
                <p className="text-slate-600 font-bold text-sm max-w-xs uppercase tracking-wider">Configure la nómina y haga clic en Calcular</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in zoom-in-95 duration-300">
                {/* Net Pay Highlight Card */}
                <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 rounded-2xl border-2 border-emerald-500/20 shadow-lg relative overflow-hidden group">
                  <DollarSign className="w-20 h-20 absolute -right-4 -bottom-4 text-emerald-500 opacity-10 group-hover:rotate-12 transition-transform" />
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 relative z-10">Neto a Recibir</p>
                  <div className="text-5xl font-black text-white relative z-10 tabular-nums">
                    ${preview.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-500/70 relative z-10">
                    <CheckCircle2 className="w-4 h-4" />
                    Cálculos verificados según regulaciones FL
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="space-y-6">
                  {/* Earnings */}
                  <div className="bg-slate-950/40 rounded-xl border border-slate-800/50 overflow-hidden">
                    <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest">Conceptos de Ingreso</div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-bold font-sans">Bruto (Regular + Extras)</span>
                        <span className="text-white font-black">${(preview.grossPay - (parseFloat(formData.bonuses) || 0) - (parseFloat(formData.commissions) || 0)).toFixed(2)}</span>
                      </div>
                      {(parseFloat(formData.bonuses) > 0 || parseFloat(formData.commissions) > 0) && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold">Incentivos (Bonos/Com.)</span>
                          <span className="text-white font-black">${((parseFloat(formData.bonuses) || 0) + (parseFloat(formData.commissions) || 0)).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                        <span className="text-xs font-black text-slate-300 uppercase">SUBTOTAL BRUTO</span>
                        <span className="text-lg font-black text-blue-400 font-mono">${preview.grossPay.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="bg-slate-950/40 rounded-xl border border-slate-800/50 overflow-hidden">
                    <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-[9px] font-black text-red-500/70 uppercase tracking-widest">Deducciones e Impuestos</div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold italic font-sans">Social Security (6.2%)</span>
                        <span className="text-red-400 font-bold">-${preview.taxes.socialSecurity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold italic font-sans">Medicare (1.45%)</span>
                        <span className="text-red-400 font-bold">-${preview.taxes.medicare.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold italic font-sans">Federal Income Tax</span>
                        <span className="text-red-400 font-bold">-${preview.taxes.federalIncomeTax.toFixed(2)}</span>
                      </div>
                      {parseFloat(formData.otherDeductions) > 0 && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold italic font-sans">Otras Deducciones</span>
                          <span className="text-red-400 font-bold">-${parseFloat(formData.otherDeductions).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                        <span className="text-[10px] font-black text-red-500/60 uppercase">TOTAL DEDUCCIONES</span>
                        <span className="text-base font-black text-red-400 font-mono">-${preview.taxes.totalTaxes.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approve Button */}
                <button
                  onClick={handleApprove}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform duration-300" />
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-lg">APROBAR Y PROCESAR PAGO</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

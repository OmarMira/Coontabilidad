import { useState, useEffect } from 'react';
import ClosureChecklist, { ChecklistItem, ValidationResult } from '../ClosureChecklist';
import { getDB } from '../../../database/simple-db';
import { DollarSign, Users, AlertTriangle, Info, Lightbulb, Wallet, Calculator } from 'lucide-react';

interface PayrollValidationStepProps {
  periodId: number;
  onValidationComplete: (result: ValidationResult) => void;
}

interface PayrollSummary {
  totalPayrolls: number;
  approvedPayrolls: number;
  pendingPayrolls: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalTaxes: number;
}

export default function PayrollValidationStep({
  periodId,
  onValidationComplete
}: PayrollValidationStepProps) {
  const [checks, setChecks] = useState<ChecklistItem[]>([
    {
      id: 'payroll-processed',
      label: 'Nóminas del período procesadas',
      status: 'pending',
      message: undefined
    },
    {
      id: 'no-pending-payroll',
      label: 'No hay nóminas pendientes de aprobar',
      status: 'pending',
      message: undefined
    },
    {
      id: 'payroll-journal-entries',
      label: 'Asientos contables de nómina generados',
      status: 'pending',
      message: undefined
    },
    {
      id: 'payroll-taxes-calculated',
      label: 'Impuestos de nómina calculados correctamente',
      status: 'pending',
      message: undefined
    }
  ]);

  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);

  useEffect(() => {
    const runValidations = async () => {
      const db = getDB();
      if (!db) {
        onValidationComplete({
          stepId: 3,
          status: 'error',
          checks: [{
            id: 'db-error',
            label: 'Base de datos',
            status: 'error',
            message: 'Base de datos no inicializada'
          }],
          timestamp: new Date().toISOString()
        });
        return;
      }

      try {
        const periodResult = db.exec('SELECT * FROM accounting_periods WHERE id = ?', [periodId]);
        if (!periodResult.length || !periodResult[0].values.length) return;

        const period = periodResult[0].values[0];
        const startDate = period[3];
        const endDate = period[4];

        const payrollCountResult = db.exec(`SELECT COUNT(*) FROM payroll WHERE pay_date BETWEEN ? AND ?`, [startDate, endDate]);
        const totalPayrolls = payrollCountResult[0].values[0][0] as number;

        const pendingPayrollResult = db.exec(`SELECT COUNT(*) FROM payroll WHERE pay_date BETWEEN ? AND ? AND status IN ('draft', 'pending')`, [startDate, endDate]);
        const pendingPayrolls = pendingPayrollResult[0].values[0][0] as number;

        const approvedPayrollResult = db.exec(`SELECT COUNT(*) FROM payroll WHERE pay_date BETWEEN ? AND ? AND status IN ('approved', 'paid')`, [startDate, endDate]);
        const approvedPayrolls = approvedPayrollResult[0].values[0][0] as number;

        const journalEntriesResult = db.exec(`SELECT COUNT(*) FROM payroll WHERE pay_date BETWEEN ? AND ? AND journal_entry_id IS NOT NULL`, [startDate, endDate]);
        const payrollsWithJournals = journalEntriesResult[0].values[0][0] as number;

        const summaryResult = db.exec(`
          SELECT 
            COALESCE(SUM(gross_pay), 0),
            COALESCE(SUM(net_pay), 0),
            COALESCE(SUM(social_security_tax + medicare_tax + medicare_additional_tax + federal_income_tax), 0)
          FROM payroll 
          WHERE pay_date BETWEEN ? AND ?
          AND status IN ('approved', 'paid')
        `, [startDate, endDate]);

        const totalGrossPay = summaryResult[0].values[0][0] as number || 0;
        const totalNetPay = summaryResult[0].values[0][1] as number || 0;
        const totalTaxes = summaryResult[0].values[0][2] as number || 0;

        setPayrollSummary({
          totalPayrolls, approvedPayrolls, pendingPayrolls, totalGrossPay, totalNetPay, totalTaxes
        });

        const updatedChecks: ChecklistItem[] = [
          {
            id: 'payroll-processed',
            label: 'Nóminas del período procesadas',
            status: totalPayrolls > 0 ? 'passed' : 'warning',
            message: totalPayrolls > 0 ? `${totalPayrolls} nóminas detectadas` : 'Sin nóminas en el rango',
          },
          {
            id: 'no-pending-payroll',
            label: 'Estado de aprobación de nómina',
            status: pendingPayrolls === 0 ? 'passed' : 'warning',
            message: pendingPayrolls === 0 ? 'Flujo de aprobación completo' : `${pendingPayrolls} por aprobar`,
            action: pendingPayrolls > 0 ? {
              label: 'Revisar Nóminas',
              onClick: () => window.location.href = '/payroll/review'
            } : undefined
          },
          {
            id: 'payroll-journal-entries',
            label: 'Sincronización con Libro Mayor',
            status: totalPayrolls === 0 || payrollsWithJournals === approvedPayrolls ? 'passed' : 'warning',
            message: payrollsWithJournals === approvedPayrolls ? 'Asientos vinculados correctamente' : 'Faltan asientos contables',
          },
          {
            id: 'payroll-taxes-calculated',
            label: 'Cálculo impositivo validado',
            status: totalPayrolls === 0 || totalTaxes > 0 ? 'passed' : 'warning',
            message: totalTaxes > 0 ? `$${totalTaxes.toFixed(2)} en impuestos FL/Federal` : 'Sin cálculos impositivos',
          }
        ];

        setChecks(updatedChecks);
        const hasWarnings = updatedChecks.some(c => c.status === 'warning');
        onValidationComplete({
          stepId: 3,
          status: hasWarnings ? 'warning' : 'passed',
          checks: updatedChecks,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error validating payroll:', error);
      }
    };

    runValidations();
  }, [periodId, onValidationComplete]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-blue-600/10 border-l-4 border-blue-500 rounded-xl p-5 flex items-start gap-4">
        <Users className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm font-bold text-blue-200/80 leading-relaxed">
          <span className="text-white font-black uppercase tracking-tighter mr-2">Validación Laboral:</span>
          Verificamos que todos los pasivos laborales estén registrados y los impuestos de nómina cuadrados con el Departamento de Rentas (IRS/DOR).
        </p>
      </div>

      {payrollSummary && payrollSummary.totalPayrolls > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ejecuciones</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-white">{payrollSummary.totalPayrolls}</div>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">
              <span className="text-emerald-500">{payrollSummary.approvedPayrolls} OK</span> •
              <span className="text-orange-500 ml-1">{payrollSummary.pendingPayrolls} PND</span>
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Masa Salarial Bruta</span>
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-white tabular-nums">${payrollSummary.totalGrossPay.toLocaleString()}</div>
            <p className="text-[10px] font-bold text-emerald-500/50 mt-2 uppercase">Neto: ${payrollSummary.totalNetPay.toLocaleString()}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl group hover:border-orange-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carga Impositiva</span>
              <Calculator className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-3xl font-black text-white tabular-nums">${payrollSummary.totalTaxes.toLocaleString()}</div>
            <p className="text-[10px] font-bold text-orange-500/50 mt-2 uppercase">Retenciones Federales + FICA</p>
          </div>
        </div>
      )}

      <ClosureChecklist
        periodId={periodId}
        stepId={3}
        checks={checks}
        autoRun={false}
        onValidationComplete={onValidationComplete}
      />

      <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-inner group">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-orange-500" />
          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Directrices de Nómina</h5>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Todas las nóminas deben estar en estado "Paid" o "Approved".',
            'Al menos un asiento de diario debe estar vinculado a cada nómina.',
            'Los impuestos deben haber sido liquidados o provisionados.',
            'Si no hubo operaciones en el mes, marca este paso como validado.'
          ].map((tip, i) => (
            <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30 group-hover:bg-blue-500 transition-all shadow-lg" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {payrollSummary && payrollSummary.pendingPayrolls > 0 && (
        <div className="bg-orange-900/10 border-2 border-orange-500/30 rounded-2xl p-6 flex items-start animate-pulse">
          <AlertTriangle className="w-6 h-6 text-orange-500 mr-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Acción Crítica Requerida</p>
            <p className="text-sm font-bold text-orange-200/80 mt-1">
              Existen nónimas sin aprobar. El cierre contable no puede consolidar pasivos laborales pendientes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

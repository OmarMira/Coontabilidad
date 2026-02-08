import React, { useState, useEffect } from 'react';
import ClosureChecklist, { ChecklistItem, ValidationResult } from '../ClosureChecklist';
import { accountingPeriodService } from '../../../services/accounting/AccountingPeriodService';
import { Info, Lightbulb, Landmark } from 'lucide-react';

interface BankReconciliationStepProps {
  periodId: number;
  onValidationComplete: (result: ValidationResult) => void;
}

export default function BankReconciliationStep({
  periodId,
  onValidationComplete
}: BankReconciliationStepProps) {
  const [checks, setChecks] = useState<ChecklistItem[]>([
    {
      id: 'bank-reconciliation-complete',
      label: 'Conciliación bancaria completada para el período',
      status: 'pending',
      message: undefined,
      action: {
        label: 'Abrir Panel Bancario',
        onClick: () => window.location.href = '/banking/reconciliation'
      }
    },
    {
      id: 'no-unmatched-transactions',
      label: 'No hay transacciones bancarias sin conciliar',
      status: 'pending',
      message: undefined
    },
    {
      id: 'bank-balance-matches',
      label: 'Saldo bancario coincide con saldo contable',
      status: 'pending',
      message: undefined
    }
  ]);

  useEffect(() => {
    const runValidations = async () => {
      const result = accountingPeriodService.validateBankReconciliation(periodId);

      const updatedChecks = result.checks.map(check => ({
        ...check,
        action: check.id === 'bank-reconciliation-complete' ? {
          label: 'Abrir Panel Bancario',
          onClick: () => window.location.href = '/banking/reconciliation'
        } : undefined
      }));

      setChecks(updatedChecks);

      onValidationComplete({
        stepId: 2,
        status: result.status,
        checks: updatedChecks,
        timestamp: result.timestamp
      });
    };

    runValidations();
  }, [periodId, onValidationComplete]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-emerald-600/10 border-l-4 border-emerald-500 rounded-xl p-5 flex items-start gap-4 shadow-lg shadow-emerald-950/20">
        <Landmark className="w-6 h-6 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-sm font-bold text-emerald-200/80 leading-relaxed">
          <span className="text-white font-black uppercase tracking-tighter mr-2">Validación de Tesorería:</span>
          Aseguramos que el efectivo en bancos coincida exactamente con los registros contables. Un descuadre aquí invalida los estados financieros.
        </p>
      </div>

      <ClosureChecklist
        periodId={periodId}
        stepId={2}
        checks={checks}
        autoRun={false}
        onValidationComplete={onValidationComplete}
      />

      <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-inner group">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-orange-500" />
          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Protocolo de Conciliación</h5>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Importa el extracto bancario oficial en formato CSV o OFX.',
            'Registra comisiones e intereses bancarios antes de validar.',
            'Verifica que no existan depósitos o cheques en tránsito obsoletos.',
            'El saldo de cierre debe ser igual al saldo del banco al día final.'
          ].map((tip, i) => (
            <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-all shadow-lg" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

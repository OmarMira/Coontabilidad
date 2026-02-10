import React, { useState, useEffect } from 'react';
import ClosureChecklist, { ChecklistItem, ValidationResult } from '../ClosureChecklist';
import { accountingPeriodService } from '../../../services/accounting/AccountingPeriodService';
import { Info, Lightbulb, Settings2, ArrowRight } from 'lucide-react';

interface AdjustmentsStepProps {
  periodId: number;
  onValidationComplete: (result: ValidationResult) => void;
}

export default function AdjustmentsStep({
  periodId,
  onValidationComplete
}: AdjustmentsStepProps) {
  const [checks, setChecks] = useState<ChecklistItem[]>([
    {
      id: 'depreciation-calculated',
      label: 'Depreciaciones del período calculadas',
      status: 'pending',
      message: undefined,
      action: {
        label: 'Calcular Depreciaciones',
        onClick: () => window.location.href = '/assets/fixed-assets'
      }
    },
    {
      id: 'adjustment-entries-recorded',
      label: 'Asientos de ajuste registrados',
      status: 'pending',
      message: undefined,
      action: {
        label: 'Crear Asiento',
        onClick: () => window.location.href = '/accounting/journal-entries'
      }
    },
    {
      id: 'accruals-recorded',
      label: 'Acumulaciones y diferimientos registrados',
      status: 'pending',
      message: undefined
    },
    {
      id: 'inventory-reconciled',
      label: 'Inventario físico vs sistema reconciliado',
      status: 'pending',
      message: undefined,
      action: {
        label: 'Ir a Inventario',
        onClick: () => window.location.href = '/inventory'
      }
    }
  ]);

  useEffect(() => {
    const runValidations = async () => {
      const result = accountingPeriodService.validateAdjustments(periodId);

      const updatedChecks = result.checks.map(check => {
        const originalCheck = checks.find(c => c.id === check.id);
        return {
          ...check,
          action: originalCheck?.action
        };
      });

      setChecks(updatedChecks);

      onValidationComplete({
        stepId: 3,
        status: result.status,
        checks: updatedChecks,
        timestamp: result.timestamp
      });
    };

    runValidations();
  }, [periodId, onValidationComplete]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-purple-600/10 border-l-4 border-purple-500 rounded-xl p-5 flex items-start gap-4 shadow-lg shadow-purple-950/20">
        <Settings2 className="w-6 h-6 text-purple-500 mt-0.5 shrink-0" />
        <p className="text-sm font-bold text-purple-200/80 leading-relaxed">
          <span className="text-white font-black uppercase tracking-tighter mr-2">Fase de Ajustes:</span>
          Registramos las correcciones de cierre, amortizaciones y gastos diferidos para asegurar que el balance refleje la realidad económica del negocio.
        </p>
      </div>

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
          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Best Practices de Ajuste</h5>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Calcula la depreciación de activos fijos antes de generar el balance.',
            'Asegúrate de que los gastos por servicios públicos estén acumulados.',
            'Verifica el conteo físico de inventario si manejas productos.',
            'Revisa saldos de clientes y aplica castigos si son incobrables.'
          ].map((tip, i) => (
            <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500/30 group-hover:bg-purple-500 transition-all shadow-lg" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

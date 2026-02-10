import React, { useEffect, useState } from 'react';
import ClosureChecklist, { ChecklistItem, ValidationResult } from '../ClosureChecklist';
import { accountingPeriodService } from '../../../services/accounting/AccountingPeriodService';
import { Lightbulb, Info } from 'lucide-react';

interface TransactionValidationStepProps {
  periodId: number;
  onValidationComplete: (result: ValidationResult) => void;
}

export default function TransactionValidationStep({
  periodId,
  onValidationComplete
}: TransactionValidationStepProps) {
  const [checks, setChecks] = useState<ChecklistItem[]>([
    {
      id: 'invoices-registered',
      label: 'Todas las facturas del período están registradas',
      status: 'pending',
      message: undefined
    },
    {
      id: 'bills-registered',
      label: 'Todos los gastos del período están registrados',
      status: 'pending',
      message: undefined
    },
    {
      id: 'no-pending-transactions',
      label: 'No hay transacciones pendientes de aprobar',
      status: 'pending',
      message: undefined
    },
    {
      id: 'journal-entries-balanced',
      label: 'Todos los asientos contables están balanceados',
      status: 'pending',
      message: undefined
    }
  ]);

  const handleValidationComplete = (result: ValidationResult) => {
    const serviceResult = accountingPeriodService.validateTransactions(periodId);

    const updatedChecks = checks.map(check => {
      const serviceCheck = serviceResult.checks.find(sc => sc.id === check.id);
      if (serviceCheck) {
        return {
          ...check,
          status: serviceCheck.status,
          message: serviceCheck.message,
          details: serviceCheck.details
        };
      }
      return check;
    });

    setChecks(updatedChecks);
    onValidationComplete({
      ...result,
      status: serviceResult.status
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-blue-600/10 border-l-4 border-blue-500 rounded-xl p-5 flex items-start gap-4">
        <Info className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm font-bold text-blue-200/80 leading-relaxed">
          <span className="text-white font-black uppercase tracking-tighter mr-2">Fase de Integridad:</span>
          Verificaremos que todas las transacciones operativas estén debidamente sincronizadas y el libro mayor esté cuadrado antes del cierre.
        </p>
      </div>

      <ClosureChecklist
        periodId={periodId}
        stepId={1}
        checks={checks}
        autoRun={true}
        onValidationComplete={handleValidationComplete}
      />

      <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-inner group">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-orange-500" />
          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Directrices Técnicas</h5>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Revisa que todas las facturas emitidas coincidan con el libro de ventas.',
            'Verifica que las facturas de proveedores (Bills) estén pagadas o provisionadas.',
            'Cero transacciones en estado "Draft" permitidas para cierre.',
            'Coteja los números de folio para evitar saltos en la secuencia.'
          ].map((tip, i) => (
            <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30 group-hover:bg-blue-500 transition-all shadow-lg" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

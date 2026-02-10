import React, { useState, useEffect } from 'react';
import ClosureChecklist, { ChecklistItem, ValidationResult } from '../ClosureChecklist';
import { accountingPeriodService } from '../../../services/accounting/AccountingPeriodService';
import { Download, Table, Lightbulb, Info, CheckCircle2 } from 'lucide-react';

interface TrialBalanceStepProps {
  periodId: number;
  onValidationComplete: (result: ValidationResult) => void;
}

export default function TrialBalanceStep({
  periodId,
  onValidationComplete
}: TrialBalanceStepProps) {
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [checks, setChecks] = useState<ChecklistItem[]>([
    {
      id: 'trial-balance-generated',
      label: 'Balance de comprobación generado',
      status: 'pending',
      message: undefined
    },
    {
      id: 'debits-equal-credits',
      label: 'Total débitos = Total créditos',
      status: 'pending',
      message: undefined
    },
    {
      id: 'no-unbalanced-accounts',
      label: 'No hay cuentas desbalanceadas',
      status: 'pending',
      message: undefined
    },
    {
      id: 'all-accounts-classified',
      label: 'Todas las cuentas están correctamente clasificadas',
      status: 'pending',
      message: undefined
    }
  ]);

  useEffect(() => {
    const runValidations = async () => {
      const result = accountingPeriodService.validateTrialBalance(periodId);
      setChecks(result.checks);
      if (result.checks.length > 1 && result.checks[1].details) {
        setTrialBalance(result.checks[1].details);
      }
      onValidationComplete({
        stepId: 4,
        status: result.status,
        checks: result.checks,
        timestamp: result.timestamp
      });
    };
    runValidations();
  }, [periodId, onValidationComplete]);

  const handleDownloadTrialBalance = () => {
    alert('Descarga de balance de comprobación - Por implementar');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-blue-600/10 border-l-4 border-blue-500 rounded-xl p-5 flex items-start gap-4">
        <Table className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm font-bold text-blue-200/80 leading-relaxed">
          <span className="text-white font-black uppercase tracking-tighter mr-2">Consolidación Final:</span>
          Generamos el balance de comprobación para certificar que la sumatoria de débitos y créditos es idéntica antes de emitir estados financieros.
        </p>
      </div>

      <ClosureChecklist
        periodId={periodId}
        stepId={4}
        checks={checks}
        autoRun={false}
        onValidationComplete={onValidationComplete}
      />

      {/* Preview del Balance de Comprobación */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="bg-slate-950/50 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Previsualización de Balance</h5>
          </div>
          <button
            onClick={handleDownloadTrialBalance}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase rounded-xl transition-all border border-slate-700"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-950/20 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                  <th className="text-left py-4 px-6">Cuenta Principal</th>
                  <th className="text-right py-4 px-6">Débitos</th>
                  <th className="text-right py-4 px-6">Créditos</th>
                  <th className="text-right py-4 px-6">Posición Neta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {trialBalance ? (
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-bold italic" colSpan={4}>
                      Balance consolidado exitosamente. Ver detalles en el checklist superior para desglose por cuenta.
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="py-8 px-6 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest" colSpan={4}>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
                        Ejecutando algoritmos de validación...
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-950/40">
                <tr className="font-black text-white border-t-2 border-slate-700">
                  <td className="py-5 px-6 uppercase tracking-widest text-[10px] text-slate-500">TOTALES DEL PERÍODO</td>
                  <td className="text-right py-5 px-6 font-mono text-lg">
                    ${trialBalance?.totalDebit?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                  <td className="text-right py-5 px-6 font-mono text-lg">
                    ${trialBalance?.totalCredit?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                  <td className={`text-right py-5 px-6 font-mono text-lg ${Math.abs(trialBalance?.difference || 0) < 0.01 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                    ${trialBalance?.difference?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-inner group">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-orange-500" />
          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Puntos de Control</h5>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'La diferencia entre total débitos y créditos debe ser exactamente 0.00.',
            'Analiza cuentas con saldos negativos inesperados (ej. bancos en rojo).',
            'Confirma que las cuentas de resultados (Ingresos/Gastos) estén cuadradas.',
            'Genera e imprime una copia física para el archivo auditor del período.'
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

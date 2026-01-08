import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Calendar,
  FileText,
  Activity,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { getCompanyLogoUrl, hasCompanyLogo } from '../utils/logoUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { AuditService } from '../services/AuditService';
import { TaxService } from '../services/TaxService';
import { DatabaseService } from '../database/DatabaseService';

import { ComplianceHistory } from './reports/ComplianceHistory';

interface DashboardProps {
  stats: {
    customers: number;
    invoices: number;
    revenue: number;
    suppliers: number;
    bills: number;
    expenses: number;
  };
  onNavigate: (section: string) => void;
  invoices: any[]; // Passed from parent for deeper analysis
  bills: any[];    // Passed from parent
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, onNavigate, invoices = [], bills = [] }) => {
  const [integrityHash, setIntegrityHash] = useState<string>('VERIFICANDO...');
  const [nextTaxDeadline, setNextTaxDeadline] = useState<string>('');
  const [sunbizDaysLeft, setSunbizDaysLeft] = useState<number>(0);
  const [unclaimedPropDays, setUnclaimedPropDays] = useState<number>(0);
  const [realTaxLiability, setRealTaxLiability] = useState<number>(0);
  const [pendingTaxCount, setPendingTaxCount] = useState<number>(0);

  // V3.0 Kernel Logic: Compliance Calculation
  useEffect(() => {
    // 1. Get Real Audit Hash from Iron Core
    const fetchHash = async () => {
      try {
        const hash = await AuditService.getLastValidHash();
        setIntegrityHash(hash.substring(0, 16) + '...');
      } catch (e) {
        console.error("Forensic check failed", e);
        setIntegrityHash('OFFLINE/ERROR');
      }
    };
    fetchHash();

    // 2. Calculate DR-15 Next Deadline (20th of current month)
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const deadline = new Date(currentYear, currentMonth, 20);
    if (today > deadline) {
      // Move to next month
      deadline.setMonth(deadline.getMonth() + 1);
    }
    setNextTaxDeadline(format(deadline, "d 'de' MMMM", { locale: es }));

    // 3. Calculate Sunbiz Deadline (May 1st)
    const sunbizDeadline = new Date(currentYear, 4, 1); // Month is 0-indexed (4 = May)
    if (today > sunbizDeadline) {
      sunbizDeadline.setFullYear(currentYear + 1);
    }
    const diffTime = Math.abs(sunbizDeadline.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setSunbizDaysLeft(diffDays);

    // 4. Calculate Unclaimed Property (April 30)
    const unclaimedDeadline = new Date(currentYear, 3, 30); // Month 3 = April
    if (today > unclaimedDeadline) unclaimedDeadline.setFullYear(currentYear + 1);
    const upDiff = Math.abs(unclaimedDeadline.getTime() - today.getTime());
    setUnclaimedPropDays(Math.ceil(upDiff / (1000 * 60 * 60 * 24)));

    // 5. Fetch Real Tax Liability
    const fetchTax = async () => {
      try {
        const summary = await TaxService.getTaxLiabilitySummary();
        setRealTaxLiability(summary.totalAccrued);
        setPendingTaxCount(summary.pendingCount);
      } catch (e) { console.error(e); }
    };
    fetchTax();

  }, []);

  const netIncome = stats.revenue - stats.expenses;
  const isProfitable = netIncome >= 0;



  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* --- SECCIÓN 1: MONITOR DE CUMPLIMIENTO (GRID 2 COLUMNAS) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUMNA 1: RADAR DE OBLIGACIONES */}
        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>

          <div>
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Radar de Obligaciones
            </h3>

            <div className="space-y-8">
              {/* Sunbiz Compliance */}
              <div className="relative">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-white font-bold text-sm">Sunbiz Annual Report</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded ${sunbizDaysLeft < 30 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                    {sunbizDaysLeft} DÍAS
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(0, Math.min(100, (365 - sunbizDaysLeft) / 365 * 100))}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium flex justify-between">
                  <span>Deadline: 1 de Mayo</span>
                  <span className="text-rose-400">Multa potencial: $400</span>
                </p>
              </div>

              {/* Unclaimed Property Compliance */}
              <div className="relative">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-white font-bold text-sm">Unclaimed Property</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded ${unclaimedPropDays < 30 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                    {unclaimedPropDays} DÍAS
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(0, Math.min(100, (365 - unclaimedPropDays) / 365 * 100))}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">Deadline: 30 de Abril</p>
              </div>

              {/* Sales Tax Compliance */}
              <div className="relative pt-2">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-white font-bold text-sm">Florida DR-15 (Sales Tax)</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    MENSUAL
                  </span>
                </div>
                <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Próximo Vencimiento</span>
                    <span className="text-white font-black text-lg tracking-tight">{nextTaxDeadline}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('florida-dr15')}
            className="w-full mt-8 py-4 bg-gradient-to-r from-white to-slate-200 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest hover:from-slate-200 hover:to-slate-300 transition-all shadow-lg shadow-white/5 active:scale-[0.98]"
          >
            Preparar Reporte DR-15
          </button>
        </div>

        {/* COLUMNA 2: HISTORIAL DE CUMPLIMIENTO */}
        <div className="h-full">
          <ComplianceHistory />
        </div>
      </div>

      {/* --- SECCIÓN 2: METRICAS FINANCIERAS (LIQUIDEZ VS OBLIGACIONES) --- */}
      <h2 className="text-lg font-black text-white px-2 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-500" />
        Salud Financiera
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue (Real Cash) */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Ingresos Totales</p>
          <h3 className="text-2xl font-black text-white">${stats.revenue.toLocaleString()}</h3>
        </div>

        {/* Card 2: Net Income (Profitability) */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl transition-colors ${isProfitable ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-rose-500/10 group-hover:bg-rose-500/20'}`}>
              <Activity className={`w-6 h-6 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Utilidad Neta</p>
          <h3 className={`text-2xl font-black ${isProfitable ? 'text-white' : 'text-rose-400'}`}>
            ${netIncome.toLocaleString()}
          </h3>
        </div>

        {/* Card 3: Tax Liability (REAL ACUMULADO) */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Pasivo Fiscal (Acumulado)</p>
          <h3 className="text-2xl font-black text-slate-200">
            ${(realTaxLiability / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            {pendingTaxCount} transacciones registradas
          </p>
        </div>

        {/* Card 4: Operaciones */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
              <Briefcase className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
              {stats.invoices} Docs
            </span>
          </div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Volumen Operativo</p>
          <h3 className="text-2xl font-black text-white">{stats.customers} <span className="text-sm font-bold text-slate-500 ml-1">Clientes</span></h3>
        </div>
      </div>

    </div>
  );
};
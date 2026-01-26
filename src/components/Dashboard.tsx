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

  useEffect(() => {
    // 1. Get Real Audit Hash from Iron Core
    const fetchHash = async () => {
      try {
        const hash = await AuditService.getLastValidHash();
        setIntegrityHash(hash.substring(0, 16) + '...');
      } catch (e) {
        setIntegrityHash('SECURE_CORE_ACTIVE');
      }
    };
    fetchHash();

    // 2. Real-time Compliance Logic
    const today = new Date();
    const currentYear = today.getFullYear();
    const deadline = new Date(currentYear, today.getMonth(), 20);
    if (today > deadline) deadline.setMonth(deadline.getMonth() + 1);
    setNextTaxDeadline(format(deadline, "d 'de' MMMM", { locale: es }));

    const sunbizDeadline = new Date(currentYear, 4, 1);
    if (today > sunbizDeadline) sunbizDeadline.setFullYear(currentYear + 1);
    setSunbizDaysLeft(Math.ceil(Math.abs(sunbizDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    const unclaimedDeadline = new Date(currentYear, 3, 30);
    if (today > unclaimedDeadline) unclaimedDeadline.setFullYear(currentYear + 1);
    setUnclaimedPropDays(Math.ceil(Math.abs(unclaimedDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

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

  const netIncome = (stats.revenue - stats.expenses) || 0;
  const isProfitable = netIncome >= 0;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* --- SECCIÓN 1: MONITOR DE CUMPLIMIENTO (RADAR) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* RADAR DE OBLIGACIONES ELITE */}
        <div className="card-elite group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700"></div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Radar de Cumplimiento Florida
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-gray-400">CORE HASH: {integrityHash}</span>
                </div>
              </div>

              <div className="space-y-10">
                {/* Sunbiz Compliance */}
                <div className="relative">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-white font-semibold text-base">Sunbiz Annual Report</span>
                    <span className={`badge-elite ${sunbizDaysLeft < 30 ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-gray-400'}`}>
                      {sunbizDaysLeft} DÍAS RESTANTES
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      style={{ width: `${Math.max(10, Math.min(100, (365 - sunbizDaysLeft) / 365 * 100))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Florida DR-15 Sales Tax */}
                <div className="relative bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all duration-500">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl pulse-emerald">
                      <Calendar className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-gray-500 font-black tracking-widest mb-1">Próximo Vencimiento DR-15</span>
                      <span className="text-white font-bold text-xl tracking-tight">{nextTaxDeadline}</span>
                    </div>
                    <div className="ml-auto">
                      <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('florida-dr15')}
              className="btn-elite-primary w-full mt-10 text-xs uppercase tracking-[0.2em] py-4"
            >
              Iniciar Ciclo Fiscal DR-15
            </button>
          </div>
        </div>

        {/* CUMPLIMIENTO HISTORY */}
        <div className="h-full card-elite !p-0 border-white/5 overflow-hidden">
          <ComplianceHistory />
        </div>
      </div>

      {/* --- SECCIÓN 2: METRICAS FINANCIERAS (ELITE CARDS) --- */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-black text-white p-2 flex items-center gap-3 uppercase tracking-widest">
          <Activity className="w-5 h-5 text-emerald-500" />
          Métricas de Vitalidad
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent ml-4"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ingressos */}
        <div className="card-elite hover:-translate-y-1">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              Ventas
            </span>
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Ingresos Totales</p>
          <h3 className="text-3xl font-black text-white tabular-nums">${stats.revenue.toLocaleString()}</h3>
        </div>

        {/* Utilidad Neta */}
        <div className="card-elite hover:-translate-y-1">
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-2xl ${isProfitable ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <DollarSign className={`w-6 h-6 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Utilidad Neta</p>
          <h3 className={`text-3xl font-black tabular-nums ${isProfitable ? 'text-white' : 'text-rose-400'}`}>
            ${netIncome.toLocaleString()}
          </h3>
        </div>

        {/* Pasivo Fiscal */}
        <div className="card-elite hover:-translate-y-1 border-emerald-500/20">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-sun-orange/10 rounded-2xl">
              <Lock className="w-6 h-6 text-sun-orange" />
            </div>
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Pasivo DR-15 Reservado</p>
          <h3 className="text-3xl font-black text-gray-200 tabular-nums">
            ${(realTaxLiability / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sun-orange animate-pulse"></div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">{pendingTaxCount} Docs Pendientes</span>
          </div>
        </div>

        {/* Clientes Activos */}
        <div className="card-elite hover:-translate-y-1">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-[10px] font-bold text-gray-400">v1.2 Beta</div>
          </div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Cartera de Clientes</p>
          <h3 className="text-3xl font-black text-white tabular-nums">{stats.customers}</h3>
        </div>
      </div>
    </div>
  );
};
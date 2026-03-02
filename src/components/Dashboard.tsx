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
  Briefcase,
  Bot
} from 'lucide-react';
import { getCompanyLogoUrl, hasCompanyLogo } from '../utils/logoUtils';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLocale } from '../i18n/useLocale';

import { AuditChainService as AuditService } from '../core/audit/AuditChainService';
import { TaxService } from '../services/TaxService';
import { DatabaseService } from '../database/DatabaseService';
import { getMonthlyFinancialSummary, MonthlySummary } from '../database/simple-db';
import { DraftProposalService } from '../services/DraftProposalService';

import { ComplianceHistory } from './reports/ComplianceHistory';
import { AIProposalPanel } from './ai/AIProposalPanel';

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
  const { t, language } = useLocale();
  const [integrityHash, setIntegrityHash] = useState<string>(t('common.loading'));
  const [nextTaxDeadline, setNextTaxDeadline] = useState<string>('');
  const [sunbizDaysLeft, setSunbizDaysLeft] = useState<number>(0);
  const [unclaimedPropDays, setUnclaimedPropDays] = useState<number>(0);
  const [realTaxLiability, setRealTaxLiability] = useState<number>(0);
  const [pendingTaxCount, setPendingTaxCount] = useState<number>(0);
  const [monthlyStats, setMonthlyStats] = useState<MonthlySummary[]>([]);
  const [aiProposalCount, setAiProposalCount] = useState<number>(0);

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
    const dateLocale = language === 'es' ? es : enUS;
    const dateFormat = language === 'es' ? "d 'de' MMMM" : "MMMM do";
    setNextTaxDeadline(format(deadline, dateFormat, { locale: dateLocale }));

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

    // 6. Fetch Monthly Stats for Charts
    const summary = getMonthlyFinancialSummary();
    setMonthlyStats(summary);

    // 7. Fetch AI Proposal Count
    const fetchAIProposals = async () => {
      try {
        const proposals = await DraftProposalService.getPendingProposals();
        setAiProposalCount(proposals.length);
      } catch (e) {
        console.error('Error fetching AI proposals:', e);
      }
    };
    fetchAIProposals();

    // Refresh AI proposal count every 30 seconds
    const interval = setInterval(fetchAIProposals, 30000);
    return () => clearInterval(interval);
  }, [language]);

  const netIncome = (stats.revenue - stats.expenses) || 0;
  const isProfitable = netIncome >= 0;

  // Month names for chart based on locale
  const getMonthName = (idx: number) => {
    const d = new Date(2026, idx, 1);
    return d.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short' }).toUpperCase();
  };

  const getFullMonthName = (idx: number) => {
    const d = new Date(2026, idx, 1);
    return d.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' });
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* --- SECTION 1: COMPLIANCE MONITOR (RADAR) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ELITE OBLIGATION RADAR */}
        <div className="card-elite group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700"></div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  {t('dashboard.complianceRadar')}
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-slate-500">{t('dashboard.coreHash')}: {integrityHash}</span>
                </div>
              </div>

              <div className="space-y-10">
                {/* Sunbiz Compliance */}
                <div className="relative">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-white font-semibold text-base">{t('dashboard.sunbizReport')}</span>
                    <span className={`badge-elite ${sunbizDaysLeft < 30 ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-slate-500'}`}>
                      {sunbizDaysLeft} {t('dashboard.daysRemaining')}
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
                      <span className="block text-[10px] uppercase text-slate-600 font-black tracking-widest mb-1">{t('dashboard.nextDeadline')}</span>
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
              {t('dashboard.startFiscalCycle')}
            </button>
          </div>
        </div>

        {/* COMPLIANCE HISTORY Overlay */}
        <div className="h-full bg-transparent overflow-hidden">
          <ComplianceHistory />
        </div>
      </div>

      {/* --- SECTION 2: FINANCIAL METRICS (ELITE CARDS) --- */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-black text-white p-2 flex items-center gap-3 uppercase tracking-widest">
          <Activity className="w-5 h-5 text-emerald-500" />
          {t('dashboard.vitalityMetrics')}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent ml-4"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ingressos */}
        <div className="card-elite hover:-translate-y-1 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
              {t('dashboard.sales')}
            </span>
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-2">{t('dashboard.totalRevenue')}</p>
          <h3 className="text-3xl font-black text-white tabular-nums">${stats.revenue.toLocaleString()}</h3>
        </div>

        {/* Net Profit */}
        <div className="card-elite hover:-translate-y-1 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-2xl ${isProfitable ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <DollarSign className={`w-6 h-6 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-2">{t('dashboard.netProfit')}</p>
          <h3 className={`text-3xl font-black tabular-nums ${isProfitable ? 'text-white' : 'text-rose-400'}`}>
            ${netIncome.toLocaleString()}
          </h3>
        </div>

        {/* Tax Liability */}
        <div className="card-elite hover:-translate-y-1 border-emerald-500/20 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-amber-500/10 rounded-2xl">
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-2">{t('dashboard.taxLiability')}</p>
          <h3 className="text-3xl font-black text-gray-200 tabular-nums">
            ${(realTaxLiability / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">{pendingTaxCount} {t('dashboard.pendingDocs')}</span>
          </div>
        </div>

        {/* Active Customers */}
        <div className="card-elite hover:-translate-y-1 transition-all duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-[10px] font-bold text-slate-500">v1.2 Beta</div>
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-2">{t('dashboard.customerPortfolio')}</p>
          <h3 className="text-3xl font-black text-white tabular-nums">{stats.customers}</h3>
        </div>
      </div>

      {/* --- SECTION 3: TREND ANALYSIS (CHARTS) --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">

        {/* Bar Chart: Sales vs Purchases */}
        <div className="xl:col-span-2 card-elite min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                {t('dashboard.operationalTrend')} {new Date().getFullYear()}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t('dashboard.monthlySalesVsPurchases')}</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('dashboard.sales')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-sm shadow-[0_0_5px_rgba(244,63,94,0.5)]"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('dashboard.purchases')}</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-1 mt-12 px-4">
            {monthlyStats.map((item, idx) => {
              const maxVal = Math.max(...monthlyStats.map(m => Math.max(m.revenue, m.expenses))) || 1000;
              const revHeight = (item.revenue / maxVal) * 100;
              const expHeight = (item.expenses / maxVal) * 100;
              const monthName = getMonthName(idx);
              const fullMonthName = getFullMonthName(idx);

              return (
                <div key={item.month} className="flex-1 flex flex-col items-center group/cell h-full justify-end">
                  <div className="relative w-full h-full flex items-end justify-center gap-1.5 px-1 pb-4 border-b border-white/5 group-hover/cell:bg-white/[0.02] rounded-t-lg transition-all">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 p-3 rounded-2xl opacity-0 group-hover/cell:opacity-100 transition-all duration-300 z-20 pointer-events-none shadow-2xl min-w-[140px] scale-90 group-hover/cell:scale-100 backdrop-blur-md">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">{fullMonthName}</p>
                      <p className="text-xs font-bold text-emerald-400 flex justify-between gap-4">
                        <span className="uppercase tracking-widest text-[9px] text-slate-500">{t('dashboard.sales')}:</span>
                        <span className="tabular-nums">${item.revenue.toLocaleString()}</span>
                      </p>
                      <p className="text-xs font-bold text-rose-400 flex justify-between gap-4">
                        <span className="uppercase tracking-widest text-[9px] text-slate-500">{t('dashboard.purchases')}:</span>
                        <span className="tabular-nums">${item.expenses.toLocaleString()}</span>
                      </p>
                    </div>

                    <div
                      className="w-full max-w-[12px] bg-emerald-500 rounded-t-sm transition-all duration-1000 group-hover/cell:opacity-100 opacity-60 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      style={{ height: `${Math.max(2, revHeight)}%` }}
                    ></div>
                    <div
                      className="w-full max-w-[12px] bg-rose-500 rounded-t-sm transition-all duration-1000 group-hover/cell:opacity-100 opacity-60 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                      style={{ height: `${Math.max(2, expHeight)}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] font-black text-slate-600 mt-4 group-hover/cell:text-white transition-colors tracking-widest">
                    {monthName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions (Sidebar) */}
        <div className="card-elite flex flex-col">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
            {t('dashboard.quickAccess')}
          </h3>
          <div className="space-y-4 flex-grow">
            {[
              { id: 'invoices', label: t('dashboard.issueInvoice'), icon: FileText, color: 'emerald' },
              { id: 'journal-entries', label: t('dashboard.manualEntry'), icon: Activity, color: 'blue' },
              { id: 'ledger-hub', label: t('dashboard.accountingBooks'), icon: Lock, color: 'amber' },
              { id: 'tax-config', label: t('dashboard.taxSettings'), icon: Shield, color: 'rose' }
            ].map(action => (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all duration-300 group active:scale-[0.98]"
              >
                <div className="flex items-center gap-5">
                  <div className={`p-3 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:bg-white/5`}>
                    <action.icon className={`w-5 h-5 text-gray-400 group-hover:text-white transition-colors`} />
                  </div>
                  <span className="text-sm font-bold text-gray-200 tracking-tight group-hover:text-white transition-colors">{action.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>

          <div className="mt-10 p-8 bg-blue-600/5 rounded-[2.5rem] border border-blue-600/10 text-center hover:bg-blue-600/10 transition-all cursor-pointer group/bot relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none"></div>
            <Bot className="w-10 h-10 text-blue-500 mx-auto mb-5 group-hover/bot:scale-110 transition-transform duration-500" />
            <p className="text-[10px] font-black text-blue-400 mb-2 uppercase tracking-[0.2em]">{t('dashboard.intelligentAssistant')}</p>
            {aiProposalCount > 0 ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-base font-black text-emerald-400 tracking-tighter">
                  {aiProposalCount} {aiProposalCount === 1 ? t('dashboard.proposal') : t('dashboard.proposals')}
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-600 leading-relaxed uppercase font-black tracking-widest">
                {t('dashboard.monitoring247')}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* --- SECTION 4: PROACTIVE AI (PROPOSALS) --- */}
      {aiProposalCount > 0 && (
        <div className="mt-10 animate-in slide-in-from-bottom-10 duration-1000">
          <div className="flex items-center justify-between px-2 mb-8">
            <h2 className="text-sm font-black text-white p-2 flex items-center gap-4 uppercase tracking-widest">
              <Bot className="w-6 h-6 text-blue-500" />
              {t('dashboard.aiProposals')}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/20 to-transparent ml-6"></div>
          </div>
          <AIProposalPanel />
        </div>
      )}
    </div>
  );
};
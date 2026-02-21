import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Activity, PieChart, FileText, ArrowRight, ShieldCheck, Clock, Zap } from 'lucide-react';
import { useLocale } from '../../i18n/useLocale';

interface ReportDashboardProps {
    onNavigate: (section: string) => void;
}

export const ReportsDashboard: React.FC<ReportDashboardProps> = ({ onNavigate }) => {
    const { t } = useLocale();

    const REPORT_CATEGORIES = [
        {
            id: 'financial',
            title: t('reportsDashboard.financialCategory.title'),
            description: t('reportsDashboard.financialCategory.description'),
            color: 'emerald',
            reports: [
                { id: 'balance-sheet', title: t('reportsDashboard.financialCategory.balanceSheet.title'), icon: ShieldCheck, desc: t('reportsDashboard.financialCategory.balanceSheet.desc') },
                { id: 'income-statement', title: t('reportsDashboard.financialCategory.incomeStatement.title'), icon: TrendingUp, desc: t('reportsDashboard.financialCategory.incomeStatement.desc') },
                { id: 'cash-flow', title: t('reportsDashboard.financialCategory.cashFlow.title'), icon: DollarSign, desc: t('reportsDashboard.financialCategory.cashFlow.desc'), isNew: true },
            ]
        },
        {
            id: 'ledger',
            title: t('reportsDashboard.ledgerCategory.title'),
            description: t('reportsDashboard.ledgerCategory.description'),
            color: 'blue',
            reports: [
                { id: 'general-ledger', title: t('reportsDashboard.ledgerCategory.generalLedger.title'), icon: FileText, desc: t('reportsDashboard.ledgerCategory.generalLedger.desc') },
                { id: 'trial-balance', title: t('reportsDashboard.ledgerCategory.trialBalance.title'), icon: Activity, desc: t('reportsDashboard.ledgerCategory.trialBalance.desc') },
                { id: 'account-ledger', title: t('reportsDashboard.ledgerCategory.accountLedger.title'), icon: PieChart, desc: t('reportsDashboard.ledgerCategory.accountLedger.desc'), isNew: true },
            ]
        },
        {
            id: 'analysis',
            title: t('reportsDashboard.analysisCategory.title'),
            description: t('reportsDashboard.analysisCategory.description'),
            color: 'sun-orange',
            reports: [
                { id: 'aging-report', title: t('reportsDashboard.analysisCategory.agingReport.title'), icon: Clock, desc: t('reportsDashboard.analysisCategory.agingReport.desc'), isNew: true },
                { id: 'financial-reports', title: t('reportsDashboard.analysisCategory.financialRatios.title'), icon: Zap, desc: t('reportsDashboard.analysisCategory.financialRatios.desc') },
            ]
        }
    ];

    return (
        <div className="space-y-10 animate-fade-in px-2">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <BarChart3 className="w-8 h-8 text-blue-400" />
                        </div>
                        {t('reportsDashboard.title')}
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">{t('reportsDashboard.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {REPORT_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className={`h-8 w-1.5 rounded-full bg-${cat.color === 'sun-orange' ? 'sun-orange' : cat.color + '-500'}`}></div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">{cat.title}</h3>
                                <p className="text-sm text-slate-600 font-medium">{cat.description}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cat.reports.map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => onNavigate(report.id)}
                                    className="card-elite group cursor-pointer hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-blue-500/10 transition-colors">
                                                <report.icon className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                            {report.isNew && (
                                                <span className="badge-elite bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                                                    {t('reportsDashboard.new')}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-lg font-bold text-white mb-2 group-hover:translate-x-1 transition-transform">
                                            {report.title}
                                        </h4>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                            {report.desc}
                                        </p>
                                    </div>

                                    <div className="mt-8 flex items-center gap-2 text-xs font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {t('reportsDashboard.generate')}
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* FOOTER INFO */}
            <div className="p-8 border border-white/5 bg-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <span className="text-white font-bold block">{t('reportsDashboard.complianceTitle')}</span>
                        <p className="text-xs text-slate-600">{t('reportsDashboard.complianceDesc')}</p>
                    </div>
                </div>
                <div className="text-xs font-bold text-slate-600 tracking-wide text-center md:text-right">
                    {t('reportsDashboard.footerVersion')}<br />
                    ACCOUNTEXPRESS NEXT-GEN
                </div>
            </div>
        </div>
    );
};

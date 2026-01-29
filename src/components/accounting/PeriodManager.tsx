import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Lock,
    Unlock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    RefreshCw,
    Archive,
    ArrowUpRight,
    ShieldCheck,
    History
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
    getFiscalYears,
    getAccountingPeriods,
    reopenPeriod,
    FiscalYear,
    AccountingPeriod
} from '../../database/simple-db';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { PeriodClosingWizard } from './PeriodClosingWizard';

export const PeriodManager: React.FC = () => {
    const { user } = useAuth();
    const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
    const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);
    const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Wizard State
    const [wizardPeriod, setWizardPeriod] = useState<AccountingPeriod | null>(null);

    useEffect(() => {
        loadFiscalYears();
    }, []);

    const loadFiscalYears = async () => {
        const years = getFiscalYears();
        setFiscalYears(years);
        if (years.length > 0 && !selectedYear) {
            setSelectedYear(years[0]);
            loadPeriods(years[0].id!);
        }
    };

    const loadPeriods = async (yearId: number) => {
        setIsLoading(true);
        const p = getAccountingPeriods(yearId);
        setPeriods(p);
        setIsLoading(false);
    };

    const handleYearChange = (yearId: string) => {
        const year = fiscalYears.find(fy => fy.id === parseInt(yearId));
        if (year) {
            setSelectedYear(year);
            loadPeriods(year.id!);
        }
    };

    const handleReopen = async (period: AccountingPeriod) => {
        if (!user || user.role !== 'admin') {
            toast.error('Solo administradores pueden reabrir periodos');
            return;
        }

        if (!confirm(`¿REABRIR PERIODO? Esto permitirá nuevas transacciones en ${getMonthName(period.month)}. Se registrará en la auditoría.`)) {
            return;
        }

        setIsLoading(true);
        const result = await reopenPeriod(period.id!, user.id);
        setIsLoading(false);

        if (result.success) {
            toast.success(result.message);
            loadPeriods(selectedYear!.id!);
        } else {
            toast.error(result.message);
        }
    };

    const getMonthName = (month: number) => {
        return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2024, month - 1, 1));
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'open': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
            case 'closed': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'locked': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
                        <Archive className="w-8 h-8 text-blue-500" />
                        Cierres y Periodos Contables
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        Gobernanza de Información Financiera
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 px-3 border-r border-slate-800 mr-1">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Año Fiscal</span>
                    </div>
                    <select
                        className="bg-transparent text-white font-black text-sm px-2 py-1 outline-none appearance-none cursor-pointer"
                        value={selectedYear?.id || ''}
                        onChange={(e) => handleYearChange(e.target.value)}
                    >
                        {fiscalYears.map(fy => (
                            <option key={fy.id} value={fy.id} className="bg-slate-900">{fy.year}</option>
                        ))}
                    </select>
                    <Button
                        onClick={() => selectedYear && loadPeriods(selectedYear.id!)}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-white/5 text-slate-400 hover:text-white"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {periods.map(period => (
                    <Card key={period.id} className="bg-slate-900 border-slate-800 hover:border-slate-700/50 transition-all group relative overflow-hidden flex flex-col rounded-[2rem]">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-[0.03] group-hover:opacity-[0.07] transition-opacity ${period.status === 'open' ? 'from-emerald-500' : 'from-blue-500'
                            }`} />

                        <CardHeader className="pb-4 relative">
                            <div className="flex justify-between items-start">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-tighter ${getStatusStyles(period.status)}`}>
                                    {period.status === 'open' ? 'VIGENTE' : period.status === 'closed' ? 'CERRADO' : 'BLOQUEADO'}
                                </span>
                                <div className="p-2 bg-white/5 rounded-xl text-slate-500 group-hover:text-blue-400 transition-colors">
                                    <Calendar className="w-4 h-4" />
                                </div>
                            </div>
                            <CardTitle className="text-xl font-black text-white capitalize mt-4 tracking-tight">
                                {getMonthName(period.month)}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col justify-between relative mt-2">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Rango Cronológico</p>
                                    <p className="text-xs text-slate-400 font-bold">{new Date(period.start_date).toLocaleDateString()} al {new Date(period.end_date).toLocaleDateString()}</p>
                                </div>

                                {period.status === 'closed' && (
                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase">Integridad Validada</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold leading-normal">
                                            Sellado el {period.closed_at ? new Date(period.closed_at).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8">
                                {period.status === 'open' ? (
                                    <Button
                                        onClick={() => setWizardPeriod(period)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-2xl shadow-xl shadow-blue-900/10 group/btn overflow-hidden relative"
                                        disabled={isLoading}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            INICIAR CIERRE <ArrowUpRight className="w-4 h-4" />
                                        </span>
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleReopen(period)}
                                            variant="outline"
                                            className="flex-1 border-slate-800 text-slate-400 hover:text-white hover:bg-white/5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                            disabled={isLoading}
                                        >
                                            <Unlock className="w-3.5 h-3.5 mr-2" /> REABRIR
                                        </Button>
                                        <Button variant="outline" className="border-slate-800 text-slate-400 hover:text-white hover:bg-white/5 py-4 rounded-xl px-3">
                                            <History className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {periods.length === 0 && !isLoading && (
                <div className="text-center py-32 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800 space-y-4">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-slate-700" />
                    </div>
                    <div>
                        <h4 className="text-white font-black text-xl tracking-tight">Periodos no encontrados</h4>
                        <p className="text-slate-500 text-sm font-medium mt-1">Haga clic en el botón de recarga para intentarlo de nuevo o cambie de año fiscal.</p>
                    </div>
                </div>
            )}

            {/* Wizard Portal */}
            {wizardPeriod && selectedYear && (
                <PeriodClosingWizard
                    period={wizardPeriod}
                    year={selectedYear.year}
                    onClose={() => setWizardPeriod(null)}
                    onSuccess={() => {
                        setWizardPeriod(null);
                        loadPeriods(selectedYear.id!);
                    }}
                />
            )}
        </div>
    );
};

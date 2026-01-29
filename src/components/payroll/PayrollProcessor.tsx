import React, { useState, useEffect } from 'react';
import {
    Calculator,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Download,
    FileText,
    Play,
    Save,
    User,
    ArrowRight,
    Settings,
    ChevronRight,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import {
    getEmployees,
    getPayrollPeriods,
    getPayrollSettings,
    getTaxBrackets,
    createPayrollPeriod,
    createPayrollEntry,
    createJournalEntry,
    Employee,
    PayrollPeriod,
    PayrollSetting,
    TaxBracket
} from '../../database/simple-db';
import { calculateEmployeePayroll, CalculationResult } from '../../utils/payroll-tax-calculator';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PayrollSettings as PayrollSettingsTab } from './PayrollSettings';
import { PayrollEntryList } from './PayrollEntryList';

export const PayrollProcessor: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [settings, setSettings] = useState<PayrollSetting[]>([]);
    const [brackets, setBrackets] = useState<TaxBracket[]>([]);

    const [activeTab, setActiveTab] = useState<'periods' | 'process' | 'settings'>('periods');
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Selection and Form State
    const [selectedEmployees, setSelectedEmployees] = useState<Record<number, boolean>>({});
    const [periodMeta, setPeriodMeta] = useState({
        name: `Nómina - ${new Date().toLocaleString('es-ES', { month: 'long' })} ${new Date().getFullYear()}`,
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        pay_date: new Date().toISOString().split('T')[0],
        reference: `PAY-${Date.now().toString().slice(-4)}`
    });

    const loadData = () => {
        setEmployees(getEmployees());
        setPeriods(getPayrollPeriods());
        setSettings(getPayrollSettings());
        setBrackets(getTaxBrackets());
    };

    useEffect(() => {
        loadData();
    }, []);

    // Initialize all active employees as selected
    useEffect(() => {
        const initial: Record<number, boolean> = {};
        employees.filter(e => e.status === 'active').forEach(e => {
            initial[e.id] = true;
        });
        setSelectedEmployees(initial);
    }, [employees]);

    const toggleEmployee = (id: number) => {
        setSelectedEmployees(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Calculations for current selection
    const getCurrentPeriodTotals = () => {
        let totalGross = 0;
        let totalDeductions = 0;
        let totalNet = 0;

        employees.filter(e => selectedEmployees[e.id] && e.status === 'active').forEach(e => {
            const calc = calculateEmployeePayroll(e, settings, brackets);
            totalGross += calc.grossAmount;
            totalDeductions += calc.deductionsAmount;
            totalNet += calc.netAmount;
        });

        return { totalGross, totalDeductions, totalNet };
    };

    const { totalGross, totalDeductions, totalNet } = getCurrentPeriodTotals();

    const handleProcessPayroll = async () => {
        if (Object.values(selectedEmployees).filter(v => v).length === 0) {
            toast.error('Seleccione al menos un empleado para procesar');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create Period
            const periodRes = createPayrollPeriod({
                name: periodMeta.name,
                start_date: periodMeta.start_date,
                end_date: periodMeta.end_date,
                pay_date: periodMeta.pay_date,
                status: 'closed', // For demo simplicity we close it immediately
                total_gross: totalGross,
                total_net: totalNet
            });

            if (!periodRes.success || !periodRes.id) throw new Error(periodRes.message);

            const periodId = periodRes.id;

            // 2. Process each employee
            for (const emp of employees.filter(e => selectedEmployees[e.id] && e.status === 'active')) {
                const calc = calculateEmployeePayroll(emp, settings, brackets);

                createPayrollEntry({
                    employee_id: emp.id,
                    period_id: periodId,
                    gross_amount: calc.grossAmount,
                    deductions_amount: calc.deductionsAmount,
                    net_amount: calc.netAmount,
                    status: 'paid',
                    notes: `Pago de nómina ${periodMeta.name}`
                }, calc.lineItems);
            }

            // 3. Accounting Integration (One summary entry)
            // Account 5010: Salaries Expense, 2110: Salaries Payable
            const journalRes = createJournalEntry({
                entry_date: periodMeta.pay_date,
                description: `ASIENTO NÓMINA: ${periodMeta.name} - Ref: ${periodMeta.reference}`,
                reference_number: periodMeta.reference,
                total_debit: totalGross,
                total_credit: totalGross,
                is_balanced: true
            }, [
                { account_code: '5101', debit_amount: totalGross, credit_amount: 0, description: 'Gasto de Sueldos y Salarios' },
                { account_code: '2105', debit_amount: 0, credit_amount: totalDeductions, description: 'Retenciones por Pagar (Seguridad Social/ISR)' },
                { account_code: '1101', debit_amount: 0, credit_amount: totalNet, description: 'Sueldos por Pagar / Banco' }
            ]);

            toast.success('¡Nómina procesada e integrada a contabilidad con éxito!');
            setActiveTab('periods');
            loadData();
        } catch (error: any) {
            toast.error(`Error en procesamiento: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Calculator className="w-8 h-8 text-emerald-500" />
                        Procesamiento de Nómina
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Cálculo y Liquidación de Pagos</p>
                </div>

                <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('periods')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'periods' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Periodos
                    </button>
                    <button
                        onClick={() => setActiveTab('process')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'process' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Procesar Actual
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Configuración
                    </button>
                </div>
            </div>

            {activeTab === 'settings' ? (
                <PayrollSettingsTab />
            ) : activeTab === 'periods' ? (
                <div className="grid grid-cols-1 gap-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between">
                            <CardTitle className="text-white text-lg font-bold">Historial de Periodos</CardTitle>
                            <Button onClick={() => setActiveTab('process')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold">Nuevo Periodo</Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {selectedPeriodId ? (
                                <PayrollEntryList
                                    periodId={selectedPeriodId}
                                    onBack={() => setSelectedPeriodId(null)}
                                />
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                        <tr>
                                            <th className="px-6 py-4">Nombre del Periodo</th>
                                            <th className="px-6 py-4">Desde</th>
                                            <th className="px-6 py-4">Hasta</th>
                                            <th className="px-6 py-4">Fecha Pago</th>
                                            <th className="px-6 py-4">Estado</th>
                                            <th className="px-6 py-4 text-right">Total Neto</th>
                                            <th className="px-6 py-4">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {periods.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-20 text-center text-slate-600 italic">No existen periodos de nómina registrados.</td>
                                            </tr>
                                        ) : (
                                            periods.map(period => (
                                                <tr key={period.id} className="hover:bg-white/[0.02]">
                                                    <td className="px-6 py-4 font-bold text-white">{period.name}</td>
                                                    <td className="px-6 py-4 text-slate-400">{period.start_date}</td>
                                                    <td className="px-6 py-4 text-slate-400">{period.end_date}</td>
                                                    <td className="px-6 py-4 text-slate-400">{period.pay_date}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${period.status === 'closed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                            }`}>
                                                            {period.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-white">${period.total_net.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <button className="p-2 hover:bg-white/10 text-slate-300 rounded-lg transition-colors">
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedPeriodId(period.id)}
                                                                className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors" title="Ver Detalles"
                                                            >
                                                                <ArrowRight className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="border-b border-slate-800 flex justify-between items-center">
                                <CardTitle className="text-white text-lg font-bold">Previsualización de Nómina</CardTitle>
                                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full uppercase tracking-tighter">
                                    Calculando con Tasas Actuales
                                </span>
                            </CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                        <tr>
                                            <th className="px-6 py-4">Empleado</th>
                                            <th className="px-6 py-4 text-right">Bruto</th>
                                            <th className="px-6 py-4 text-right">Deducciones</th>
                                            <th className="px-6 py-4 text-right">Neto a Pagar</th>
                                            <th className="px-6 py-4 text-center">Proc.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {employees.filter(e => e.status === 'active').map(emp => {
                                            const calc = calculateEmployeePayroll(emp, settings, brackets);
                                            return (
                                                <tr key={emp.id} className={`hover:bg-white/[0.02] ${!selectedEmployees[emp.id] ? 'opacity-40' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-white">{emp.first_name} {emp.last_name}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase">{emp.position}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-slate-300">${calc.grossAmount.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-rose-400">-${calc.deductionsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-6 py-4 text-right font-mono font-black text-emerald-400">${calc.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!selectedEmployees[emp.id]}
                                                            onChange={() => toggleEmployee(emp.id)}
                                                            className="w-4 h-4 accent-emerald-500"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
                            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                            <div>
                                <h4 className="text-xs font-black text-amber-500 uppercase mb-1">Nota sobre Integración Contable</h4>
                                <p className="text-[10px] text-slate-500 leading-normal">
                                    Al procesar, el sistema agrupará todos los pagos en un solo asiento de diario resumido.
                                    Asegúrese de que el Plan de Cuentas tenga activas las cuentas de Gasto y Pasivo de Nómina.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-emerald-500 lg:sticky lg:top-8">
                            <CardHeader>
                                <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest leading-loose">Resumen de Ejecución</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 uppercase mb-2 block tracking-widest">Nombre del Periodo</label>
                                        <input
                                            type="text"
                                            value={periodMeta.name}
                                            onChange={(e) => setPeriodMeta(p => ({ ...p, name: e.target.value }))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-600 uppercase mb-2 block tracking-widest">Fecha Pago</label>
                                            <input
                                                type="date"
                                                value={periodMeta.pay_date}
                                                onChange={(e) => setPeriodMeta(p => ({ ...p, pay_date: e.target.value }))}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-600 uppercase mb-2 block tracking-widest">Referencia</label>
                                            <input
                                                type="text"
                                                value={periodMeta.reference}
                                                onChange={(e) => setPeriodMeta(p => ({ ...p, reference: e.target.value }))}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-white/[0.02] rounded-3xl border border-white/5 space-y-4 shadow-inner">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Total Bruto</span>
                                        <span className="text-sm font-black text-white">${totalGross.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Total Deducciones</span>
                                        <span className="text-sm font-black text-rose-500">-${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="h-px bg-white/5"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-emerald-500 uppercase">Neto a Liquidar</span>
                                        <span className="text-2xl font-black text-emerald-400 tracking-tighter">${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleProcessPayroll}
                                    disabled={isLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-7 rounded-2xl shadow-lg shadow-emerald-900/40 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                    {isLoading ? (
                                        <Clock className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Play className="w-4 h-4 fill-white" />
                                            <span>PROCESAR NÓMINA AHORA</span>
                                        </div>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2 text-[9px] text-slate-600 font-black uppercase tracking-widest">
                                    <ShieldCheck className="w-3 h-3" />
                                    Integridad de Datos Asegurada
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

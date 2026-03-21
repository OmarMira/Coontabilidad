import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Search,
    Mail,
    Phone,
    Briefcase,
    Calendar,
    DollarSign,
    MoreHorizontal,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    ShieldCheck,
    Activity,
    Cpu,
    Target,
    Layers,
    Info
} from 'lucide-react';
import { getEmployees, createEmployee, updateEmployee } from '@/database/modules/db-employees';
import type { Employee } from '@/database/modules/db-types';
import { toast } from 'react-hot-toast';
import { useLocale } from '../../i18n/useLocale';

export const EmployeeManager: React.FC = () => {
    const { t } = useLocale();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Employee>>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        salary_type: 'monthly',
        salary_rate: 0,
        status: 'active',
        hire_date: new Date().toISOString().split('T')[0]
    });

    const loadEmployees = () => {
        const data = getEmployees();
        setEmployees(data);
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let result;
            if (editingEmployee) {
                result = updateEmployee(editingEmployee.id, formData);
            } else {
                result = createEmployee(formData);
            }

            if (result.success) {
                toast.success(result.message);
                loadEmployees();
                setShowForm(false);
                setEditingEmployee(null);
                resetForm();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error(t('employeeManager.errorProcessing'));
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            department: '',
            position: '',
            salary_type: 'monthly',
            salary_rate: 0,
            status: 'active',
            hire_date: new Date().toISOString().split('T')[0]
        });
    };

    const filteredEmployees = employees.filter(emp =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active': return { label: t('employeeManager.status.active'), color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
            case 'inactive': return { label: t('employeeManager.status.inactive'), color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
            case 'on_leave': return { label: t('employeeManager.status.onLeave'), color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
            default: return { label: t('employeeManager.status.general'), color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-3.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-2xl backdrop-blur-xl group">
                        <Users className="w-7 h-7 text-indigo-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {t('employeeManager.title')}
                        </h2>
                        <p className="text-slate-500 text-[13px] flex items-center gap-2 mt-1">
                            <Zap className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> {t('employeeManager.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 justify-center">
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={t('employeeManager.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-indigo-500 focus:outline-none w-72 font-semibold tracking-widest text-[10px] transition-all"
                        />
                    </div>
                    <button
                        onClick={() => { setShowForm(true); setEditingEmployee(null); resetForm(); }}
                        className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold tracking-widest text-[10px] transition-all shadow-xl shadow-indigo-900/40 hover:-translate-y-1"
                    >
                        <UserPlus className="w-4 h-4" />
                        {t('employeeManager.recruitActive')}
                    </button>
                </div>
            </div>

            {/* Intelligence Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <EliteMiniCard title={t('employeeManager.totalWorkforce')} value={employees.length.toString()} icon={Users} color="indigo" />
                <EliteMiniCard title={t('employeeManager.activeOperatives')} value={employees.filter(e => e.status === 'active').length.toString()} icon={ShieldCheck} color="emerald" />
                <EliteMiniCard title={t('employeeManager.estMonthlyCost')} value={`$${employees.reduce((sum, e) => sum + (e.salary_type === 'monthly' ? e.salary_rate : 0), 0).toLocaleString()}`} icon={DollarSign} color="amber" />
                <EliteMiniCard title={t('employeeManager.departments')} value={Array.from(new Set(employees.map(e => e.department))).length.toString()} icon={Layers} color="rose" />
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-6 overflow-y-auto">
                    <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] shadow-3xl w-full max-w-5xl my-auto overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-700">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

                        <header className="flex items-center justify-between p-10 border-b border-slate-800 relative z-10 bg-slate-900/50">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-indigo-600/10 rounded-2.5xl border border-indigo-500/20 text-indigo-500 shadow-xl">
                                    <Cpu className="w-8 h-8 animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                                        {editingEmployee ? t('employeeManager.optimizeRecord') : t('employeeManager.registerNew')}
                                    </h2>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> {t('employeeManager.protocol')}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="p-10 space-y-12 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                <PremiumInput label={t('employeeManager.form.firstName')} icon={UserPlus} value={formData.first_name} onChange={(v: string) => handleInputChange('first_name', v)} placeholder="JOHN / JANE" required />
                                <PremiumInput label={t('employeeManager.form.lastName')} icon={Target} value={formData.last_name} onChange={(v: string) => handleInputChange('last_name', v)} placeholder="DOE / SMITH" required />
                                <PremiumInput label={t('employeeManager.form.email')} icon={Mail} value={formData.email} onChange={(v: string) => handleInputChange('email', v)} placeholder="JOHN@CORP.COM" />
                                <PremiumInput label={t('employeeManager.form.phone')} icon={Phone} value={formData.phone} onChange={(v: string) => handleInputChange('phone', v)} placeholder="+1 XXX XXX XXXX" />
                                <PremiumInput label={t('employeeManager.form.department')} icon={Layers} value={formData.department} onChange={(v: string) => handleInputChange('department', v)} placeholder="VENTAS / TECNOLOGÍA" />
                                <PremiumInput label={t('employeeManager.form.position')} icon={Briefcase} value={formData.position} onChange={(v: string) => handleInputChange('position', v)} placeholder="PROJECT MANAGER" />

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <Activity className="w-3.5 h-3.5 text-indigo-500" /> {t('employeeManager.form.salaryClassification')}
                                    </label>
                                    <select
                                        name="salary_type"
                                        value={formData.salary_type}
                                        onChange={(e) => handleInputChange('salary_type', e.target.value)}
                                        className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl border border-slate-800 focus:border-indigo-500 focus:outline-none font-black uppercase tracking-widest text-[10px] h-[58px] appearance-none cursor-pointer"
                                    >
                                        <option value="monthly">{t('employeeManager.form.monthlySalary')}</option>
                                        <option value="hourly">{t('employeeManager.form.hourlyRate')}</option>
                                    </select>
                                </div>

                                <PremiumInput label={t('employeeManager.form.grossAmount')} icon={DollarSign} value={formData.salary_rate?.toString()} onChange={(v: string) => handleInputChange('salary_rate', parseFloat(v) || 0)} type="number" />

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <Activity className="w-3.5 h-3.5 text-indigo-500" /> {t('employeeManager.form.operationalStatus')}
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                        className="w-full bg-slate-950 text-white px-6 py-4 rounded-2xl border border-slate-800 focus:border-indigo-500 focus:outline-none font-black uppercase tracking-widest text-[10px] h-[58px] appearance-none cursor-pointer"
                                    >
                                        <option value="active">{t('employeeManager.status.active')}</option>
                                        <option value="inactive">{t('employeeManager.status.inactive')}</option>
                                        <option value="on_leave">{t('employeeManager.status.onLeave')}</option>
                                    </select>
                                </div>
                            </div>

                            <footer className="flex justify-end gap-6 pt-10 border-t border-slate-800">
                                <button type="button" onClick={() => setShowForm(false)} className="px-10 py-5 bg-slate-900 border border-slate-800 text-slate-400 rounded-2.5xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all">
                                    {t('employeeManager.form.abort')}
                                </button>
                                <button type="submit" disabled={isLoading} className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-indigo-900/40 hover:-translate-y-1 active:scale-95 disabled:opacity-50">
                                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle className="w-5 h-5" />}
                                    {editingEmployee ? t('employeeManager.form.sync') : t('employeeManager.form.deploy')}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredEmployees.length === 0 ? (
                    <div className="col-span-full bg-slate-900/20 border border-dashed border-slate-800 rounded-[3rem] py-32 text-center group">
                        <Users className="w-20 h-20 text-slate-800 mx-auto mb-6 group-hover:scale-110 transition-transform duration-500" />
                        <h3 className="text-xl font-black text-slate-500 uppercase tracking-[0.2em]">{t('employeeManager.notFoundTitle')}</h3>
                    </div>
                ) : (
                    filteredEmployees.map(emp => {
                        const status = getStatusConfig(emp.status);
                        return (
                            <div key={emp.id} className="relative bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-800 hover:border-indigo-500/40 transition-all duration-500 group overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-900/20">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-700"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-950 border-2 border-slate-800 rounded-2.2xl flex items-center justify-center shadow-lg group-hover:border-indigo-500/50 transition-colors">
                                                <span className="text-indigo-500 font-black text-2xl">{emp.first_name[0]}{emp.last_name[0]}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-1.5 group-hover:text-indigo-400 transition-colors">{emp.first_name} {emp.last_name}</h3>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{emp.employee_number}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2.5 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${status.bg} ${status.color} ${status.border}`}>
                                            {status.label}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <EmployeeStat label={t('employeeManager.card.position')} value={emp.position || 'N/A'} icon={Briefcase} />
                                        <EmployeeStat label={t('employeeManager.card.dept')} value={emp.department || 'N/A'} icon={Layers} />
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-slate-800/60">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <DollarSign className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">{t('employeeManager.card.compensation')}</span>
                                            </div>
                                            <div className="text-lg font-black text-white font-mono tracking-tighter">
                                                ${emp.salary_rate.toLocaleString()} <span className="text-[8px] text-slate-500">{emp.salary_type === 'monthly' ? t('employeeManager.form.monthlySalary') : t('employeeManager.form.hourlyRate')}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">{t('employeeManager.card.contact')}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 truncate max-w-[150px]">{emp.email || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-8 pt-6 border-t border-slate-800/60">
                                        <button
                                            onClick={() => { setEditingEmployee(emp); setFormData(emp); setShowForm(true); }}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-950 border border-slate-800 rounded-xl text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
                                        >
                                            <Edit className="w-3.5 h-3.5" /> {t('employeeManager.card.optimize')}
                                        </button>
                                        <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-lg">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div >
    );
};

const EliteMiniCard = ({ title, value, icon: Icon, color }: any) => {
    const themes: any = {
        indigo: 'text-indigo-500 bg-indigo-600/10 border-indigo-500/20 shadow-indigo-900/5',
        emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/20 shadow-emerald-900/5',
        amber: 'text-amber-500 bg-amber-600/10 border-amber-500/20 shadow-amber-900/5',
        rose: 'text-rose-500 bg-rose-600/10 border-rose-500/20 shadow-rose-900/5',
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl hover:border-slate-700 transition-all flex items-center gap-6 group">
            <div className={`p-4 rounded-2.5xl border ${themes[color]} group-hover:scale-110 transition-all duration-500 shadow-xl`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
                <div className="text-2xl font-black text-white tracking-tighter leading-none mb-1 font-mono uppercase truncate">{value}</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{title}</div>
            </div>
        </div>
    );
};

const EmployeeStat = ({ label, value, icon: Icon }: any) => (
    <div className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-2.2xl group/stat hover:border-slate-700 transition-colors">
        <div className="flex items-center gap-2 mb-1">
            <Icon className="w-3 h-3 text-indigo-500" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        </div>
        <p className="text-[10px] font-black text-white uppercase truncate">{value}</p>
    </div>
);

const PremiumInput = ({ label, icon: Icon, value, error, onChange, placeholder, type = "text", required }: any) => (
    <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
            <Icon className={`w-3.5 h-3.5 ${error ? 'text-rose-500' : 'text-indigo-500'}`} /> {label} {required && '*'}
        </label>
        <div className="relative group/input">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-slate-950 text-white px-8 py-4 rounded-2xl border transition-all font-black uppercase tracking-widest text-[10px] placeholder:text-slate-800 focus:outline-none ${error ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-slate-800 focus:border-indigo-500 focus:shadow-[0_0_25px_rgba(79,70,229,0.1)] group-hover/input:border-slate-700'
                    }`}
                placeholder={placeholder}
                required={required}
            />
            {error && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2 ml-2">{error}</p>}
        </div>
    </div>
);

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
    Clock
} from 'lucide-react';
import { getEmployees, createEmployee, updateEmployee, Employee } from '../../database/simple-db';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export const EmployeeManager: React.FC = () => {
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
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
            toast.error('Error al procesar empleado');
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
        emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Users className="w-8 h-8 text-indigo-500" />
                        Gestión de Empleados
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Directorio y Fuerza Laboral</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                        />
                    </div>
                    <Button
                        onClick={() => { setShowForm(true); setEditingEmployee(null); resetForm(); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Nuevo Empleado
                    </Button>
                </div>
            </div>

            {showForm && (
                <Card className="bg-slate-900 border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre</label>
                                    <input name="first_name" value={formData.first_name} onChange={handleInputChange} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Apellidos</label>
                                    <input name="last_name" value={formData.last_name} onChange={handleInputChange} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Teléfono</label>
                                    <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Departamento</label>
                                    <input name="department" value={formData.department} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Puesto</label>
                                    <input name="position" value={formData.position} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Salario</label>
                                    <select name="salary_type" value={formData.salary_type} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500">
                                        <option value="monthly">Mensual</option>
                                        <option value="hourly">Por Hora</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tasa Salarial</label>
                                    <input type="number" step="0.01" name="salary_rate" value={formData.salary_rate} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500">
                                        <option value="active">Activo</option>
                                        <option value="inactive">Inactivo</option>
                                        <option value="on_leave">Licencia</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <Button variant="ghost" type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">Cancelar</Button>
                                <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8">
                                    {isLoading ? 'Procesando...' : editingEmployee ? 'Actualizar Empleado' : 'Registrar Empleado'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                        <Users className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest">No se encontraron empleados</p>
                    </div>
                ) : (
                    filteredEmployees.map(emp => (
                        <Card key={emp.id} className="bg-slate-900/50 border-slate-800 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all"></div>

                            <CardContent className="p-6 relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                            <span className="text-indigo-400 font-black text-xl">{emp.first_name[0]}{emp.last_name[0]}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-none">{emp.first_name} {emp.last_name}</h3>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{emp.employee_number}</p>
                                        </div>
                                    </div>

                                    <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${emp.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                            emp.status === 'inactive' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                                'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                        }`}>
                                        {emp.status}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        <span className="text-xs font-semibold">{emp.position || 'Sin Puesto'} • {emp.department || 'General'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span className="text-xs truncate">{emp.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        <span className="text-xs font-black text-white">${emp.salary_rate.toLocaleString()} <span className="text-[9px] text-slate-500 uppercase">{emp.salary_type === 'monthly' ? '/ MES' : '/ HORA'}</span></span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-slate-800/50">
                                    <button
                                        onClick={() => { setEditingEmployee(emp); setFormData(emp); setShowForm(true); }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                                    >
                                        <Edit className="w-3.5 h-3.5" /> Editar
                                    </button>
                                    <button className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

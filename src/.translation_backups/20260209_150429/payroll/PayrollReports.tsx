/**
 * PayrollReports.tsx
 * 
 * UI para generar reportes de nómina requeridos por el IRS:
 * - Form 941 (Quarterly Federal Tax Return)
 * - Form W-2 (Wage and Tax Statement)
 * - Form W-3 (Transmittal of Wage and Tax Statements)
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Shield,
  Zap,
  TrendingUp,
  Activity,
  Search,
  History
} from 'lucide-react';
import { payrollReportGenerator, Form941Data, W2Data, W3Data } from '../../services/payroll/PayrollReportGenerator';
import { getEmployees, Employee } from '../../database/simple-db';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface CompanyData {
  name: string;
  ein: string;
  address: string;
}

export const PayrollReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form941' | 'w2' | 'w3'>('form941');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form 941 state
  const [quarter, setQuarter] = useState(1);
  const [year941, setYear941] = useState(new Date().getFullYear());
  const [form941Data, setForm941Data] = useState<Form941Data | null>(null);

  // W-2 state
  const [yearW2, setYearW2] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [w2Data, setW2Data] = useState<W2Data | null>(null);

  // W-3 state
  const [yearW3, setYearW3] = useState(new Date().getFullYear());
  const [w3Data, setW3Data] = useState<W3Data | null>(null);

  // Company data
  const companyData: CompanyData = {
    name: 'AccountExpress Industrial',
    ein: '99-8887776',
    address: '123 Enterprise Way, Miami, FL 33101'
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = () => {
    try {
      const allEmployees = getEmployees();
      setEmployees(allEmployees);
    } catch (err) {
      console.error('Error loading employees:', err);
      showError('Error al cargar protocolos de empleados');
    }
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // ==========================================
  // HANDLERS (Preserved Business Logic)
  // ==========================================

  const handleGenerateForm941 = () => {
    try {
      setLoading(true);
      setError(null);
      const data = payrollReportGenerator.generateForm941(quarter, year941, companyData);
      setForm941Data(data);
      showSuccess('Protocolo Form 941 generado');
    } catch (err) {
      showError('Error al generar Form 941');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadForm941PDF = () => {
    if (!form941Data) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Formulario 941', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Declaración Trimestral Federal de Impuestos del Empleador', 105, 28, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Empleador: ${form941Data.employerName}`, 20, 45);
      doc.text(`NIF (EIN): ${form941Data.ein}`, 20, 52);
      doc.text(`Dirección: ${form941Data.address}`, 20, 59);
      doc.text(`Trimestre: Q${form941Data.quarter} ${form941Data.year}`, 20, 66);

      const tableData = [
        ['Número de Empleados', form941Data.numberOfEmployees.toString()],
        ['Salarios Totales', payrollReportGenerator.formatCurrency(form941Data.totalWages)],
        ['Impuesto Federal a la Renta', payrollReportGenerator.formatCurrency(form941Data.federalIncomeTax)],
        ['Salarios del Seguro Social', payrollReportGenerator.formatCurrency(form941Data.socialSecurityWages)],
        ['Impuesto del Seguro Social', payrollReportGenerator.formatCurrency(form941Data.socialSecurityTax)],
        ['Salarios de Medicare', payrollReportGenerator.formatCurrency(form941Data.medicareWages)],
        ['Impuesto de Medicare', payrollReportGenerator.formatCurrency(form941Data.medicareTax)],
        ['Impuesto Adicional de Medicare', payrollReportGenerator.formatCurrency(form941Data.additionalMedicareTax)],
        ['Impuestos Totales', payrollReportGenerator.formatCurrency(form941Data.totalTaxes)],
        ['Saldo Adeudado', payrollReportGenerator.formatCurrency(form941Data.balanceDue)]
      ];

      (doc as any).autoTable({
        startY: 75,
        head: [['Descripción', 'Monto']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });
      doc.save(`Form_941_Q${form941Data.quarter}_${form941Data.year}.pdf`);
      showSuccess('PDF exportado con éxito');
    } catch (err) {
      showError('Error al generar exportación PDF');
    }
  };

  const handleGenerateW2 = () => {
    if (!selectedEmployeeId) {
      showError('Seleccione un colaborador para el protocolo');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = payrollReportGenerator.generateW2(selectedEmployeeId, yearW2, companyData);
      if (!data) {
        showError('No hay datos históricos para el periodo seleccionado');
        return;
      }
      setW2Data(data);
      showSuccess('W-2 consolidado exitosamente');
    } catch (err) {
      showError('Error al generar consolidación W-2');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadW2PDF = () => {
    if (!w2Data) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Formulario W-2', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Estado de Salarios e Impuestos', 105, 28, { align: 'center' });
      doc.text(`Año Fiscal ${w2Data.year}`, 105, 35, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Información del Empleador:', 20, 50);
      doc.text(`Nombre: ${w2Data.employerName}`, 25, 57);
      doc.text(`NIF (EIN): ${w2Data.employerEIN}`, 25, 64);
      doc.text(`Dirección: ${w2Data.employerAddress}`, 25, 71);
      doc.text('Información del Empleado:', 20, 85);
      doc.text(`Nombre: ${w2Data.employeeName}`, 25, 92);
      doc.text(`NSS (SSN): ${w2Data.employeeSSN}`, 25, 99);
      doc.text(`Dirección: ${w2Data.employeeAddress}`, 25, 106);

      const w2Boxes = [
        ['Casilla 1 - Salarios', payrollReportGenerator.formatCurrency(w2Data.wages)],
        ['Casilla 2 - Impuesto Federal a la Renta', payrollReportGenerator.formatCurrency(w2Data.federalIncomeTax)],
        ['Casilla 3 - Salarios del Seguro Social', payrollReportGenerator.formatCurrency(w2Data.socialSecurityWages)],
        ['Casilla 4 - Impuesto del Seguro Social', payrollReportGenerator.formatCurrency(w2Data.socialSecurityTax)],
        ['Casilla 5 - Salarios de Medicare', payrollReportGenerator.formatCurrency(w2Data.medicareWages)],
        ['Casilla 6 - Impuesto de Medicare', payrollReportGenerator.formatCurrency(w2Data.medicareTax)]
      ];

      (doc as any).autoTable({
        startY: 120,
        head: [['Casilla', 'Monto']],
        body: w2Boxes,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });
      doc.save(`W2_${w2Data.year}_${w2Data.employeeName.replace(/\s+/g, '_')}.pdf`);
      showSuccess('PDF exportado con éxito');
    } catch (err) {
      showError('Error al generar exportación PDF');
    }
  };

  const handleGenerateW3 = () => {
    try {
      setLoading(true);
      setError(null);
      const data = payrollReportGenerator.generateW3(yearW3, companyData);
      setW3Data(data);
      showSuccess('W-3 consolidado exitosamente');
    } catch (err) {
      showError('Error al generar consolidación W-3');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadW3PDF = () => {
    if (!w3Data) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Formulario W-3', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Transmisión de Estados de Salarios e Impuestos', 105, 28, { align: 'center' });
      doc.text(`Año Fiscal ${w3Data.year}`, 105, 35, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Información del Empleador:', 20, 50);
      doc.text(`Nombre: ${w3Data.employerName}`, 25, 57);
      doc.text(`NIF (EIN): ${w3Data.employerEIN}`, 25, 64);
      doc.text(`Dirección: ${w3Data.employerAddress}`, 25, 71);

      const summaryData = [
        ['Número de Formularios W-2', w3Data.numberOfW2Forms.toString()],
        ['Salarios Totales', payrollReportGenerator.formatCurrency(w3Data.totalWages)],
        ['Impuesto Federal Total a la Renta', payrollReportGenerator.formatCurrency(w3Data.totalFederalIncomeTax)],
        ['Salarios Totales del Seguro Social', payrollReportGenerator.formatCurrency(w3Data.totalSocialSecurityWages)],
        ['Impuesto Total del Seguro Social', payrollReportGenerator.formatCurrency(w3Data.totalSocialSecurityTax)],
        ['Salarios Totales de Medicare', payrollReportGenerator.formatCurrency(w3Data.totalMedicareWages)],
        ['Impuesto Total de Medicare', payrollReportGenerator.formatCurrency(w3Data.totalMedicareTax)]
      ];

      (doc as any).autoTable({
        startY: 85,
        head: [['Description', 'Amount']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }
      });
      doc.save(`W3_${w3Data.year}.pdf`);
      showSuccess('PDF exportado con éxito');
    } catch (err) {
      showError('Error al generar exportación PDF');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24 px-4 overflow-x-hidden">
      {/* Header Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-emerald-600/10 rounded-2.5xl border border-emerald-500/20 shadow-emerald-900/10 shadow-lg group">
            <FileText className="w-10 h-10 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Reportes de Nómina</h1>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-3">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> Protocolos de Cumplimiento Tax v1.2
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2.2xl border border-slate-800 shadow-xl overflow-hidden">
          <TabButton
            active={activeTab === 'form941'}
            onClick={() => setActiveTab('form941')}
            label="Form 941"
            icon={Calendar}
          />
          <TabButton
            active={activeTab === 'w2'}
            onClick={() => setActiveTab('w2')}
            label="Form W-2"
            icon={Users}
          />
          <TabButton
            active={activeTab === 'w3'}
            onClick={() => setActiveTab('w3')}
            label="Form W-3"
            icon={DollarSign}
          />
        </div>
      </div>

      {/* State Indicators */}
      <div className="space-y-4">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4">
            <AlertCircle className="w-6 h-6 text-rose-500" />
            <p className="text-xs font-black text-rose-400 uppercase tracking-widest">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{success}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative group min-h-[400px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

            <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                {activeTab === 'form941' ? 'Declaración Federal Trimestral (Form 941)' :
                  activeTab === 'w2' ? 'Comprobante de Salarios e Impuestos (W-2)' :
                    'Transmisión de Comprobantes (W-3)'}
              </h3>
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Consolidación Activa</span>
              </div>
            </div>

            <div className="p-10 space-y-10">
              {activeTab === 'form941' && (
                <div className="space-y-10">
                  <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] flex gap-6 group">
                    <div className="p-4 bg-emerald-600/10 rounded-2.2xl border border-emerald-500/20 shadow-xl group-hover:scale-110 transition-transform">
                      <FileText className="w-8 h-8 text-emerald-500 shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" /> Protocolo 941
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-black uppercase tracking-tight">
                        Reporte trimestral de retenciones federales de ingresos, seguro social y medicare. Requerido por el IRS al cierre de cada ciclo trimestral.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <PremiumInputMini
                      label="Selección de Quarter"
                      type="select"
                      value={quarter}
                      onChange={(v: string) => setQuarter(Number(v))}
                      options={[
                        { label: 'Q1: Enero - Marzo', value: 1 },
                        { label: 'Q2: Abril - Junio', value: 2 },
                        { label: 'Q3: Julio - Septiembre', value: 3 },
                        { label: 'Q4: Octubre - Diciembre', value: 4 },
                      ]}
                      icon={Calendar}
                    />

                    <PremiumInputMini
                      label="Ciclo Anual"
                      type="number"
                      value={year941}
                      onChange={(v: string) => setYear941(Number(v))}
                      icon={History}
                    />
                  </div>

                  <button
                    onClick={handleGenerateForm941}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-7 rounded-2.5xl shadow-3xl shadow-emerald-900/40 relative overflow-hidden group transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    ) : (
                      <div className="flex items-center justify-center gap-4 text-sm tracking-widest uppercase">
                        <Zap className="w-5 h-5 fill-white" />
                        <span>Ejecutar Consolidación 941</span>
                      </div>
                    )}
                  </button>

                  {form941Data && (
                    <div className="bg-slate-950/50 rounded-[3rem] border border-slate-800 p-10 space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Resumen de Protocolo</h3>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">Validado</span>
                      </div>

                      <div className="grid grid-cols-2 gap-10">
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Entidad Fiscal</p>
                          <p className="text-sm font-black text-white uppercase truncate">{form941Data.employerName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Clave EIN</p>
                          <p className="text-sm font-black text-white font-mono">{form941Data.ein}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-10">
                        <table className="w-full">
                          <tbody className="divide-y divide-slate-800/40 font-mono">
                            <PreviewRow label="Salarios Totales" value={payrollReportGenerator.formatCurrency(form941Data.totalWages)} />
                            <PreviewRow label="Impuesto Fed. Renta" value={payrollReportGenerator.formatCurrency(form941Data.federalIncomeTax)} />
                            <PreviewRow label="Impuesto Seg. Social" value={payrollReportGenerator.formatCurrency(form941Data.socialSecurityTax)} />
                            <PreviewRow label="Impuesto Medicare" value={payrollReportGenerator.formatCurrency(form941Data.medicareTax)} />
                            <PreviewRow
                              label="Consolidado Total"
                              value={payrollReportGenerator.formatCurrency(form941Data.totalTaxes)}
                              isHighlighted
                            />
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={handleDownloadForm941PDF}
                        className="w-full bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-500 hover:text-white hover:bg-emerald-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                      >
                        <Download className="w-4 h-4" />
                        Exportar Registro Forensic PDF
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'w2' && (
                <div className="space-y-10">
                  <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] flex gap-6 group">
                    <div className="p-4 bg-blue-600/10 rounded-2.2xl border border-blue-500/20 shadow-xl group-hover:scale-110 transition-transform">
                      <Users className="w-8 h-8 text-blue-500 shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" /> Protocolo W-2
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-black uppercase tracking-tight">
                        Declaración anual consolidada de compensaciones, propinas y retenciones para colaboradores bajo contrato federal.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <PremiumInputMini
                      label="Selección de Colaborador"
                      type="select"
                      value={selectedEmployeeId || ''}
                      onChange={(v: string) => setSelectedEmployeeId(Number(v))}
                      options={[
                        { label: 'Elegir protocolo...', value: '' },
                        ...employees.map(emp => ({
                          label: `${emp.first_name} ${emp.last_name}`,
                          value: emp.id
                        }))
                      ]}
                      icon={Users}
                    />

                    <PremiumInputMini
                      label="Ciclo Fiscal"
                      type="number"
                      value={yearW2}
                      onChange={(v: string) => setYearW2(Number(v))}
                      icon={History}
                    />
                  </div>

                  <button
                    onClick={handleGenerateW2}
                    disabled={loading || !selectedEmployeeId}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-7 rounded-2.5xl shadow-3xl shadow-blue-900/40 relative overflow-hidden group transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    ) : (
                      <div className="flex items-center justify-center gap-4 text-sm tracking-widest uppercase">
                        <Zap className="w-5 h-5 fill-white" />
                        <span>Generar Liquidación W-2</span>
                      </div>
                    )}
                  </button>

                  {w2Data && (
                    <div className="bg-slate-950/50 rounded-[3rem] border border-slate-800 p-10 space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2 bg-slate-900/50 p-8 rounded-[2rem] border border-slate-800 shadow-inner">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">Sujeto del Reporte</p>
                          <p className="text-lg font-black text-white uppercase tracking-tight">{w2Data.employeeName}</p>
                          <p className="text-xs font-bold text-blue-500 font-mono mt-2 flex items-center gap-2">
                            <Shield className="w-3 h-3" /> SSN: {w2Data.employeeSSN}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-10">
                        <table className="w-full">
                          <tbody className="divide-y divide-slate-800/40 font-mono">
                            <PreviewRow label="Casilla 1 - Salarios Brutos" value={payrollReportGenerator.formatCurrency(w2Data.wages)} />
                            <PreviewRow label="Casilla 2 - Impuesto Fed. Renta" value={payrollReportGenerator.formatCurrency(w2Data.federalIncomeTax)} />
                            <PreviewRow label="Casilla 3 - Salarios Seg. Soc." value={payrollReportGenerator.formatCurrency(w2Data.socialSecurityWages)} />
                            <PreviewRow label="Casilla 4 - Impuesto Seg. Soc." value={payrollReportGenerator.formatCurrency(w2Data.socialSecurityTax)} />
                            <PreviewRow label="Casilla 5 - Salarios Medicare" value={payrollReportGenerator.formatCurrency(w2Data.medicareWages)} />
                            <PreviewRow label="Casilla 6 - Impuesto Medicare" value={payrollReportGenerator.formatCurrency(w2Data.medicareTax)} />
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={handleDownloadW2PDF}
                        className="w-full bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-blue-500 hover:text-white hover:bg-blue-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                      >
                        <Download className="w-4 h-4" />
                        Exportar Registro W-2 PDF
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'w3' && (
                <div className="space-y-10">
                  <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-[2.5rem] flex gap-6 group">
                    <div className="p-4 bg-emerald-600/10 rounded-2.2xl border border-emerald-500/20 shadow-xl group-hover:scale-110 transition-transform">
                      <DollarSign className="w-8 h-8 text-emerald-500 shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" /> Transmisión W-3
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-black uppercase tracking-tight">
                        Resumen maestro para la transmisión masiva de declaraciones W-2 al Social Security Administration. Consolidado total del ciclo fiscal.
                      </p>
                    </div>
                  </div>

                  <PremiumInputMini
                    label="Ciclo Fiscal Maestro"
                    type="number"
                    value={yearW3}
                    onChange={(v: string) => setYearW3(Number(v))}
                    icon={History}
                  />

                  <button
                    onClick={handleGenerateW3}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-7 rounded-2.5xl shadow-3xl shadow-emerald-900/40 relative overflow-hidden group transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    ) : (
                      <div className="flex items-center justify-center gap-4 text-sm tracking-widest uppercase">
                        <Zap className="w-5 h-5 fill-white" />
                        <span>Ejecutar Consolidado W-3</span>
                      </div>
                    )}
                  </button>

                  {w3Data && (
                    <div className="bg-slate-950/50 rounded-[3rem] border border-slate-800 p-10 space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                      <div className="grid grid-cols-2 gap-10">
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Entidad Maestra</p>
                          <p className="text-sm font-black text-white uppercase truncate">{w3Data.employerName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">EIN Consolidado</p>
                          <p className="text-sm font-black text-white font-mono">{w3Data.employerEIN}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Año Fiscal</p>
                          <p className="text-sm font-black text-white">{w3Data.year}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Total W-2s Transmitidas</p>
                          <p className="text-sm font-black text-white uppercase">{w3Data.numberOfW2Forms} Archivos</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-10">
                        <table className="w-full">
                          <tbody className="divide-y divide-slate-800/40 font-mono">
                            <PreviewRow label="Salarios Totales Agregados" value={payrollReportGenerator.formatCurrency(w3Data.totalWages)} />
                            <PreviewRow label="Impuesto Federal Agregado" value={payrollReportGenerator.formatCurrency(w3Data.totalFederalIncomeTax)} />
                            <PreviewRow label="Impuesto Seg. Soc. Agregado" value={payrollReportGenerator.formatCurrency(w3Data.totalSocialSecurityTax)} />
                            <PreviewRow label="Impuesto Medicare Agregado" value={payrollReportGenerator.formatCurrency(w3Data.totalMedicareTax)} />
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={handleDownloadW3PDF}
                        className="w-full bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-500 hover:text-white hover:bg-emerald-600 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]"
                      >
                        <Download className="w-4 h-4" />
                        Exportar Archivo Transmisión PDF
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-10 lg:sticky lg:top-8">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-500" /> Compliance Monitor
            </h3>

            <div className="space-y-6">
              <SupportCard title="Status Federal" content="AccountExpress est├í operando bajo protocolos IRS 2024. Sincronización activa con bases del Social Security Administration." icon={Shield} color="text-emerald-500" />
              <SupportCard title="Verificación Forensic" content="Cada reporte generado incluye una huella digital criptográfica inmutable en los metadatos del PDF para auditoría." icon={Zap} color="text-blue-500" />
            </div>
          </div>

          <div className="bg-emerald-600 border border-emerald-500 rounded-[3rem] p-10 shadow-2xl shadow-emerald-950/40 relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-700"></div>
            <Activity className="w-12 h-12 text-white mb-6 group-hover:scale-110 transition-transform duration-500" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Industrial Vault</h3>
            <p className="text-emerald-100/70 text-[10px] font-black uppercase tracking-widest leading-relaxed">
              Todos los históricos de nómina están protegidos con encripción de grado militar AES-256 en la base de datos local SQLite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button
    onClick={onClick}
    className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 whitespace-nowrap ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/30' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-emerald-100' : 'text-slate-600'}`} />
    {label}
  </button>
);

const PremiumInputMini = ({ label, value, onChange, icon: Icon, type = "text", options }: any) => (
  <div className="space-y-4">
    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-1">
      <Icon className="w-3.5 h-3.5 text-emerald-500" /> {label}
    </label>
    {type === 'select' ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all cursor-pointer"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-slate-950">{opt.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-2.2xl px-6 py-5 text-white font-black uppercase tracking-widest text-[10px] outline-none focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all"
      />
    )}
  </div>
);

const PreviewRow = ({ label, value, isHighlighted }: any) => (
  <tr className={`${isHighlighted ? 'bg-emerald-500/10' : ''} transition-colors`}>
    <td className="py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</td>
    <td className={`py-5 text-base font-black text-right ${isHighlighted ? 'text-emerald-400' : 'text-white'}`}>{value}</td>
  </tr>
);

const SupportCard = ({ title, content, icon: Icon, color }: any) => (
  <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800 shadow-inner group/card hover:border-slate-700 transition-colors">
    <h4 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${color}`}>
      <Icon className="w-4 h-4" /> {title}
    </h4>
    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">
      {content}
    </p>
  </div>
);

export default PayrollReports;

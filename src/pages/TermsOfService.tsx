import React from 'react';
import { Shield, FileText, Scale, Mail, MapPin } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <header className="border-b border-slate-800 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30">
              <Scale className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">Términos de Servicio</h1>
          </div>
          <p className="text-slate-400 font-medium">Última actualización: Marzo 2026 • Account Express</p>
        </header>

        {/* Content Sections */}
        <div className="space-y-10 leading-relaxed">
          
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              1. Descripción del Servicio
            </h2>
            <p>
              Account Express es una plataforma de gestión contable diseñada para pequeñas y medianas empresas en el estado de Florida, USA. 
              El servicio incluye herramientas de contabilidad general, gestión de inventarios, procesamiento de facturación y cumplimiento fiscal básico.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              2. Limitación de Responsabilidad Fiscal
            </h2>
            <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-2xl">
              <p className="font-bold text-blue-400 mb-4">[PLACEHOLDER — requiere revisión legal]</p>
              <p>
                Aunque Account Express proporciona herramientas para el cálculo de impuestos como el Florida Sales Tax (DR-15), 
                el usuario reconoce que el sistema es una herramienta de apoyo y no sustituye el juicio profesional de un contador público certificado (CPA) 
                o asesor legal. La responsabilidad final por la exactitud de las declaraciones fiscales recae exclusivamente en el usuario.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              3. Disclaimer de Nómina y Cálculos Fiscales
            </h2>
            <p>
              Las herramientas de nómina y cálculos de impuestos federales (FICA, Medicare, Retenciones Federales) se proporcionan para fines de estimación y gestión interna. 
              Account Express no garantiza la actualización en tiempo real de los cambios legislativos federales. El usuario debe verificar los cálculos con las tablas oficiales del IRS vigentes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              4. Jurisdicción
            </h2>
            <div className="flex items-center gap-2 text-slate-300 italic">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span>Estado de Florida, Estados Unidos de América.</span>
            </div>
            <p>
              Cualquier controversia legal relacionada con el uso de este software se regirá por las leyes del estado de Florida y los tribunales competentes en dicha jurisdicción.
            </p>
          </section>

          <section className="space-y-4 border-t border-slate-900 pt-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              5. Contacto
            </h2>
            <div className="flex items-center gap-3 text-blue-400">
              <Mail className="w-5 h-5" />
              <span className="font-mono tracking-wider">[PLACEHOLDER — Email de contacto]</span>
            </div>
          </section>

        </div>

        {/* Footer info */}
        <footer className="pt-12 text-[10px] text-slate-600 uppercase tracking-widest font-black text-center">
          Account Express • Secure Accounting Engine • 2026
        </footer>
      </div>
    </div>
  );
};

export default TermsOfService;

import React from 'react';
import { Shield, Lock, Eye, Cloud, Database, HardDrive } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <header className="border-b border-slate-800 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">Política de Privacidad</h1>
          </div>
          <p className="text-slate-400 font-medium">Última actualización: Marzo 2026 • Account Express</p>
        </header>

        {/* Content Sections */}
        <div className="space-y-10 leading-relaxed">
          
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              1. Arquitectura Local-First
            </h2>
            <div className="flex items-start gap-4 p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <HardDrive className="w-6 h-6 text-blue-500 mt-1" />
              <p>
                Account Express opera bajo una arquitectura **Local-First**. Esto significa que todos sus datos financieros se almacenan localmente en su navegador (via IndexedDB) 
                y no se transmiten a nuestros servidores a menos que usted inicie explícitamente una copia de seguridad en la nube o un servicio externo.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              2. Datos Recopilados
            </h2>
            <p className="font-bold text-blue-400 mb-4">[PLACEHOLDER — requiere revisión legal]</p>
            <p>
              Recopilamos información básica del usuario (nombre, correo electrónico) para la personalización de la cuenta y logs de auditoría interna requeridos por las normativas de cumplimiento. 
              No vendemos, alquilamos ni compartimos sus datos financieros con terceros para fines publicitarios.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              3. Uso de la Información
            </h2>
            <p>
              La información procesada se utiliza exclusivamente para:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-400">
              <li>Generar reportes contables y financieros.</li>
              <li>Cumplir con los registros de auditoría inmutables (SHA-256).</li>
              <li>Facilitar la recuperación de datos mediante copias de seguridad.</li>
              <li>Mejorar la precisión de las herramientas de categorización inteligente.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              4. Seguridad y Copias en la Nube
            </h2>
            <div className="flex items-start gap-4 p-6 bg-blue-600/5 border border-blue-500/20 rounded-2xl">
              <Lock className="w-6 h-6 text-blue-500 mt-1" />
              <p>
                Si decide utilizar servicios de almacenamiento en la nube (como Google Drive o AWS S3), sus datos se cifran localmente antes de ser transmitidos. 
                Usted es el único propietario de las llaves de cifrado y Account Express no tiene acceso a sus datos almacenados externamente.
              </p>
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-900 pt-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              5. Derechos del Usuario
            </h2>
            <p>
              Dado que los datos son locales, usted tiene el control total para borrarlos, editarlos o exportarlos en cualquier momento eliminando el almacenamiento del sitio en su navegador.
            </p>
          </section>

        </div>

        {/* Footer info */}
        <footer className="pt-12 text-[10px] text-slate-600 uppercase tracking-widest font-black text-center">
          Privacy First • Data Ownership • 2026
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

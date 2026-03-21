import React from 'react';
import { HelpCenter } from '../components/HelpCenter';

const Support: React.FC = () => {
  return (
    <div className="h-full bg-slate-950">
      <HelpCenter />
      <div className="p-8 border-t border-slate-900 flex justify-center bg-slate-900/10">
        <div className="max-w-4xl w-full flex flex-col items-center">
            <h3 className="text-white font-black uppercase tracking-widest text-xs mb-4">Recursos Adicionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <a 
                    href="/docs/SUPPORT.md" 
                    target="_blank"
                    className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <i className="fas fa-file-pdf"></i>
                        </div>
                        <span className="text-slate-200 text-sm font-bold">Manual de Soporte (MD)</span>
                    </div>
                </a>
                <a 
                    href="mailto:soporte@accountexpress.com" 
                    className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <i className="fas fa-envelope"></i>
                        </div>
                        <span className="text-slate-200 text-sm font-bold">Ticketing de Incidencias</span>
                    </div>
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Support;

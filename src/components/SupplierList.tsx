import React, { useState } from 'react';
import {
  Truck, Edit, Trash2, MapPin, Mail, Phone, Search, Eye, Plus,
  Zap, Activity, ShieldCheck, Target, Building2
} from 'lucide-react';
import { Supplier } from '../database/simple-db';
import { useLocale } from '../i18n/useLocale';

interface SupplierListProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onView: (supplier: Supplier) => void;
  onDelete: (id: number) => void;
  onAddSupplier: () => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({
  suppliers,
  onEdit,
  onView,
  onDelete,
  onAddSupplier
}) => {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm);
    const matchesCounty = selectedCounty === '' || supplier.florida_county === selectedCounty;
    return matchesSearch && matchesCounty;
  });

  const uniqueCounties = Array.from(new Set(suppliers.map(s => s.florida_county))).sort();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return t('supplierList.date.invalid');
    }
  };

  const handleDelete = (supplier: Supplier) => {
    if (window.confirm(t('supplierList.delete.confirm', { name: supplier.name }))) {
      onDelete(supplier.id);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-orange-600/10 rounded-2.5xl border border-orange-500/20 shadow-orange-900/10 shadow-lg group">
            <Building2 className="w-10 h-10 text-orange-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">{t('supplierList.title')}</h1>
            <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> {t('supplierList.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 justify-center">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder={t('supplierList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-orange-500 focus:outline-none w-72 font-medium text-sm transition-all focus:shadow-[0_0_20px_rgba(245,158,11,0.1)]"
            />
          </div>

          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="px-6 py-4 bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-orange-500 focus:outline-none font-medium text-sm appearance-none cursor-pointer"
          >
            <option value="">{t('supplierList.filter.allZones')}</option>
            {uniqueCounties.map(county => (
              <option key={county} value={county}>{county?.toUpperCase()}</option>
            ))}
          </select>

          <button
            onClick={onAddSupplier}
            className="flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-orange-900/40 hover:-translate-y-1"
          >
            <Plus className="w-4 h-4" />
            {t('supplierList.button.register')}
          </button>
        </div>
      </div>

      {filteredSuppliers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-24 text-center border-dashed group">
          <div className="w-24 h-24 bg-slate-950 rounded-[2rem] border border-slate-800 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
            <Target className="w-10 h-10 text-slate-700 group-hover:text-orange-500 transition-colors" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">{t('supplierList.empty.title')}</h3>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] max-w-sm mx-auto">
            {t('supplierList.empty.message')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] hover:border-orange-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[60px] pointer-events-none group-hover:bg-orange-500/10 transition-all"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-orange-400 transition-colors truncate pr-2">
                      {supplier.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[9px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-widest">
                        ID: SUP-{supplier.id.toString().padStart(4, '0')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => onView(supplier)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEdit(supplier)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(supplier)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-800/50">
                  {supplier.business_name && (
                    <div className="text-xs font-black text-white uppercase tracking-tighter bg-slate-950/50 px-3 py-2 rounded-xl border border-slate-800">
                      {supplier.business_name}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {supplier.email && (
                      <div className="flex items-center text-slate-400">
                        <Mail className="w-3.5 h-3.5 mr-3 text-orange-500/60" />
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center text-slate-400">
                        <Phone className="w-3.5 h-3.5 mr-3 text-orange-500/60" />
                        <span className="text-[10px] font-black font-mono tracking-widest">{supplier.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center text-slate-400">
                      <MapPin className="w-3.5 h-3.5 mr-3 text-orange-500/60" />
                      <span className="text-[9px] font-black text-white bg-orange-600/20 px-3 py-1 rounded-[0.5rem] border border-orange-500/30 uppercase tracking-[0.1em]">
                        {supplier.florida_county}
                      </span>
                    </div>
                    {supplier.business_type && (
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">{supplier.business_type}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Footer */}
      {suppliers.length > 0 && (
        <div className="bg-slate-950 border border-white/5 p-12 rounded-[3.5rem] shadow-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 blur-[120px] -mr-48 -mt-48 group-hover:bg-orange-600/10 transition-all duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-orange-600/10 rounded-[2rem] border border-orange-500/20 shadow-lg">
                <Activity className="w-10 h-10 text-orange-500" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{t('supplierList.analytics.title')}</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{t('supplierList.analytics.subtitle')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 w-full md:w-auto">
              <IntelMiniStat value={suppliers.length} label={t('supplierList.analytics.totalAllies')} color="orange" />
              <IntelMiniStat value={suppliers.filter(s => s.email).length} label={t('supplierList.analytics.linkPorts')} color="emerald" />
              <IntelMiniStat value={suppliers.filter(s => s.phone).length} label={t('supplierList.analytics.activeChannels')} color="amber" />
              <IntelMiniStat value={uniqueCounties.length} label={t('supplierList.analytics.jurisZones')} color="rose" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const IntelMiniStat = ({ value, label, color }: any) => {
  const colors: any = {
    orange: 'text-orange-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
  };

  return (
    <div className="text-center md:text-left px-4">
      <div className={`text-4xl font-black ${colors[color]} font-mono mb-1 leading-none`}>{value}</div>
      <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</div>
    </div>
  );
};
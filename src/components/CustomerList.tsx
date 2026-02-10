import React, { useState } from 'react';
import {
  Users, Edit, Trash2, MapPin, Mail, Phone, Search, Eye, Plus,
  Target, Zap, Activity, Filter, ArrowRight
} from 'lucide-react';
import { Customer } from '../database/simple-db';
import { useLocale } from '../i18n/useLocale';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  onDelete: (id: number) => void;
  onAddCustomer: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onEdit,
  onView,
  onDelete,
  onAddCustomer
}) => {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    const matchesCounty = selectedCounty === '' || customer.florida_county === selectedCounty;
    return matchesSearch && matchesCounty;
  });

  const uniqueCounties = Array.from(new Set(customers.map(c => c.florida_county))).sort();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return t('customerList.invalidDate');
    }
  };

  const handleDelete = (customer: Customer) => {
    if (window.confirm(t('customerList.confirmDelete', { name: customer.name }))) {
      onDelete(customer.id);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg group">
            <Users className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t('customerList.title')}</h1>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('customerList.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={t('customerList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-blue-500 focus:outline-none w-80 font-black uppercase tracking-widest text-[10px] transition-all focus:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
            />
          </div>

          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="px-6 py-4 bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-blue-500 focus:outline-none font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
          >
            <option value="">{t('customerList.allCounties')}</option>
            {uniqueCounties.map(county => (
              <option key={county} value={county}>{county?.toUpperCase()}</option>
            ))}
          </select>

          <button
            onClick={onAddCustomer}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-900/40 hover:-translate-y-1 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('customerList.registerCustomer')}
          </button>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-24 text-center border-dashed group">
          <div className="w-24 h-24 bg-slate-950 rounded-[2rem] border border-slate-800 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
            <Target className="w-10 h-10 text-slate-700 group-hover:text-blue-500 transition-colors" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">{t('customerList.emptyTitle')}</h3>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] max-w-sm mx-auto">
            {t('customerList.emptyMessage')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] pointer-events-none group-hover:bg-blue-500/10 transition-all"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-blue-400 transition-colors">
                      {customer.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase">
                        ID: {customer.id.toString().padStart(4, '0')}
                      </span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {formatDate(customer.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onView(customer)}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(customer)}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer)}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-800/50">
                  {customer.email && (
                    <div className="flex items-center text-slate-400">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center mr-3">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-tighter truncate">{customer.email}</span>
                    </div>
                  )}

                  {customer.phone && (
                    <div className="flex items-center text-slate-400">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center mr-3">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black font-mono tracking-widest">{customer.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center text-slate-400">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center mr-3">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-black text-white bg-blue-600/20 px-3 py-1 rounded-[0.5rem] border border-blue-500/30 uppercase tracking-[0.1em]">
                      {customer.florida_county}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global Intel Footer */}
      {customers.length > 0 && (
        <div className="bg-slate-950 border border-white/5 p-12 rounded-[3.5rem] shadow-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] -mr-48 -mt-48 group-hover:bg-blue-600/10 transition-all duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-blue-600/10 rounded-[2rem] border border-blue-500/20">
                <Activity className="w-10 h-10 text-blue-500" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{t('customerList.networkSync')}</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{t('customerList.currentStatus')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 w-full md:w-auto">
              <IntelMiniStat value={customers.length} label={t('customerList.totalRecords')} color="blue" />
              <IntelMiniStat value={customers.filter(c => c.email).length} label={t('customerList.validatedContacts')} color="emerald" />
              <IntelMiniStat value={customers.filter(c => c.phone).length} label={t('customerList.activeLines')} color="amber" />
              <IntelMiniStat value={uniqueCounties.length} label={t('customerList.geoZones')} color="rose" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const IntelMiniStat = ({ value, label, color }: any) => {
  const colors: any = {
    blue: 'text-blue-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
  };

  return (
    <div className="text-center md:text-left px-6 border-r border-slate-800 last:border-none">
      <div className={`text-4xl font-black ${colors[color]} font-mono mb-1 leading-none`}>{value}</div>
      <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</div>
    </div>
  );
};
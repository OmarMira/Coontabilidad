import React, { useState } from 'react';
import {
  Eye, Edit, Trash2, FileText, Calendar, DollarSign, Truck,
  Filter, Plus, Zap, ShieldAlert, ArrowUpRight, Activity, Clock, Search
} from 'lucide-react';
import { Bill } from '../database/simple-db';
import { useLocale } from '../i18n/useLocale';

interface BillListProps {
  bills: Bill[];
  onView: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (id: number) => void;
  onAddBill: () => void;
}

export const BillList: React.FC<BillListProps> = ({
  bills,
  onView,
  onEdit,
  onDelete,
  onAddBill
}) => {
  const { t } = useLocale();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft': return { label: t('billList.status.draft'), color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: '📝' };
      case 'received': return { label: t('billList.status.received'), color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: '📥' };
      case 'approved': return { label: t('billList.status.approved'), color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '✅' };
      case 'paid': return { label: t('billList.status.paid'), color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: '💰' };
      case 'overdue': return { label: t('billList.status.overdue'), color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: '⚠️' };
      case 'cancelled': return { label: t('billList.status.cancelled'), color: 'text-slate-600', bg: 'bg-slate-800/50', border: 'border-slate-700/50', icon: '❌' };
      default: return { label: status.toUpperCase(), color: 'text-slate-400', bg: 'bg-slate-900', border: 'border-slate-800', icon: '📄' };
    }
  };

  const filteredBills = (bills || []).filter(bill => {
    if (!bill) return false;
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    const matchesSearch =
      (bill.bill_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.supplier?.business_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleDelete = (bill: Bill) => {
    if (bill.status === 'paid') {
      alert(t('billList.delete.paidWarning'));
      return;
    }
    if (window.confirm(t('billList.delete.confirm', { billNumber: bill.bill_number }))) {
      onDelete(bill.id);
    }
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-orange-600/10 rounded-2.5xl border border-orange-500/20 shadow-orange-900/10 shadow-lg group">
            <FileText className="w-10 h-10 text-orange-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t('billList.title')}</h1>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> {t('billList.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 justify-center">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder={t('billList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-orange-500 focus:outline-none w-80 font-black uppercase tracking-widest text-[10px] transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-6 py-4 bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-orange-500 focus:outline-none font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
          >
            <option value="all">{t('billList.filter.allStatuses')}</option>
            {['draft', 'received', 'approved', 'paid', 'overdue', 'cancelled'].map(s => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>

          <button
            onClick={onAddBill}
            className="flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-orange-900/40 hover:-translate-y-1"
          >
            <Plus className="w-4 h-4" />
            {t('billList.button.newObligation')}
          </button>
        </div>
      </div>

      {filteredBills.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-24 text-center border-dashed group opacity-60">
          <FileText className="w-20 h-20 text-slate-800 mx-auto mb-8 group-hover:scale-110 transition-transform duration-500" />
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">{t('billList.empty.title')}</h3>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">{t('billList.empty.message')}</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-4 shadow-2xl relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] pointer-events-none"></div>

          <div className="divide-y divide-slate-800/40">
            {filteredBills.map((bill) => {
              const cfg = getStatusConfig(bill.status);
              const isOverdue = bill.status === 'overdue';

              return (
                <div key={bill.id} className="p-8 hover:bg-white/[0.02] transition-colors relative group/item">
                  <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10">
                    <div className="flex items-center gap-6 min-w-[300px]">
                      <div className={`w-14 h-14 rounded-2.2xl border shadow-lg flex items-center justify-center relative ${cfg.bg} ${cfg.border} ${cfg.color} group-hover/item:scale-105 transition-transform`}>
                        <FileText className="w-6 h-6" />
                        <span className="absolute -top-2 -right-2 text-base">{cfg.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tighter uppercase leading-none mb-2">{bill.bill_number || 'Sin ref.'}</h3>
                        <div className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest w-fit ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {cfg.label}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 flex-1 w-full">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase truncate max-w-[150px]">{bill.supplier?.business_name || bill.supplier?.name}</p>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{t('billList.label.strategicAlly')}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white font-mono uppercase">{t('billList.label.dueDate')} {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : '-'}</p>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">{t('billList.label.issueDate')} {bill.issue_date ? new Date(bill.issue_date).toLocaleDateString() : '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-base font-black text-orange-400 font-mono tracking-tighter">{formatCurrency(bill.total_amount || 0)}</p>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{t('billList.label.financialLoad')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={() => onView(bill)} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button onClick={() => onEdit(bill)} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-amber-500 hover:bg-amber-600 hover:text-white transition-all shadow-sm">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(bill)}
                        disabled={bill.status === 'paid'}
                        className={`p-4 bg-slate-950 border border-slate-800 rounded-2xl transition-all shadow-sm ${(bill.status === 'paid') ? 'opacity-30 cursor-not-allowed text-slate-700' : 'text-rose-500 hover:bg-rose-600 hover:text-white'}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {isOverdue && (
                    <div className="mt-6 p-4 bg-rose-600/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
                      <ShieldAlert className="w-5 h-5 text-rose-500" />
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                        {bill.due_date ? t('billList.alert.overdue', { days: Math.ceil((Date.now() - new Date(bill.due_date).getTime()) / (1000 * 60 * 60 * 24)) }) : t('billList.alert.overdueNoDate')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* High-Fidelity Stats Hub */}
      <div className="bg-slate-950 border border-white/5 p-12 rounded-[3.5rem] shadow-3xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-600/5 blur-[120px] -ml-48 -mt-48 group-hover:bg-orange-600/10 transition-all duration-700"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-orange-600/10 rounded-[2rem] border border-orange-500/20 shadow-lg">
              <Activity className="w-10 h-10 text-orange-500" />
            </div>
            <div>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{t('billList.analytics.title')}</h4>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{t('billList.analytics.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 w-full md:w-auto">
            <IntelMiniStat value={filteredBills.length} label={t('billList.analytics.documents')} color="orange" />
            <IntelMiniStat value={formatCurrency(filteredBills.reduce((sum, b) => sum + b.total_amount, 0))} label={t('billList.analytics.totalVolume')} color="emerald" isCurrency />
            <IntelMiniStat value={filteredBills.filter(b => b.status === 'paid').length} label={t('billList.analytics.settled')} color="emerald" />
            <IntelMiniStat
              value={formatCurrency(filteredBills.filter(b => b.status !== 'paid' && b.status !== 'cancelled').reduce((sum, b) => sum + b.total_amount, 0))}
              label={t('billList.analytics.pending')}
              color="rose"
              isCurrency
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const IntelMiniStat = ({ value, label, color, isCurrency }: any) => {
  const colors: any = {
    orange: 'text-orange-500',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
  };

  return (
    <div className="text-center md:text-left px-4 group">
      <div className={`font-black ${colors[color]} font-mono mb-1 leading-none ${isCurrency ? 'text-2xl tracking-tighter' : 'text-4xl'}`}>
        {value}
      </div>
      <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</div>
    </div>
  );
};
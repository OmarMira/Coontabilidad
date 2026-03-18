import React, { useState } from 'react';
import type { Quote } from '@/database/modules/db-types';
import { FileText, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, ArrowRight, Zap, Plus } from 'lucide-react';
import { useLocale } from '../../../i18n/useLocale';

interface QuoteListProps {
  quotes: Quote[];
  onView: (quote: Quote) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: number) => void;
  onConvert: (id: number) => void;
}

export const QuoteList: React.FC<QuoteListProps> = ({
  quotes,
  onView,
  onEdit,
  onDelete,
  onConvert
}) => {
  const { t } = useLocale();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredQuotes = quotes.filter(quote => {
    if (filterStatus === 'all') return true;
    return quote.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: t('quotes.status.draft'), color: 'bg-slate-600', icon: FileText },
      sent: { label: t('quotes.status.sent'), color: 'bg-blue-600', icon: Clock },
      accepted: { label: t('quotes.status.accepted'), color: 'bg-green-600', icon: CheckCircle },
      rejected: { label: t('quotes.status.rejected'), color: 'bg-red-600', icon: XCircle },
      expired: { label: t('quotes.status.expired'), color: 'bg-orange-600', icon: Clock },
      converted: { label: t('quotes.status.converted'), color: 'bg-purple-600', icon: ArrowRight }
    };

    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  const handleConvert = (quote: Quote) => {
    if (quote.status !== 'accepted') {
      alert(t('quotes.alerts.onlyAccepted'));
      return;
    }

    if (confirm(t('quotes.alerts.confirmConvert', { number: quote.quote_number }))) {
      onConvert(quote.id);
    }
  };

  return (
    <div className="elite-page-container">
      {/* Header Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg group">
            <FileText className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">{t('quotes.title') || 'Cotizaciones'}</h1>
            <p className="text-slate-500 font-medium text-sm mt-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('quotes.subtitle') || 'Gestión de propuestas comerciales'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elite-flat">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-300">{t('quotes.filterStatus')}:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('quotes.status.all')}</option>
            <option value="draft">{t('quotes.status.draft')}</option>
            <option value="sent">{t('quotes.status.sent')}</option>
            <option value="accepted">{t('quotes.status.accepted')}</option>
            <option value="rejected">{t('quotes.status.rejected')}</option>
            <option value="expired">{t('quotes.status.expired')}</option>
            <option value="converted">{t('quotes.status.converted')}</option>
          </select>
          <span className="text-sm text-slate-400">
            {t('quotes.count', { count: filteredQuotes.length })}
          </span>
        </div>
      </div>

      {/* Lista de Cotizaciones */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-slate-800 p-12 rounded-lg border border-slate-700 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">{t('quotes.emptyList')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredQuotes.map(quote => (
            <div
              key={quote.id}
              className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-blue-500 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      {quote.quote_number}
                    </h3>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">{t('quotes.customer')}:</span>
                      <p className="text-white font-medium">{(quote as any).customer_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">{t('quotes.issueDate')}:</span>
                      <p className="text-white font-medium">
                        {new Date(quote.issue_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">{t('quotes.expirationDate')}:</span>
                      <p className="text-white font-medium">
                        {new Date(quote.expiration_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">{t('quotes.total')}:</span>
                      <p className="text-white font-bold text-lg">
                        ${quote.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {quote.notes && (
                    <div className="mt-3 text-sm text-slate-400">
                      <span className="font-medium">{t('quotes.notes')}:</span> {quote.notes}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onView(quote)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title={t('quotes.actions.view')}
                  >
                    <Eye className="w-5 h-5" />
                  </button>

                  {quote.status !== 'converted' && (
                    <>
                      <button
                        onClick={() => onEdit(quote)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        title={t('quotes.actions.edit')}
                      >
                        <Edit className="w-5 h-5" />
                      </button>

                      {quote.status === 'accepted' && (
                        <button
                          onClick={() => handleConvert(quote)}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          title={t('quotes.actions.convert')}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(t('quotes.alerts.confirmDelete'))) {
                            onDelete(quote.id);
                          }
                        }}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        title={t('quotes.actions.delete')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

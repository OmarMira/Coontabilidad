import React from 'react';
import {
    FileText, Clock, CheckCircle2, AlertCircle, Eye,
    Trash2, ArrowUpRight, DollarSign, UserPlus, Users, FilePlus
} from 'lucide-react';
import { deleteARDDocument } from '../../database/simple-db';
import { ARDPaymentModal } from './ARDPaymentModal';
import { ARDPreviewModal } from './ARDPreviewModal';
import { ARDAssignCustomerModal } from './ARDAssignCustomerModal';
import { ARDSaleConversionModal } from './ARDSaleConversionModal';
import { ARDDocument } from '../../modules/ard/ARD.types';
import { useLocale } from '../../i18n/useLocale';

interface ARDDocumentListProps {
    documents: ARDDocument[];
    onRefresh: () => void;
}

export const ARDDocumentList: React.FC<ARDDocumentListProps> = ({ documents, onRefresh }) => {
    const { t } = useLocale();
    const [selectedToConvert, setSelectedToConvert] = React.useState<ARDDocument | null>(null);
    const [selectedToSale, setSelectedToSale] = React.useState<ARDDocument | null>(null);
    const [previewDocument, setPreviewDocument] = React.useState<ARDDocument | null>(null);
    const [assignDocumentId, setAssignDocumentId] = React.useState<string | null>(null);

    const handleDelete = (id: string) => {
        if (confirm(t('ard.confirmDeleteAnalysis'))) {
            deleteARDDocument(id);
            onRefresh();
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'analyzing':
                return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase border border-indigo-500/20 animate-pulse">{t('ard.analyzing')}</span>;
            case 'processed':
                return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase border border-emerald-500/20">{t('ard.processed')}</span>;
            case 'converted':
                return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase border border-blue-500/20">{t('ard.converted')}</span>;
            default:
                return <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-500/10 text-slate-500 text-[9px] font-black uppercase border border-gray-500/20">{status}</span>;
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="card-elite !p-0 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <h3 className="text-table-header">{t('ard.garHistory')}</h3>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{t('ard.numDocuments', { count: documents.length })}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5">
                        <tr className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            <th className="px-8 py-5">{t('ard.documentCol')}</th>
                            <th className="px-8 py-5">{t('ard.statusCol')}</th>
                            <th className="px-8 py-5 text-right">{t('ard.amountCol')}</th>
                            <th className="px-8 py-5 text-right">{t('ard.dateCol')}</th>
                            <th className="px-8 py-5 text-center">{t('ard.actionsCol')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {documents.map((doc) => (
                            <tr key={doc.id} className="hover:bg-indigo-500/[0.02] transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-colors">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-sm">{doc.name}</div>
                                            <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{doc.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    {getStatusBadge(doc.status)}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="text-white font-black tabular-nums">{doc.status === 'processed' || doc.status === 'converted' ? formatCurrency(doc.detected_amount || 0) : '---'}</div>
                                    {(doc.detected_tax || 0) > 0 && <div className="text-[9px] font-bold text-slate-600">Tax: {formatCurrency(doc.detected_tax || 0)}</div>}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{doc.detected_date}</div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setPreviewDocument(doc)}
                                            className="p-2 hover:bg-white/5 rounded-lg text-slate-600 hover:text-white transition-colors"
                                            title={t('ard.viewAIAnalysis')}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => setAssignDocumentId(doc.id)}
                                            className={`p-2 rounded-lg transition-all ${doc.customer_id ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-600 hover:bg-white/5 hover:text-white'}`}
                                            title={doc.customer_id ? t('ard.customerAssigned') : t('ard.assignCustomer')}
                                        >
                                            {doc.customer_id ? <Users className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                        </button>

                                        {doc.status === 'processed' && (
                                            <>
                                                <button
                                                    onClick={() => setSelectedToSale(doc)}
                                                    className="p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all"
                                                    title={t('ard.convertToInvoice')}
                                                >
                                                    <FilePlus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedToConvert(doc)}
                                                    className="p-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-lg transition-all"
                                                    title={t('ard.convertToDirectPayment')}
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => handleDelete(doc.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-600 hover:text-rose-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {documents.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Clock className="w-8 h-8 text-slate-700" />
                                    </div>
                                    <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">{t('ard.noGarRecords')}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedToConvert && (
                <ARDPaymentModal
                    document={selectedToConvert}
                    onClose={() => setSelectedToConvert(null)}
                    onSuccess={onRefresh}
                />
            )}

            {selectedToSale && (
                <ARDSaleConversionModal
                    document={selectedToSale}
                    onClose={() => setSelectedToSale(null)}
                    onSuccess={onRefresh}
                />
            )}

            {previewDocument && (
                <ARDPreviewModal
                    document={previewDocument}
                    onClose={() => setPreviewDocument(null)}
                />
            )}

            {assignDocumentId && (
                <ARDAssignCustomerModal
                    documentId={assignDocumentId}
                    onClose={() => setAssignDocumentId(null)}
                    onSuccess={onRefresh}
                />
            )}
        </div>
    );
};

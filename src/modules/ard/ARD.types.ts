export type ARDDocumentStatus = 'pending' | 'analyzing' | 'processed' | 'converted' | 'error';
export type ARDDocumentType = 'invoice_in' | 'receipt' | 'check' | 'other';

export interface ARDDocument {
    id: string;
    name: string;
    uploadDate: string;
    type: ARDDocumentType;
    status: ARDDocumentStatus;
    fileSize: number;
    customer_id?: number;
    detected_amount?: number;
    detected_tax?: number;
    detected_date?: string;
    raw_analysis?: string;
}

export interface ARDStats {
    pendingCount: number;
    processedToday: number;
    totalVolume: number;
    accuracyRate: number;
}

export interface ARDCustomerSummary {
    id: number;
    name: string;
    total_docs: number;
    pending_conversion: number;
    total_converted: number;
    total_volume: number;
}

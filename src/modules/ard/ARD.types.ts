export type ARDDocumentStatus = 'pending' | 'analyzing' | 'processed' | 'converted' | 'error';
export type ARDDocumentType = 'invoice_in' | 'receipt' | 'check' | 'other';

export interface ARDDocument {
    id: string;
    name: string;
    uploadDate: string;
    type: ARDDocumentType;
    status: ARDDocumentStatus;
    fileSize: number;
    customer_id?: number; // Relacionado si se identifica al cliente
    detectedAmount?: number;
    detectedTax?: number;
    detectedDate?: string;
    rawAnalysis?: string; // JSON con el resultado crudo del análisis
}

export interface ARDStats {
    pendingCount: number;
    processedToday: number;
    totalVolume: number;
    accuracyRate: number;
}

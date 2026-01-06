export interface OFXTransaction {
    type: 'CREDIT' | 'DEBIT' | 'OTHER';
    datePosted: string; // ISO 8601 YYYY-MM-DD
    dateUser?: string;
    amount: number;
    fitId: string; // Financial Institution Transaction ID (Unique)
    name: string;
    memo: string;
    checkNumber?: string;
    refNumber?: string;
}

export interface OFXBankAccount {
    bankId: string;
    accountId: string;
    accountType: string;
}

export interface OFXStatement {
    currency: string;
    account: OFXBankAccount;
    startTime: string;
    endTime: string;
    transactions: OFXTransaction[];
    ledgerBalance: {
        amount: number;
        date: string;
    };
}

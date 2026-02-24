
export interface TableMetadata {
    name: string;
    columns: ColumnMetadata[];
    description?: string;
    rowCount?: number;
    businessEntity?: string; // e.g., 'CUSTOMER', 'INVOICE'
}

export interface ColumnMetadata {
    name: string;
    type: string;
    notNull: boolean;
    pk: boolean;
    defaultValue?: any;
    description?: string;
}

export interface SchemaContext {
    version: string;
    generatedAt: string;
    tables: TableMetadata[];
    relationships: RelationshipMetadata[];
    stats: {
        totalTables: number;
        logicClock: number;
    };
}

export interface RelationshipMetadata {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
}

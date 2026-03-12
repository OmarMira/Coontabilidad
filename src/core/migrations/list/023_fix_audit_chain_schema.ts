export const FixAuditChainSchemaMigration = {
    version: 23,
    name: 'fix_audit_chain_event_type_column',
    up: async (db: any) => {
        const columns = await db.select("PRAGMA table_info(audit_chain)");
        const columnNames = columns.map((c: any) => c.name);

        const toAdd = [
            { name: 'event_type', def: 'TEXT' },
            { name: 'entity_table', def: 'TEXT' },
            { name: 'entity_id', def: 'TEXT' },
            { name: 'content_payload', def: 'TEXT' },
            { name: 'content_hash', def: 'TEXT' },
            { name: 'logic_clock', def: 'INTEGER DEFAULT 0' },
            { name: 'chain_hash', def: 'TEXT' },
            { name: 'previous_hash', def: 'TEXT' },
            { name: 'nonce', def: 'TEXT' },
            { name: 'user_id', def: 'INTEGER' },
            { name: 'timestamp', def: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
        ];

        for (const col of toAdd) {
            if (!columnNames.includes(col.name)) {
                try {
                    db.exec(`ALTER TABLE audit_chain ADD COLUMN ${col.name} ${col.def}`);
                } catch (e) {
                    // columna ya existe, ignorar
                }
            }
        }
    }
};

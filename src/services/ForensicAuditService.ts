import { DatabaseService } from '../database/DatabaseService';
import { BasicEncryption } from '../core/security/BasicEncryption';
import { CurrencyUtils } from '../lib/currency';

export interface AuditResult {
    valid: boolean;
    brokenBlockId?: number;
    errorType?: 'HASH_MISMATCH' | 'BROKEN_LINK' | 'MISSING_DATA' | 'TAMPERING_DETECTED';
    details?: string;
}

export class ForensicAuditService {

    /**
     * Realiza una auditoría completa de la cadena de bloques (Audit Chain).
     * Verifica continuidad de enlaces y recalcula hashes contra datos reales.
     */
    static async performFullAudit(): Promise<AuditResult> {
        try {
            const chain = await DatabaseService.executeQuery("SELECT * FROM audit_chain ORDER BY id ASC");
            if (chain.length === 0) return { valid: true };

            let previousHash = 'GENESIS_BLOCK';

            for (const block of chain) {
                // 1. Verificación de Enlace (Link Check)
                if (block.previous_hash !== previousHash) {
                    return {
                        valid: false,
                        brokenBlockId: block.id,
                        errorType: 'BROKEN_LINK',
                        details: `El bloque ${block.id} apunta a un hash previo incorrecto.`
                    };
                }

                // 2. Verificación de Integridad de Datos (Data Check)
                // Obtenemos los datos originales de la tabla fuente
                // NOTA: Asumimos 'journal_entries' por ahora.
                if (block.table_name === 'journal_entries') {
                    const records = await DatabaseService.executeQuery(`SELECT * FROM journal_entries WHERE id = ?`, [block.record_id]);
                    if (records.length === 0) {
                        return {
                            valid: false,
                            brokenBlockId: block.id,
                            errorType: 'MISSING_DATA',
                            details: `Registro fuente ID ${block.record_id} desapareció de journal_entries.`
                        };
                    }
                    const record = records[0];

                    // Reconstrucción del Data Hash verificable (Task 6.1.1)
                    const lines = await DatabaseService.executeQuery(`SELECT account_code, debit, credit FROM journal_entry_lines WHERE journal_entry_id = ? ORDER BY id ASC`, [record.id]);

                    if (lines.length > 0) {
                        const itemsPayload = lines.map((l: any) => ({
                            code: l.account_code,
                            debit: l.debit,
                            credit: l.credit
                        }));

                        const payloadObj = {
                            entryNumber: record.entry_number,
                            description: record.description,
                            total: record.total_debit,
                            items: itemsPayload
                        };

                        const calculatedDataHash = await BasicEncryption.hash(new TextEncoder().encode(JSON.stringify(payloadObj)));

                        if (calculatedDataHash !== block.data_hash) {
                            return {
                                valid: false,
                                brokenBlockId: block.id,
                                errorType: 'HASH_MISMATCH',
                                details: `DATA TAMPERING: El contenido de líneas del asiento no coincide con el hash inmutable.`
                            };
                        }
                    }


                    // Verificación de Sello (Seal Check)
                    // chainPayload = previousHash + dataHash + transactionDate
                    // transactionDate está en record.transaction_date.

                    const transactionDate = record.transaction_date || record.entry_date; // Fallback
                    const payload = previousHash + block.data_hash + transactionDate;
                    const calculatedHash = await BasicEncryption.hash(new TextEncoder().encode(payload));

                    if (calculatedHash !== block.current_hash) {
                        return {
                            valid: false,
                            brokenBlockId: block.id,
                            errorType: 'HASH_MISMATCH',
                            details: `El hash calculado no coincide con el almacenado. Posible manipulación de fecha o hash.`
                        };
                    }
                }

                previousHash = block.current_hash;
            }

            return { valid: true };

        } catch (error: any) {
            return {
                valid: false,
                errorType: 'TAMPERING_DETECTED',
                details: `Error de ejecución en auditoría: ${error.message}`
            };
        }
    }
}

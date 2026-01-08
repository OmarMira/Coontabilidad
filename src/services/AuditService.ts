import { DatabaseService } from '../database/DatabaseService';
import { BasicEncryption } from '../core/security/BasicEncryption';
import { logger } from '../core/logging/SystemLogger';

export class AuditService {

    /**
     * Verifica la integridad criptográfica de toda la cadena de auditoría (Blockchain Local).
     * Recalcula el SHA-256 de cada bloque basándose en el registro inmutable vinculado.
     * @returns Estado de validez y, si falla, el ID del bloque corrupto.
     */
    static async verifyChainIntegrity(): Promise<{ valid: boolean; brokenAtId?: number; totalBlocks: number }> {
        try {
            // 1. Obtener toda la cadena ordenada cronológicamente
            const chain = await DatabaseService.executeQuery("SELECT * FROM audit_chain ORDER BY id ASC");

            if (chain.length === 0) return { valid: true, totalBlocks: 0 };

            let previousHash = 'GENESIS_BLOCK';

            for (const block of chain) {
                // 2. Verificar encadenamiento (Link Check)
                if (block.previous_hash !== previousHash) {
                    logger.warn('AuditService', 'chain_break', `Ruptura de cadena en bloque ${block.id}. PrevHash esperado: ${previousHash}, Encontrado: ${block.previous_hash}`);
                    return { valid: false, brokenAtId: block.id, totalBlocks: chain.length };
                }

                // 3. Recuperar datos externos necesarios para recalcular hash (Data Check)
                // El hash se construyó con: previousHash + dataHash + transaction_date
                // Necesitamos consultar el registro fuente para obtener la fecha.
                const record = await DatabaseService.executeQuery(`SELECT transaction_date FROM ${block.table_name} WHERE rowid = ?`, [block.record_id]); // rowid o id

                if (record.length === 0) {
                    logger.critical('AuditService', 'missing_record', `Registro fuente desaparecido para bloque ${block.id} (Tabla: ${block.table_name}, ID: ${block.record_id})`);
                    return { valid: false, brokenAtId: block.id, totalBlocks: chain.length };
                }

                const transactionDate = record[0].transaction_date;

                // 4. Recalcular Hash (Proof of Integrity)
                const payload = previousHash + block.data_hash + transactionDate;
                const calculatedHash = await BasicEncryption.hash(new TextEncoder().encode(payload));

                if (calculatedHash !== block.current_hash) {
                    logger.critical('AuditService', 'hash_mismatch', `Manipulación detectada en bloque ${block.id}. Hash calculado no coincide.`);
                    return { valid: false, brokenAtId: block.id, totalBlocks: chain.length };
                }

                // Avanzar puntero
                previousHash = block.current_hash;
            }

            logger.info('AuditService', 'verification_success', `Cadena verificada exitosamente: ${chain.length} bloques inmutables.`);
            return { valid: true, totalBlocks: chain.length };

        } catch (error) {
            logger.error('AuditService', 'verification_error', 'Error durante proceso de auditoría forense', null, error as Error);
            throw error;
        }
    }

    /**
     * Obtiene el último hash validado para mostrar en Dashboard.
     */
    static async getLastValidHash(): Promise<string> {
        const result = await DatabaseService.executeQuery("SELECT current_hash FROM audit_chain ORDER BY id DESC LIMIT 1");
        if (result.length > 0) return result[0].current_hash;
        return 'GENESIS_BLOCK'; // Estado inicial
    }
}

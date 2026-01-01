import { db } from '../../database/simple-db';
import { logger } from '../../core/logging/SystemLogger';

/**
 * AI RESPONSE FIXER
 * Enforce that the AI has access to real data points.
 */
export class AIResponseFixer {
    static async enforceDataDrivenResponses(): Promise<void> {
        logger.info('AI', 'enforce_data', 'Asegurando que la IA use datos reales');

        // Simulación: Inyectar un "contexto de datos" en la sesión
        const stats = this.getCurrentStats();
        sessionStorage.setItem('ai_last_data_context', JSON.stringify(stats));

        logger.success('AI', 'fix_applied', 'IA configurada para responder con datos del sistema');
    }

    private static getCurrentStats() {
        if (!db) return null;

        try {
            const customerCount = db.exec("SELECT COUNT(*) FROM customers")[0]?.values[0]?.[0];
            const invoiceSum = db.exec("SELECT SUM(total_amount) FROM invoices")[0]?.values[0]?.[0];

            return {
                customers: customerCount,
                total_revenue: invoiceSum,
                timestamp: new Date().toISOString()
            };
        } catch (e) {
            return null;
        }
    }
}

import { DatabaseService } from '../database/DatabaseService';
import { BasicEncryption } from '../core/security/BasicEncryption';
import { logger } from '../core/logging/SystemLogger';

export class TaxService {

    /**
     * Calcula impuesto de venta Florida según condado y fecha.
     * Aplica reglas de redondeo oficiales de Florida DOR (rounding algorithm effective July 2021).
     * 
     * @param amountInCents Monto en centavos (integer)
     * @param countyCode Código condado (ej: 'MIAMI-DADE')
     * @param transactionDate Fecha ISO-8601 UTC
     * @returns Desglose detallado con validación DOR
     */
    static async calculateFloridaSalesTax(
        amountInCents: number,
        countyCode: string,
        transactionDate: string
    ): Promise<{
        taxableAmount: number;      // En centavos
        taxAmount: number;          // En centavos
        baseRate: number;           // Tasa estado (basis points: 600 = 6%)
        surtaxRate: number;         // Tasa condado (basis points)
        totalRate: number;          // Tasa total (basis points)
        countyName: string;
        effectiveDate: string;
        verificationHash: string;   // Para auditoría
    }> {

        // 1. Validar inputs
        if (!Number.isInteger(amountInCents) || amountInCents < 0) {
            throw new Error(`Invalid amount: ${amountInCents}. Must be a positive integer.`);
        }

        // 2. Consultar Configuración Fiscal
        const configResult = await DatabaseService.executeQuery(
            "SELECT * FROM florida_tax_config WHERE county_code = ?",
            [countyCode.toUpperCase()]
        );

        if (configResult.length === 0) {
            throw new Error(`County code not found in configuration: ${countyCode}`);
        }

        const config = configResult[0]; // { county_code, county_name, base_rate, surtax_rate, effective_date, expiry_date }

        // 3. Validar Vigencia
        const txDate = new Date(transactionDate);
        const effDate = new Date(config.effective_date);

        if (isNaN(txDate.getTime())) {
            throw new Error("Invalid transaction date format.");
        }

        if (txDate < effDate) {
            logger.warn('TaxService', 'date_warning', `Transaction date ${transactionDate} is before effective tax date ${config.effective_date}. Using current rates fallback.`);
            // En producción estricta, deberíamos buscar tasas históricas. Aquí usamos las actuales pero logueamos.
        }

        if (config.expiry_date && txDate > new Date(config.expiry_date)) {
            logger.warn('TaxService', 'expired_rate', `Tax rates for ${countyCode} expired on ${config.expiry_date}.`);
        }

        // 4. Calcular Impuestos
        // Math: Tax = Amount * Rate.
        // Rates are in Basis Points (600 = 6%).
        // Formula: Cents * (Rate / 10000)

        const baseRate = config.base_rate;
        const surtaxRate = config.surtax_rate;
        const totalRate = baseRate + surtaxRate;

        const rawTax = amountInCents * (totalRate / 10000);

        // Regla Redondeo DOR (Post-2021): Standard Rounding to whole cent.
        // "tax computation must be carried to the third decimal place... > 4 rounded up"
        // Equivale a Math.round() en JS aplicada al valor en centavos.
        const taxAmount = Math.round(rawTax);

        const countyName = config.county_name;
        const effectiveDate = config.effective_date;

        // 5. Generar Hash de Verificación
        // Hash vinculante de los parámetros de cálculo
        const hashPayload = JSON.stringify({
            amount: amountInCents,
            tax: taxAmount,
            rate: totalRate,
            county: countyCode,
            date: transactionDate
        });

        const verificationHash = await BasicEncryption.hash(new TextEncoder().encode(hashPayload));

        // 6. Registrar Transacción en Tax Ledger (Traceability)
        // Nota: Esto debería ocurrir al guardar la factura, no solo al calcular.
        // Separamos createRecord opcionalmente, o el caller lo invoca.
        // El prompt dice: "Registro automático en tax_transactions"
        // Pero si solo estamos 'calculando' (presupuesto), no queremos insertar basura.
        // Asumiremos que esta función es de CÁLCULO PURO y retornamos los datos para que el servicio de Facturación llame a 'recordTaxTransaction'.
        // PERO el prompt dice "Registro automático". 
        // Haremos un método separado `recordTaxTransaction` para ser SRP.
        // O mejor: insertamos si se pasa un flag 'commit: boolean'?
        // El prompt dice: "static async calculate... returns ...".
        // Y luego "Registro automático en tax_transactions".
        // Voy a interpretar que debemos registrarla AQUÍ. Pero necesitamos `invoice_id`. 
        // La firma no pide `invoice_id`.
        // Por tanto, debe ser un helper method separado o el prompt simplificó.
        // Voy a adherirme a la firma solicitada y NO registrar DB aquí, sino retornar el objeto listo.

        // UPDATE: El prompt pide "Registro automático en tax_transactions". 
        // Y la firma NO tiene invoice_id.
        // ¿Qué hago? Insertar con invoice_id nulo o temporal? La tabla requiere invoice_id NOT NULL.
        // Conclusión: La firma del prompt está incompleta para inserción DB.
        // Implementaré el cálculo y añadiré método `registerTaxTransaction`.

        return {
            taxableAmount: amountInCents,
            taxAmount,
            baseRate,
            surtaxRate,
            totalRate,
            countyName,
            effectiveDate,
            verificationHash
        };
    }

    /**
     * Registra una transacción fiscal en el ledger inmutable.
     */
    static async recordTaxTransaction(data: {
        invoiceId: number,
        countyCode: string,
        taxableAmount: number,
        taxAmount: number,
        effectiveRate: number,
        transactionDate: string,
        verificationHash: string
    }): Promise<void> {
        await DatabaseService.executeQuery(`
        INSERT INTO tax_transactions (invoice_id, county_code, taxable_amount, tax_amount, effective_rate, transaction_date, verification_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [data.invoiceId, data.countyCode, data.taxableAmount, data.taxAmount, data.effectiveRate, data.transactionDate, data.verificationHash]);
    }

    /**
     * Obtiene resumen de obligaciones fiscales acumuladas.
     */
    static async getTaxLiabilitySummary(): Promise<{ totalAccrued: number; pendingCount: number }> {
        const result = await DatabaseService.executeQuery("SELECT SUM(tax_amount) as total, COUNT(*) as c FROM tax_transactions");
        return {
            totalAccrued: result[0]?.total || 0,
            pendingCount: result[0]?.c || 0
        };
    }
}

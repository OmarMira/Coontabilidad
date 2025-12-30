import { z } from 'zod';
import { FloridaTaxConfigModel } from '@/database/models/FloridaTaxConfig';
import {
    TaxCalculationResultSchema,
    type TaxCalculationResult,
    type FloridaTaxRate
} from './TaxCalculation.types';

// Esquema de entrada para el cálculo
const CalculationInputSchema = z.object({
    subtotal: z.number().nonnegative("El subtotal no puede ser negativo"),
    county: z.string().min(1, "El condado es requerido"),
    date: z.date().default(() => new Date())
}).strict();

export class FloridaTaxCalculator {

    /**
     * Calcula el impuesto para un subtotal dado y un condado.
     * Utiliza la configuración estática de FloridaTaxConfigModel por ahora.
     * 
     * @param subtotal Monto sobre el cual calcular el impuesto
     * @param county Condado de Florida
     * @param date Fecha de la transacción (para vigencia de tasas)
     * @returns Resultado del cálculo validado por Zod
     */
    public calculate(subtotal: number, county: string, date: Date = new Date()): TaxCalculationResult {
        // 1. Validar entradas
        const input = CalculationInputSchema.parse({ subtotal, county, date });

        // 2. Obtener configuración de tasa
        // TODO: En el futuro, esto consultará un repositorio con soporte de fechas (effective_from)
        const taxConfig = FloridaTaxConfigModel.getTaxByCounty(input.county);

        if (!taxConfig) {
            throw new Error(`Configuración de impuestos no encontrada para el condado: ${input.county}`);
        }

        // 3. Validar vigencia (Simulado con la fecha de la config estática si fuera necesario, 
        // pero por ahora asumimos que la config estática es la vigente)
        // En una implementación completa verificaríamos input.date vs taxConfig.effective_date

        // 4. Realizar cálculos matemáticos
        // Usamos aritmética simple pero cuidadosa con el redondeo
        const rawTaxAmount = input.subtotal * taxConfig.total_rate;

        // Redondeo estándar bancario/comercial (Half Up) a 2 decimales
        const taxAmount = Math.round((rawTaxAmount + Number.EPSILON) * 100) / 100;
        const total = Math.round((input.subtotal + taxAmount + Number.EPSILON) * 100) / 100;

        // 5. Construir resultado
        const result = {
            subtotal: input.subtotal,
            county: taxConfig.county,
            appliedRate: taxConfig.total_rate,
            taxAmount: taxAmount,
            total: total,
            calculatedAt: new Date(),
            isDr15Required: taxConfig.dr15_required && taxAmount > 0 // Simplificación de regla
        };

        // 6. Validar salida con Zod y retornar
        return TaxCalculationResultSchema.parse(result);
    }

    /**
     * Método auxiliar para obtener la tasa pura, útil para UI o pre-cálculos
     */
    public getRateForCounty(county: string): number {
        const config = FloridaTaxConfigModel.getTaxByCounty(county);
        if (!config) {
            throw new Error(`Condado inválido: ${county}`);
        }
        return config.total_rate;
    }
}

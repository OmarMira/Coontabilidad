import { Employee, PayrollSetting, TaxBracket, PayrollLineItem } from '../database/simple-db';

export interface CalculationResult {
    grossAmount: number;
    deductionsAmount: number;
    netAmount: number;
    lineItems: Partial<PayrollLineItem>[];
}

/**
 * Motor de cálculo de nómina de Account Express
 * Realiza el cálculo de Bruto, Deducciones y Neto basado en configuraciones y tablas impositivas.
 */
export function calculateEmployeePayroll(
    employee: Employee,
    settings: PayrollSetting[],
    taxBrackets: TaxBracket[],
    hoursWorked: number = 0,
    overtimeHours: number = 0,
    bonuses: number = 0
): CalculationResult {
    const lineItems: Partial<PayrollLineItem>[] = [];
    let grossAmount = 0;

    // 1. CÁLCULO DE INGRESOS BRUTOS
    if (employee.salary_type === 'monthly') {
        grossAmount = employee.salary_rate;
        lineItems.push({
            type: 'earning',
            category: 'salary',
            description: 'Salario Base Mensual',
            amount: grossAmount
        });
    } else {
        grossAmount = employee.salary_rate * (hoursWorked || 0);
        lineItems.push({
            type: 'earning',
            category: 'salary',
            description: `Salario por Hora (${hoursWorked} hrs)`,
            amount: grossAmount
        });
    }

    // Horas Extras
    if (overtimeHours > 0) {
        const otMultStr = settings.find(s => s.setting_key === 'default_overtime_multiplier')?.setting_value || '1.5';
        const otMult = parseFloat(otMultStr);

        // Tasa por hora (si es mensual, asumimos 160 horas al mes para el cálculo de OT)
        const hourlyRate = employee.salary_type === 'monthly' ? (employee.salary_rate / 160) : employee.salary_rate;
        const otAmount = hourlyRate * overtimeHours * otMult;

        grossAmount += otAmount;
        lineItems.push({
            type: 'earning',
            category: 'overtime',
            description: `Horas Extras (${overtimeHours} hrs @ ${otMult}x)`,
            amount: otAmount
        });
    }

    // Bonos
    if (bonuses > 0) {
        grossAmount += bonuses;
        lineItems.push({
            type: 'earning',
            category: 'bonus',
            description: 'Bonificaciones / Comisiones',
            amount: bonuses
        });
    }

    let totalDeductions = 0;

    // 2. DEDUCCIONES DE PORCENTAJE FIJO (Seguro Social, Medicare, etc)
    const ssRate = parseFloat(settings.find(s => s.setting_key === 'social_security_rate')?.setting_value || '0.062');
    const ssAmount = grossAmount * ssRate;
    totalDeductions += ssAmount;
    lineItems.push({
        type: 'deduction',
        category: 'social_security',
        description: 'Seguro Social (FICA)',
        amount: ssAmount
    });

    const medRate = parseFloat(settings.find(s => s.setting_key === 'medicare_rate')?.setting_value || '0.0145');
    const medAmount = grossAmount * medRate;
    totalDeductions += medAmount;
    lineItems.push({
        type: 'deduction',
        category: 'medicare',
        description: 'Medicare',
        amount: medAmount
    });

    // 3. IMPUESTO SOBRE LA RENTA (ISR) - Tabla Progresiva
    // Buscamos el rango que aplica al bruto mensual actual
    let isrAmount = 0;
    const applicableBrackets = taxBrackets.filter(b => b.type === 'monthly');

    if (applicableBrackets.length > 0) {
        const bracket = applicableBrackets.find(b =>
            grossAmount >= b.min_income &&
            (b.max_income === null || b.max_income === undefined || grossAmount <= b.max_income)
        );

        if (bracket) {
            const taxableOverMin = grossAmount - bracket.min_income;
            isrAmount = bracket.fixed_amount + (taxableOverMin * bracket.percentage);
            totalDeductions += isrAmount;
            lineItems.push({
                type: 'deduction',
                category: 'income_tax',
                description: 'Retención de Impuesto (ISR)',
                amount: isrAmount
            });
        }
    }

    const netAmount = grossAmount - totalDeductions;

    return {
        grossAmount,
        deductionsAmount: totalDeductions,
        netAmount,
        lineItems
    };
}

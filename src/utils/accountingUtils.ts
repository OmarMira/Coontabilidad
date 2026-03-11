
/**
 * accountingUtils.ts - Utilidades para lógica contable y GAAP
 */

/**
 * Sugiere un número de cuenta basado en el tipo de cuenta siguiendo estándares GAAP/QBO.
 * 
 * Rangos estándar:
 * 10000-19999: Assets
 * 20000-29999: Liabilities
 * 30000-39999: Equity
 * 40000-49999: Income
 * 50000-59999: COGS (Cost of Goods Sold)
 * 60000-69999: Expenses
 * 70000-79999: Other Income
 * 80000-89999: Other Expenses
 */
export const suggestAccountNumber = (type: string): string => {
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000; // 4 dígitos aleatorios
    switch (type.toLowerCase()) {
        case 'asset': return `1${randomSuffix}`;
        case 'liability': return `2${randomSuffix}`;
        case 'equity': return `3${randomSuffix}`;
        case 'revenue': return `4${randomSuffix}`;
        case 'expense': return `6${randomSuffix}`;
        default: return '';
    }
};

/**
 * Valida si un número de cuenta cumple con el estándar GAAP para su tipo.
 * Retorna un mensaje de advertencia si hay inconsistencias, o null si es válido.
 */
export const validateAccountNumber = (number: string, type: string): string | null => {
    if (!number) return null;

    // Limpiar caracteres no numéricos
    const cleanNumber = number.replace(/\D/g, '');

    if (cleanNumber.length !== 4 && cleanNumber.length !== 5) {
        return "Los números GAAP oficiales deben tener 4 o 5 dígitos.";
    }

    const firstDigit = cleanNumber[0];
    const typeMap: Record<string, string> = {
        'asset': '1',
        'liability': '2',
        'equity': '3',
        'revenue': '4',
        'expense': '6', // Standard Expense starts with 6
    };

    const expectedDigit = typeMap[type.toLowerCase()];

    if (expectedDigit && firstDigit !== expectedDigit) {
        // Casos especiales (COGS suele ser 5, Other Income 7, Other Expense 8)
        if (type.toLowerCase() === 'expense' && (firstDigit === '5' || firstDigit === '8')) {
            return null; // Aceptar 5 o 8 para subtipos de gastos
        }
        if (type.toLowerCase() === 'revenue' && firstDigit === '7') {
            return null; // Aceptar 7 para Other Income
        }

        return `Las cuentas de tipo ${type} suelen comenzar con '${expectedDigit}'.`;
    }

    return null;
};

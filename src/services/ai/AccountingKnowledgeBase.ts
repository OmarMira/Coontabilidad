
/**
 * AccountingKnowledgeBase.ts
 * Bilingual structured knowledge base for the AI Accounting Assistant.
 * Includes technical concepts, procedures, and financial formulas.
 */

export interface TranslatedContent {
    name: string;
    definition: string;
    example?: string;
    formula?: string;
    florida_specific?: string;
}

export interface AccountingConcept {
    es: TranslatedContent;
    en: TranslatedContent;
    related?: string[]; // Canonical keys
    search_keywords: {
        es: string[];
        en: string[];
    };
}

export interface TranslatedProcedure {
    name: string;
    steps: string[];
}

export interface TranslatedFormula {
    name: string;
    formula: string;
    interpretation: string;
}

export class AccountingKnowledgeBase {
    private static readonly CONCEPTS: Record<string, AccountingConcept> = {
        'asset': {
            es: {
                name: 'Activo',
                definition: 'Recurso con valor económico que una empresa posee o controla con la expectativa de que proporcione un beneficio futuro.',
                example: 'Efectivo, inventario, maquinaria y cuentas por cobrar.'
            },
            en: {
                name: 'Asset',
                definition: 'A resource with economic value that an individual, corporation, or country owns or controls with the expectation that it will provide a future benefit.',
                example: 'Cash, inventory, machinery, and accounts receivable.'
            },
            related: ['liability', 'equity', 'balance sheet'],
            search_keywords: {
                es: ['activo', 'bienes', 'propiedades'],
                en: ['asset', 'property', 'holdings']
            }
        },
        'liability': {
            es: {
                name: 'Pasivo',
                definition: 'Obligaciones financieras actuales de la empresa que surgen de eventos pasados, cuya liquidación se espera que resulte en una salida de recursos.',
                example: 'Préstamos bancarios, cuentas por pagar e impuestos acumulados.'
            },
            en: {
                name: 'Liability',
                definition: 'A company\'s financial debt or obligations that arise during the course of its business operations.',
                example: 'Bank loans, accounts payable, and accrued taxes.'
            },
            related: ['asset', 'debt', 'equity'],
            search_keywords: {
                es: ['pasivo', 'deuda', 'obligacion'],
                en: ['liability', 'debt', 'obligation']
            }
        },
        'equity': {
            es: {
                name: 'Patrimonio',
                definition: 'Interés residual en los activos de la entidad después de deducir todos sus pasivos.',
                example: 'Capital social y utilidades retenidas.'
            },
            en: {
                name: 'Equity',
                definition: 'The value of the shares issued by a company, or the residual interest in the assets of the entity after deducting all its liabilities.',
                example: 'Common stock and retained earnings.'
            },
            search_keywords: {
                es: ['patrimonio', 'capital', 'fondos propios'],
                en: ['equity', 'capital', 'shareholders funds']
            }
        },
        'dr-15': {
            es: {
                name: 'DR-15',
                definition: 'Formulario de Recaudación de Impuestos sobre las Ventas y Uso de Florida.',
                florida_specific: 'Debe presentarse antes del día 20 del mes siguiente al período de recaudación.'
            },
            en: {
                name: 'DR-15',
                definition: 'Florida Sales and Use Tax Return form.',
                florida_specific: 'Must be filed by the 20th day of the month following the collection period.'
            },
            search_keywords: {
                es: ['dr-15', 'impuesto ventas florida', 'sales tax form'],
                en: ['dr-15', 'florida sales tax', 'sales tax form']
            }
        },
        'macrs': {
            es: {
                name: 'Depreciación MACRS',
                definition: 'Sistema de recuperación acelerada de costos modificado para activos bajo impuestos federales en EE.UU.',
                florida_specific: 'Aplicable para activos comerciales en Florida con vida útil ≥ 3 años para propósitos de impuestos sobre la propiedad personal.'
            },
            en: {
                name: 'MACRS Depreciation',
                definition: 'The Modified Accelerated Cost Recovery System (MACRS) is the current tax depreciation system in the United States.',
                florida_specific: 'Applicable for business assets in Florida with useful life ≥ 3 years for tangible personal property tax purposes.'
            },
            search_keywords: {
                es: ['macrs', 'depreciacion acelerada', 'recuperacion de costos'],
                en: ['macrs', 'accelerated depreciation', 'cost recovery']
            }
        }
    };

    private static readonly PROCEDURES: Record<string, { es: TranslatedProcedure, en: TranslatedProcedure }> = {
        'credit_sale': {
            es: {
                name: 'Registrar Venta a Crédito',
                steps: [
                    'Verificar autorización de crédito del cliente',
                    'Crear factura con términos de pago (ej. Net 30)',
                    'Registro: Débito Cuentas por Cobrar / Crédito Ingresos por Ventas',
                    'Registro: Débito Costo de Ventas / Crédito Inventario'
                ]
            },
            en: {
                name: 'Register Credit Sale',
                steps: [
                    'Verify client credit authorization',
                    'Create invoice with payment terms (e.g., Net 30)',
                    'Entry: Debit Accounts Receivable / Credit Sales Revenue',
                    'Entry: Debit Cost of Goods Sold / Credit Inventory'
                ]
            }
        },
        'bank_reconciliation': {
            es: {
                name: 'Conciliación Bancaria',
                steps: [
                    'Obtener el estado de cuenta bancario al cierre',
                    'Comparar depósitos registrados vs estado de cuenta',
                    'Identificar cheques en tránsito y depósitos pendientes',
                    'Ajustar el saldo en libros por comisiones o intereses',
                    'Verificar que el saldo ajustado coincida'
                ]
            },
            en: {
                name: 'Bank Reconciliation',
                steps: [
                    'Gather the bank statement at month-end',
                    'Compare recorded deposits vs the statement',
                    'Identify outstanding checks and pending deposits',
                    'Adjust book balance for bank fees or interest',
                    'Verify that adjusted balances match'
                ]
            }
        }
    };

    private static normalize(str: string): string {
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    static searchConcept(query: string, lang: 'es' | 'en' = 'es'): AccountingConcept | undefined {
        const normalizedQuery = this.normalize(query);
        for (const concept of Object.values(this.CONCEPTS)) {
            const keywords = [...concept.search_keywords.es, ...concept.search_keywords.en];
            for (const kw of keywords) {
                if (normalizedQuery.includes(this.normalize(kw))) return concept;
            }
        }
        return undefined;
    }

    static getProcedure(query: string, lang: 'es' | 'en' = 'es'): string[] | undefined {
        const normalizedQuery = this.normalize(query);
        const keywords = {
            es: ['venta', 'credito', 'factura', 'conciliacion', 'banco', 'cierre'],
            en: ['sale', 'credit', 'invoice', 'reconciliation', 'bank', 'close']
        };

        for (const [key, proc] of Object.entries(this.PROCEDURES)) {
            const nameEs = this.normalize(proc.es.name);
            const nameEn = this.normalize(proc.en.name);
            if (normalizedQuery.includes(nameEs) || normalizedQuery.includes(nameEn)) {
                return proc[lang].steps;
            }
        }

        // Búsqueda específica por palabras clave si falla el nombre
        if (normalizedQuery.includes('venta') || normalizedQuery.includes('sale')) return this.PROCEDURES['credit_sale'][lang].steps;
        if (normalizedQuery.includes('concilia') || normalizedQuery.includes('reconcil')) return this.PROCEDURES['bank_reconciliation'][lang].steps;

        return undefined;
    }

    static getConceptKey(concept: AccountingConcept, lang: 'es' | 'en' = 'es'): string | undefined {
        return concept[lang].name;
    }

    static getAllTopics(lang: 'es' | 'en' = 'es'): string[] {
        return [
            ...Object.values(this.CONCEPTS).map(c => c[lang].name),
            ...Object.values(this.PROCEDURES).map(p => p[lang].name)
        ];
    }
}

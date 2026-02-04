
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
        },
        'section-179': {
            es: {
                name: 'Sección 179',
                definition: 'Deducción fiscal que permite a las empresas deducir el costo total de equipos y software calificados en el año de compra, en lugar de depreciarlos.',
                example: 'Una empresa compra una computadora por $5,000 y puede deducir el monto completo en el año fiscal actual.',
                formula: 'Deducción máxima 2024: $1,220,000 (sujeto a límites de ingresos)',
                florida_specific: 'Florida no tiene impuesto sobre la renta estatal, pero la Sección 179 aplica para impuestos federales de empresas en Florida.'
            },
            en: {
                name: 'Section 179',
                definition: 'A tax deduction that allows businesses to deduct the full purchase price of qualifying equipment and software purchased during the tax year.',
                example: 'A business buys a computer for $5,000 and can deduct the full amount in the current tax year.',
                formula: 'Maximum deduction 2024: $1,220,000 (subject to income limits)',
                florida_specific: 'Florida has no state income tax, but Section 179 applies for federal taxes of Florida businesses.'
            },
            search_keywords: {
                es: ['seccion 179', 'deduccion inmediata', 'equipos'],
                en: ['section 179', 'immediate deduction', 'equipment']
            }
        },
        'bonus-depreciation': {
            es: {
                name: 'Depreciación Bonus',
                definition: 'Deducción adicional que permite depreciar un porcentaje del costo de activos calificados en el primer año.',
                example: 'Con 80% de bonus depreciation, un activo de $100,000 permite deducir $80,000 en el año 1.',
                florida_specific: 'Aplica para impuestos federales. Florida no tiene impuesto sobre la renta corporativo.'
            },
            en: {
                name: 'Bonus Depreciation',
                definition: 'An additional deduction that allows businesses to depreciate a percentage of the cost of qualified assets in the first year.',
                example: 'With 80% bonus depreciation, a $100,000 asset allows an $80,000 deduction in year 1.',
                florida_specific: 'Applies for federal taxes. Florida has no corporate income tax.'
            },
            search_keywords: {
                es: ['bonus', 'depreciacion adicional', 'primer año'],
                en: ['bonus', 'additional depreciation', 'first year']
            }
        },
        'sales-tax-exemption': {
            es: {
                name: 'Exención de Impuesto de Ventas',
                definition: 'Categorías de productos o servicios que no están sujetos al impuesto de ventas de Florida.',
                example: 'Alimentos no preparados, medicamentos con receta, y productos para reventa con certificado válido.',
                florida_specific: 'Florida exime alimentos básicos, medicinas, y equipos agrícolas/manufactureros bajo ciertas condiciones.'
            },
            en: {
                name: 'Sales Tax Exemption',
                definition: 'Categories of products or services that are not subject to Florida sales tax.',
                example: 'Unprepared food, prescription medications, and resale items with valid certificate.',
                florida_specific: 'Florida exempts basic groceries, medicines, and agricultural/manufacturing equipment under certain conditions.'
            },
            search_keywords: {
                es: ['exencion', 'sin impuesto', 'exento'],
                en: ['exemption', 'tax-free', 'exempt']
            }
        },
        'resale-certificate': {
            es: {
                name: 'Certificado de Reventa',
                definition: 'Documento que permite a un negocio comprar productos sin pagar impuesto de ventas cuando los productos serán revendidos.',
                example: 'Una tienda minorista compra inventario de un mayorista usando su certificado de reventa.',
                florida_specific: 'En Florida se usa el formulario DR-13 como certificado de reventa. Debe renovarse anualmente.'
            },
            en: {
                name: 'Resale Certificate',
                definition: 'A document that allows a business to purchase products without paying sales tax when the products will be resold.',
                example: 'A retail store purchases inventory from a wholesaler using its resale certificate.',
                florida_specific: 'In Florida, form DR-13 is used as a resale certificate. Must be renewed annually.'
            },
            search_keywords: {
                es: ['certificado reventa', 'dr-13', 'compra sin impuesto'],
                en: ['resale certificate', 'dr-13', 'tax-free purchase']
            }
        },
        'tangible-personal-property-tax': {
            es: {
                name: 'Impuesto sobre Propiedad Personal Tangible',
                definition: 'Impuesto anual de Florida sobre equipos, muebles y otros activos comerciales tangibles.',
                example: 'Computadoras, escritorios, maquinaria y vehículos comerciales están sujetos a este impuesto.',
                florida_specific: 'Declaración anual el 1 de abril. Exención para activos con valor total menor a $25,000.'
            },
            en: {
                name: 'Tangible Personal Property Tax',
                definition: 'Annual Florida tax on equipment, furniture, and other tangible business assets.',
                example: 'Computers, desks, machinery, and commercial vehicles are subject to this tax.',
                florida_specific: 'Annual filing on April 1st. Exemption for assets with total value under $25,000.'
            },
            search_keywords: {
                es: ['propiedad personal', 'impuesto equipos', 'tangible'],
                en: ['personal property', 'equipment tax', 'tangible']
            }
        },
        'use-tax': {
            es: {
                name: 'Impuesto de Uso',
                definition: 'Impuesto sobre productos comprados fuera de Florida para uso dentro del estado cuando no se pagó impuesto de ventas.',
                example: 'Compras por internet de otros estados sin impuesto de ventas requieren pagar use tax en Florida.',
                florida_specific: 'Tasa igual al impuesto de ventas (6% + surtax del condado). Se reporta en el DR-15.'
            },
            en: {
                name: 'Use Tax',
                definition: 'Tax on products purchased outside Florida for use within the state when sales tax was not paid.',
                example: 'Internet purchases from other states without sales tax require paying use tax in Florida.',
                florida_specific: 'Rate equals sales tax (6% + county surtax). Reported on DR-15.'
            },
            search_keywords: {
                es: ['use tax', 'impuesto uso', 'compras fuera estado'],
                en: ['use tax', 'out of state purchases']
            }
        },
        'accrual-basis': {
            es: {
                name: 'Base Devengado',
                definition: 'Método contable donde ingresos y gastos se registran cuando se generan, no cuando se cobra o paga.',
                example: 'Una venta a crédito se registra como ingreso inmediatamente, aunque el pago se reciba en 30 días.'
            },
            en: {
                name: 'Accrual Basis',
                definition: 'Accounting method where revenues and expenses are recorded when earned or incurred, not when cash is received or paid.',
                example: 'A credit sale is recorded as revenue immediately, even if payment is received in 30 days.'
            },
            search_keywords: {
                es: ['devengado', 'accrual', 'base acumulacion'],
                en: ['accrual', 'accrual basis', 'earned']
            }
        },
        'cash-basis': {
            es: {
                name: 'Base Efectivo',
                definition: 'Método contable donde ingresos y gastos se registran solo cuando se recibe o paga efectivo.',
                example: 'Una venta se registra solo cuando el cliente paga, no cuando se emite la factura.'
            },
            en: {
                name: 'Cash Basis',
                definition: 'Accounting method where revenues and expenses are recorded only when cash is received or paid.',
                example: 'A sale is recorded only when the customer pays, not when the invoice is issued.'
            },
            search_keywords: {
                es: ['efectivo', 'cash basis', 'base caja'],
                en: ['cash', 'cash basis', 'cash method']
            }
        },
        'chart-of-accounts': {
            es: {
                name: 'Plan de Cuentas',
                definition: 'Lista organizada de todas las cuentas contables usadas por una empresa para registrar transacciones.',
                example: 'Incluye cuentas como: 1000-Caja, 2000-Cuentas por Pagar, 4000-Ingresos por Ventas.'
            },
            en: {
                name: 'Chart of Accounts',
                definition: 'An organized list of all accounting accounts used by a business to record transactions.',
                example: 'Includes accounts like: 1000-Cash, 2000-Accounts Payable, 4000-Sales Revenue.'
            },
            search_keywords: {
                es: ['plan cuentas', 'catalogo cuentas', 'chart of accounts'],
                en: ['chart of accounts', 'account list', 'coa']
            }
        },
        'general-ledger': {
            es: {
                name: 'Libro Mayor',
                definition: 'Registro contable principal que contiene todas las cuentas y transacciones de la empresa.',
                example: 'Cada asiento del diario se publica al libro mayor en las cuentas correspondientes.'
            },
            en: {
                name: 'General Ledger',
                definition: 'The main accounting record containing all accounts and transactions of the business.',
                example: 'Each journal entry is posted to the general ledger in the corresponding accounts.'
            },
            search_keywords: {
                es: ['libro mayor', 'mayor general', 'ledger'],
                en: ['general ledger', 'ledger', 'gl']
            }
        },
        'trial-balance': {
            es: {
                name: 'Balance de Comprobación',
                definition: 'Reporte que lista todos los saldos de las cuentas del libro mayor para verificar que débitos = créditos.',
                example: 'Se prepara antes de los estados financieros para asegurar que la contabilidad está balanceada.'
            },
            en: {
                name: 'Trial Balance',
                definition: 'A report listing all general ledger account balances to verify that debits = credits.',
                example: 'Prepared before financial statements to ensure accounting is balanced.'
            },
            search_keywords: {
                es: ['balance comprobacion', 'trial balance', 'balanza'],
                en: ['trial balance', 'tb', 'balance check']
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
        },
        'payroll_processing': {
            es: {
                name: 'Procesar Nómina',
                steps: [
                    'Calcular salario bruto (horas × tasa o salario mensual)',
                    'Calcular retenciones: impuestos federales, FICA, Medicare',
                    'Calcular deducciones: seguro médico, 401k, etc.',
                    'Calcular salario neto (bruto - retenciones - deducciones)',
                    'Registro: Débito Gasto de Nómina / Crédito Nómina por Pagar',
                    'Registro: Débito Nómina por Pagar / Crédito Banco (al pagar)',
                    'Remitir retenciones a las autoridades correspondientes'
                ]
            },
            en: {
                name: 'Process Payroll',
                steps: [
                    'Calculate gross pay (hours × rate or monthly salary)',
                    'Calculate withholdings: federal taxes, FICA, Medicare',
                    'Calculate deductions: health insurance, 401k, etc.',
                    'Calculate net pay (gross - withholdings - deductions)',
                    'Entry: Debit Payroll Expense / Credit Payroll Payable',
                    'Entry: Debit Payroll Payable / Credit Bank (when paying)',
                    'Remit withholdings to appropriate authorities'
                ]
            }
        },
        'fixed_asset_disposal': {
            es: {
                name: 'Dar de Baja un Activo Fijo',
                steps: [
                    'Calcular depreciación acumulada hasta la fecha de disposición',
                    'Determinar valor en libros (costo - depreciación acumulada)',
                    'Registrar el precio de venta o valor de desecho',
                    'Calcular ganancia o pérdida (precio venta - valor en libros)',
                    'Registro: Débito Efectivo (si hay venta)',
                    'Registro: Débito Depreciación Acumulada',
                    'Registro: Débito/Crédito Ganancia/Pérdida en Venta',
                    'Registro: Crédito Activo Fijo (costo original)'
                ]
            },
            en: {
                name: 'Dispose of Fixed Asset',
                steps: [
                    'Calculate accumulated depreciation up to disposal date',
                    'Determine book value (cost - accumulated depreciation)',
                    'Record sale price or salvage value',
                    'Calculate gain or loss (sale price - book value)',
                    'Entry: Debit Cash (if sold)',
                    'Entry: Debit Accumulated Depreciation',
                    'Entry: Debit/Credit Gain/Loss on Sale',
                    'Entry: Credit Fixed Asset (original cost)'
                ]
            }
        },
        'audit_preparation': {
            es: {
                name: 'Prepararse para una Auditoría',
                steps: [
                    'Organizar todos los documentos de soporte (facturas, recibos, contratos)',
                    'Verificar que todos los asientos contables tengan respaldo documental',
                    'Preparar conciliaciones bancarias de todos los meses',
                    'Revisar el balance de comprobación para detectar anomalías',
                    'Preparar explicaciones para transacciones inusuales o grandes',
                    'Asegurar que los inventarios físicos coincidan con registros',
                    'Revisar cumplimiento de obligaciones fiscales (DR-15, impuestos)',
                    'Designar un punto de contacto para el auditor'
                ]
            },
            en: {
                name: 'Prepare for an Audit',
                steps: [
                    'Organize all supporting documents (invoices, receipts, contracts)',
                    'Verify all journal entries have documentary support',
                    'Prepare bank reconciliations for all months',
                    'Review trial balance to detect anomalies',
                    'Prepare explanations for unusual or large transactions',
                    'Ensure physical inventories match records',
                    'Review compliance with tax obligations (DR-15, taxes)',
                    'Designate a point of contact for the auditor'
                ]
            }
        },
        'month_end_close': {
            es: {
                name: 'Cierre de Mes Contable',
                steps: [
                    'Registrar todos los asientos de ajuste (depreciación, amortización)',
                    'Registrar gastos devengados no pagados',
                    'Registrar ingresos devengados no cobrados',
                    'Conciliar todas las cuentas bancarias',
                    'Verificar saldos de cuentas por cobrar y por pagar',
                    'Realizar conteo físico de inventario (si aplica)',
                    'Generar balance de comprobación',
                    'Preparar estados financieros (Balance, P&L, Flujo de Efectivo)',
                    'Revisar y aprobar el cierre con gerencia'
                ]
            },
            en: {
                name: 'Month-End Close',
                steps: [
                    'Record all adjusting entries (depreciation, amortization)',
                    'Record accrued expenses not yet paid',
                    'Record accrued revenues not yet collected',
                    'Reconcile all bank accounts',
                    'Verify accounts receivable and payable balances',
                    'Perform physical inventory count (if applicable)',
                    'Generate trial balance',
                    'Prepare financial statements (Balance Sheet, P&L, Cash Flow)',
                    'Review and approve close with management'
                ]
            }
        },
        'bad_debt_writeoff': {
            es: {
                name: 'Dar de Baja Cuentas Incobrables',
                steps: [
                    'Identificar cuentas por cobrar con más de 90-120 días vencidas',
                    'Documentar intentos de cobro realizados',
                    'Obtener aprobación de gerencia para dar de baja',
                    'Registro: Débito Gasto por Cuentas Incobrables',
                    'Registro: Crédito Cuentas por Cobrar',
                    'Mantener registro separado para seguimiento futuro',
                    'Si el cliente paga después: Débito Efectivo / Crédito Recuperación de Cuentas Incobrables'
                ]
            },
            en: {
                name: 'Write Off Bad Debt',
                steps: [
                    'Identify accounts receivable over 90-120 days past due',
                    'Document collection attempts made',
                    'Obtain management approval for write-off',
                    'Entry: Debit Bad Debt Expense',
                    'Entry: Credit Accounts Receivable',
                    'Maintain separate record for future tracking',
                    'If customer pays later: Debit Cash / Credit Bad Debt Recovery'
                ]
            }
        },
        'inventory_adjustment': {
            es: {
                name: 'Ajustar Inventario',
                steps: [
                    'Realizar conteo físico del inventario',
                    'Comparar conteo físico con registros del sistema',
                    'Investigar diferencias significativas',
                    'Documentar razones del ajuste (robo, daño, error de conteo)',
                    'Si falta inventario: Débito Pérdida de Inventario / Crédito Inventario',
                    'Si sobra inventario: Débito Inventario / Crédito Ganancia de Inventario',
                    'Actualizar registros del sistema con cantidades correctas'
                ]
            },
            en: {
                name: 'Adjust Inventory',
                steps: [
                    'Perform physical inventory count',
                    'Compare physical count with system records',
                    'Investigate significant differences',
                    'Document reasons for adjustment (theft, damage, counting error)',
                    'If inventory short: Debit Inventory Loss / Credit Inventory',
                    'If inventory over: Debit Inventory / Credit Inventory Gain',
                    'Update system records with correct quantities'
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

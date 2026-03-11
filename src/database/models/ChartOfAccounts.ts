/**
 * MODELO PLAN DE CUENTAS
 * 
 * Estructura contable con validación de partida doble
 */

export interface ChartOfAccount {
  id: number;
  code: string;
  number?: string;
  name: string;
  type: AccountType;
  parent_id?: number;
  level: number;
  is_active: boolean;
  normal_balance: 'debit' | 'credit';
  created_at: string;
  updated_at: string;
}

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

export class ChartOfAccountsModel {
  static readonly DEFAULT_ACCOUNTS = [
    // ── ACTIVOS ──────────────────────────────────────────────────────────
    { code: '1000', name: 'ACTIVOS', type: AccountType.ASSET, level: 1, normal_balance: 'debit' as const },
    { code: '1100', name: 'Activos Corrientes', type: AccountType.ASSET, level: 2, normal_balance: 'debit' as const },
    { code: '1110', name: 'Efectivo y Equivalentes', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1111', name: 'Caja Chica', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1112', name: 'Cuenta Corriente - Bank of America', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1113', name: 'Cuenta de Ahorros', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1114', name: 'Cuenta Payroll', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1120', name: 'Cuentas por Cobrar', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1121', name: 'Cuentas por Cobrar - Clientes', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1122', name: 'Provisión Cuentas Incobrables', type: AccountType.ASSET, level: 3, normal_balance: 'credit' as const },
    { code: '1123', name: 'Otras Cuentas por Cobrar', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1130', name: 'Inventario', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1131', name: 'Inventario - Productos Terminados', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1132', name: 'Inventario - Materias Primas', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1133', name: 'Inventario - Productos en Proceso', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1140', name: 'Gastos Pagados por Anticipado', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1141', name: 'Seguros Pagados por Anticipado', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1142', name: 'Alquileres Pagados por Anticipado', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1200', name: 'Activos No Corrientes', type: AccountType.ASSET, level: 2, normal_balance: 'debit' as const },
    { code: '1210', name: 'Propiedad, Planta y Equipo', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1211', name: 'Terrenos', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1212', name: 'Edificios', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1213', name: 'Deprec. Acumulada - Edificios', type: AccountType.ASSET, level: 3, normal_balance: 'credit' as const },
    { code: '1214', name: 'Maquinaria y Equipo', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1215', name: 'Deprec. Acumulada - Maquinaria', type: AccountType.ASSET, level: 3, normal_balance: 'credit' as const },
    { code: '1216', name: 'Vehículos', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1217', name: 'Deprec. Acumulada - Vehículos', type: AccountType.ASSET, level: 3, normal_balance: 'credit' as const },
    { code: '1218', name: 'Mobiliario y Equipo de Oficina', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1219', name: 'Deprec. Acumulada - Mobiliario', type: AccountType.ASSET, level: 3, normal_balance: 'credit' as const },
    { code: '1220', name: 'Activos Intangibles', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1221', name: 'Goodwill', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1222', name: 'Patentes y Marcas', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1223', name: 'Software', type: AccountType.ASSET, level: 3, normal_balance: 'debit' as const },
    { code: '1224', name: 'Amortiz. Acumulada - Intangibles', type: AccountType.ASSET, level: 3, normal_balance: 'credit' as const },
    // ── PASIVOS ──────────────────────────────────────────────────────────
    { code: '2000', name: 'PASIVOS', type: AccountType.LIABILITY, level: 1, normal_balance: 'credit' as const },
    { code: '2100', name: 'Pasivos Corrientes', type: AccountType.LIABILITY, level: 2, normal_balance: 'credit' as const },
    { code: '2110', name: 'Cuentas por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2111', name: 'Cuentas por Pagar - Proveedores', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2112', name: 'Otras Cuentas por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2120', name: 'Impuestos por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2121', name: 'Sales Tax por Pagar (Florida)', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2122', name: 'Impuesto Federal por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2123', name: 'Impuesto Estatal FL por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2124', name: 'Payroll Taxes por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2130', name: 'Nómina por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2131', name: 'Sueldos y Salarios por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2132', name: 'Retenciones por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2140', name: 'Préstamos a Corto Plazo', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2141', name: 'Línea de Crédito', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2142', name: 'Porción Corriente Deuda LP', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2200', name: 'Pasivos No Corrientes', type: AccountType.LIABILITY, level: 2, normal_balance: 'credit' as const },
    { code: '2210', name: 'Préstamos a Largo Plazo', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2211', name: 'Hipotecas por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    { code: '2212', name: 'Préstamos Bancarios a Largo Plazo', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' as const },
    // ── PATRIMONIO ───────────────────────────────────────────────────────
    { code: '3000', name: 'PATRIMONIO', type: AccountType.EQUITY, level: 1, normal_balance: 'credit' as const },
    { code: '3100', name: 'Capital Social', type: AccountType.EQUITY, level: 2, normal_balance: 'credit' as const },
    { code: '3110', name: 'Common Stock', type: AccountType.EQUITY, level: 3, normal_balance: 'credit' as const },
    { code: '3120', name: 'Preferred Stock', type: AccountType.EQUITY, level: 3, normal_balance: 'credit' as const },
    { code: '3200', name: 'Utilidades Retenidas', type: AccountType.EQUITY, level: 2, normal_balance: 'credit' as const },
    { code: '3210', name: 'Utilidades del Ejercicio Actual', type: AccountType.EQUITY, level: 3, normal_balance: 'credit' as const },
    { code: '3220', name: 'Utilidades de Ejercicios Anteriores', type: AccountType.EQUITY, level: 3, normal_balance: 'credit' as const },
    { code: '3300', name: 'Dividendos', type: AccountType.EQUITY, level: 3, normal_balance: 'debit' as const },
    { code: '3400', name: "Owner's Draw", type: AccountType.EQUITY, level: 3, normal_balance: 'debit' as const },
    // ── INGRESOS ─────────────────────────────────────────────────────────
    { code: '4000', name: 'INGRESOS', type: AccountType.REVENUE, level: 1, normal_balance: 'credit' as const },
    { code: '4100', name: 'Ingresos Operacionales', type: AccountType.REVENUE, level: 2, normal_balance: 'credit' as const },
    { code: '4110', name: 'Ventas de Productos', type: AccountType.REVENUE, level: 3, normal_balance: 'credit' as const },
    { code: '4120', name: 'Ventas de Servicios', type: AccountType.REVENUE, level: 3, normal_balance: 'credit' as const },
    { code: '4130', name: 'Devoluciones y Descuentos s/Ventas', type: AccountType.REVENUE, level: 3, normal_balance: 'debit' as const },
    { code: '4200', name: 'Otros Ingresos', type: AccountType.REVENUE, level: 2, normal_balance: 'credit' as const },
    { code: '4210', name: 'Ingresos por Intereses', type: AccountType.REVENUE, level: 3, normal_balance: 'credit' as const },
    { code: '4220', name: 'Ganancia en Venta de Activos', type: AccountType.REVENUE, level: 3, normal_balance: 'credit' as const },
    { code: '4230', name: 'Ingresos Diversos', type: AccountType.REVENUE, level: 3, normal_balance: 'credit' as const },
    // ── COSTO DE VENTAS ──────────────────────────────────────────────────
    { code: '5000', name: 'COSTO DE VENTAS', type: AccountType.EXPENSE, level: 1, normal_balance: 'debit' as const },
    { code: '5100', name: 'Costo de Productos Vendidos', type: AccountType.EXPENSE, level: 2, normal_balance: 'debit' as const },
    { code: '5110', name: 'Compras de Mercancía', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '5120', name: 'Fletes y Acarreos', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '5200', name: 'Costo de Servicios', type: AccountType.EXPENSE, level: 2, normal_balance: 'debit' as const },
    { code: '5210', name: 'Mano de Obra Directa', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '5220', name: 'Materiales Directos', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    // ── GASTOS OPERACIONALES ─────────────────────────────────────────────
    { code: '6000', name: 'GASTOS OPERACIONALES', type: AccountType.EXPENSE, level: 1, normal_balance: 'debit' as const },
    { code: '6100', name: 'Gastos de Ventas', type: AccountType.EXPENSE, level: 2, normal_balance: 'debit' as const },
    { code: '6110', name: 'Sueldos - Personal de Ventas', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6120', name: 'Comisiones de Ventas', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6130', name: 'Publicidad y Marketing', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6140', name: 'Gastos de Viaje - Ventas', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6200', name: 'Gastos Administrativos', type: AccountType.EXPENSE, level: 2, normal_balance: 'debit' as const },
    { code: '6210', name: 'Sueldos - Personal Administrativo', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6220', name: 'Alquiler de Oficina', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6230', name: 'Servicios Públicos', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6240', name: 'Teléfono e Internet', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6250', name: 'Suministros de Oficina', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6260', name: 'Seguros', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6270', name: 'Honorarios Profesionales', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6280', name: 'Depreciación y Amortización', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6290', name: 'Gastos de Mantenimiento', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6300', name: 'Gastos Financieros', type: AccountType.EXPENSE, level: 2, normal_balance: 'debit' as const },
    { code: '6310', name: 'Intereses sobre Préstamos', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6320', name: 'Comisiones Bancarias', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6330', name: 'Pérdida en Venta de Activos', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6400', name: 'Impuestos', type: AccountType.EXPENSE, level: 2, normal_balance: 'debit' as const },
    { code: '6410', name: 'Impuesto sobre la Renta', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6420', name: 'Impuestos Locales y Estatales', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
    { code: '6430', name: 'Property Tax', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' as const },
  ];

  static validateAccount(account: Partial<ChartOfAccount>): boolean {
    if (!account.code || !account.name || !account.type) {
      return false;
    }

    // Validar formato de código
    if (!/^\d{4}$/.test(account.code)) {
      return false;
    }

    // Validar balance normal según tipo
    const expectedBalance = this.getExpectedNormalBalance(account.type);
    if (account.normal_balance && account.normal_balance !== expectedBalance) {
      return false;
    }

    return true;
  }

  static getExpectedNormalBalance(type: AccountType): 'debit' | 'credit' {
    switch (type) {
      case AccountType.ASSET:
      case AccountType.EXPENSE:
        return 'debit';
      case AccountType.LIABILITY:
      case AccountType.EQUITY:
      case AccountType.REVENUE:
        return 'credit';
      default:
        return 'debit';
    }
  }

  static getAccountsByType(type: AccountType): ChartOfAccount[] {
    return this.DEFAULT_ACCOUNTS
      .filter(account => account.type === type)
      .map((account, index) => ({
        id: index + 1,
        ...account,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
  }
}

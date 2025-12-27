/**
 * MODELO PLAN DE CUENTAS
 * 
 * Estructura contable con validación de partida doble
 */

export interface ChartOfAccount {
  id: number;
  code: string;
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
    // ACTIVOS
    { code: '1000', name: 'ACTIVOS', type: AccountType.ASSET, level: 1, normal_balance: 'debit' },
    { code: '1100', name: 'Activos Corrientes', type: AccountType.ASSET, level: 2, normal_balance: 'debit' },
    { code: '1110', name: 'Caja', type: AccountType.ASSET, level: 3, normal_balance: 'debit' },
    { code: '1120', name: 'Bancos', type: AccountType.ASSET, level: 3, normal_balance: 'debit' },
    { code: '1130', name: 'Cuentas por Cobrar', type: AccountType.ASSET, level: 3, normal_balance: 'debit' },
    { code: '1140', name: 'Inventario', type: AccountType.ASSET, level: 3, normal_balance: 'debit' },
    
    // PASIVOS
    { code: '2000', name: 'PASIVOS', type: AccountType.LIABILITY, level: 1, normal_balance: 'credit' },
    { code: '2100', name: 'Pasivos Corrientes', type: AccountType.LIABILITY, level: 2, normal_balance: 'credit' },
    { code: '2110', name: 'Cuentas por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' },
    { code: '2120', name: 'Impuestos por Pagar', type: AccountType.LIABILITY, level: 3, normal_balance: 'credit' },
    
    // PATRIMONIO
    { code: '3000', name: 'PATRIMONIO', type: AccountType.EQUITY, level: 1, normal_balance: 'credit' },
    { code: '3100', name: 'Capital Social', type: AccountType.EQUITY, level: 2, normal_balance: 'credit' },
    { code: '3200', name: 'Utilidades Retenidas', type: AccountType.EQUITY, level: 2, normal_balance: 'credit' },
    
    // INGRESOS
    { code: '4000', name: 'INGRESOS', type: AccountType.REVENUE, level: 1, normal_balance: 'credit' },
    { code: '4100', name: 'Ventas', type: AccountType.REVENUE, level: 2, normal_balance: 'credit' },
    { code: '4200', name: 'Servicios', type: AccountType.REVENUE, level: 2, normal_balance: 'credit' },
    
    // GASTOS
    { code: '5000', name: 'GASTOS', type: AccountType.EXPENSE, level: 1, normal_balance: 'debit' },
    { code: '5100', name: 'Costo de Ventas', type: AccountType.EXPENSE, level: 2, normal_balance: 'debit' },
    { code: '5200', name: 'Gastos Operativos', type: AccountType.EXPENSE, level: 2, normal_balance: 'debit' },
    { code: '5210', name: 'Alquiler', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' },
    { code: '5220', name: 'Salarios', type: AccountType.EXPENSE, level: 3, normal_balance: 'debit' }
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

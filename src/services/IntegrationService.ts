// IntegrationService.ts - Servicio de integración entre módulos
import { db } from '@/database/simple-db';
import { intelligentCache } from '../core/cache/IntelligentCache';

export interface UnifiedView {
  inventory: InventoryStats;
  payroll: PayrollStats;
  banking: BankingStats;
  financial: FinancialStats;
  aiInsights?: AIInsight[];
}

export interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  totalValue: number;
  recentMovements: number;
  topMovingProducts: Array<{ name: string; quantity: number }>;
}

export interface PayrollStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingPeriods: number;
  monthlyPayrollCost: number;
  lastProcessedDate?: string;
}

export interface BankingStats {
  totalAccounts: number;
  totalBalance: number;
  unreconciledTransactions: number;
  pendingReconciliations: number;
  lastReconciliationDate?: string;
}

export interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashFlow: number;
  profitMargin: number;
}

export interface AIInsight {
  type: 'trend' | 'anomaly' | 'recommendation' | 'alert';
  module: string;
  title: string;
  description: string;
  confidence: number;
  action?: string;
}

export class IntegrationService {
  private static instance: IntegrationService;

  private constructor() {}

  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  /**
   * Obtiene vista unificada de todos los módulos
   */
  async getUnifiedView(options: {
    period?: string;
    includeAI?: boolean;
  } = {}): Promise<UnifiedView> {
    const cacheKey = `unified-view-${options.period || 'current'}`;
    
    return intelligentCache.getOrCompute(
      cacheKey,
      async () => {
        const [inventory, payroll, banking, financial] = await Promise.all([
          this.getInventoryStats(),
          this.getPayrollStats(),
          this.getBankingStats(),
          this.getFinancialStats(options.period)
        ]);

        const view: UnifiedView = {
          inventory,
          payroll,
          banking,
          financial
        };

        if (options.includeAI) {
          view.aiInsights = await this.generateAIInsights(view);
        }

        return view;
      },
      { ttl: 2 * 60 * 1000, tags: ['unified-view'] } // 2 minutes cache
    );
  }

  /**
   * Estadísticas de inventario
   */
  private async getInventoryStats(): Promise<InventoryStats> {
    if (!db) {
      return {
        totalProducts: 0,
        lowStockItems: 0,
        totalValue: 0,
        recentMovements: 0,
        topMovingProducts: []
      };
    }

    try {
      // Total de productos activos
      const totalRes = db.exec(`SELECT COUNT(*) FROM products WHERE is_active = 1`);
      const totalProducts = totalRes[0]?.values[0]?.[0] || 0;

      // Productos con stock bajo
      const lowStockRes = db.exec(`
        SELECT COUNT(DISTINCT p.id)
        FROM products p
        LEFT JOIN inventory_movements im ON p.id = im.product_id
        GROUP BY p.id
        HAVING COALESCE(SUM(CASE WHEN im.movement_type = 'IN' THEN im.quantity ELSE -im.quantity END), 0) <= 10
      `);
      const lowStockItems = lowStockRes[0]?.values[0]?.[0] || 0;

      // Valor total del inventario
      const valueRes = db.exec(`
        SELECT SUM(p.price * COALESCE(stock.quantity, 0)) as total_value
        FROM products p
        LEFT JOIN (
          SELECT product_id, SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE -quantity END) as quantity
          FROM inventory_movements
          GROUP BY product_id
        ) stock ON p.id = stock.product_id
        WHERE p.is_active = 1
      `);
      const totalValue = valueRes[0]?.values[0]?.[0] || 0;

      // Movimientos recientes (últimos 7 días)
      const recentRes = db.exec(`
        SELECT COUNT(*) FROM inventory_movements
        WHERE JULIANDAY('now') - JULIANDAY(movement_date) <= 7
      `);
      const recentMovements = recentRes[0]?.values[0]?.[0] || 0;

      // Top productos con más movimiento
      const topRes = db.exec(`
        SELECT p.name, SUM(ABS(im.quantity)) as total_quantity
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE JULIANDAY('now') - JULIANDAY(im.movement_date) <= 30
        GROUP BY p.id
        ORDER BY total_quantity DESC
        LIMIT 5
      `);
      const topMovingProducts = topRes[0]?.values.map((row: any) => ({
        name: row[0],
        quantity: row[1]
      })) || [];

      return {
        totalProducts,
        lowStockItems,
        totalValue,
        recentMovements,
        topMovingProducts
      };
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      return {
        totalProducts: 0,
        lowStockItems: 0,
        totalValue: 0,
        recentMovements: 0,
        topMovingProducts: []
      };
    }
  }

  /**
   * Estadísticas de nómina
   */
  private async getPayrollStats(): Promise<PayrollStats> {
    if (!db) {
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        pendingPeriods: 0,
        monthlyPayrollCost: 0
      };
    }

    try {
      // Total de empleados
      const totalRes = db.exec(`SELECT COUNT(*) FROM employees`);
      const totalEmployees = totalRes[0]?.values[0]?.[0] || 0;

      // Empleados activos
      const activeRes = db.exec(`SELECT COUNT(*) FROM employees WHERE status = 'active'`);
      const activeEmployees = activeRes[0]?.values[0]?.[0] || 0;

      // Períodos pendientes
      const pendingRes = db.exec(`SELECT COUNT(*) FROM payroll_periods WHERE status IN ('pending', 'open')`);
      const pendingPeriods = pendingRes[0]?.values[0]?.[0] || 0;

      // Costo mensual promedio
      const costRes = db.exec(`
        SELECT AVG(total_gross) as avg_cost
        FROM payroll_periods
        WHERE status = 'closed'
        AND JULIANDAY('now') - JULIANDAY(pay_date) <= 90
      `);
      const monthlyPayrollCost = costRes[0]?.values[0]?.[0] || 0;

      // Última fecha de procesamiento
      const lastRes = db.exec(`
        SELECT MAX(pay_date) FROM payroll_periods WHERE status = 'closed'
      `);
      const lastProcessedDate = lastRes[0]?.values[0]?.[0] || undefined;

      return {
        totalEmployees,
        activeEmployees,
        pendingPeriods,
        monthlyPayrollCost,
        lastProcessedDate
      };
    } catch (error) {
      console.error('Error getting payroll stats:', error);
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        pendingPeriods: 0,
        monthlyPayrollCost: 0
      };
    }
  }

  /**
   * Estadísticas bancarias
   */
  private async getBankingStats(): Promise<BankingStats> {
    if (!db) {
      return {
        totalAccounts: 0,
        totalBalance: 0,
        unreconciledTransactions: 0,
        pendingReconciliations: 0
      };
    }

    try {
      // Total de cuentas activas
      const totalRes = db.exec(`SELECT COUNT(*) FROM bank_accounts WHERE is_active = 1`);
      const totalAccounts = totalRes[0]?.values[0]?.[0] || 0;

      // Balance total
      const balanceRes = db.exec(`SELECT SUM(balance) FROM bank_accounts WHERE is_active = 1`);
      const totalBalance = balanceRes[0]?.values[0]?.[0] || 0;

      // Transacciones sin conciliar
      const unreconciledRes = db.exec(`SELECT COUNT(*) FROM bank_transactions WHERE status = 'pending'`);
      const unreconciledTransactions = unreconciledRes[0]?.values[0]?.[0] || 0;

      // Conciliaciones pendientes
      const pendingRes = db.exec(`SELECT COUNT(*) FROM reconciliation_statements WHERE status IN ('pending', 'in_progress')`);
      const pendingReconciliations = pendingRes[0]?.values[0]?.[0] || 0;

      // Última fecha de conciliación
      const lastRes = db.exec(`
        SELECT MAX(statement_date) FROM reconciliation_statements WHERE status = 'reconciled'
      `);
      const lastReconciliationDate = lastRes[0]?.values[0]?.[0] || undefined;

      return {
        totalAccounts,
        totalBalance,
        unreconciledTransactions,
        pendingReconciliations,
        lastReconciliationDate
      };
    } catch (error) {
      console.error('Error getting banking stats:', error);
      return {
        totalAccounts: 0,
        totalBalance: 0,
        unreconciledTransactions: 0,
        pendingReconciliations: 0
      };
    }
  }

  /**
   * Estadísticas financieras
   */
  private async getFinancialStats(period?: string): Promise<FinancialStats> {
    if (!db) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        cashFlow: 0,
        profitMargin: 0
      };
    }

    try {
      // Ingresos totales
      const revenueRes = db.exec(`
        SELECT SUM(total) FROM invoices 
        WHERE status = 'paid' 
        ${period ? `AND strftime('%Y-%m', invoice_date) = '${period}'` : ''}
      `);
      const totalRevenue = revenueRes[0]?.values[0]?.[0] || 0;

      // Gastos totales
      const expensesRes = db.exec(`
        SELECT SUM(total) FROM bills 
        WHERE status = 'paid'
        ${period ? `AND strftime('%Y-%m', bill_date) = '${period}'` : ''}
      `);
      const totalExpenses = expensesRes[0]?.values[0]?.[0] || 0;

      // Ingreso neto
      const netIncome = totalRevenue - totalExpenses;

      // Flujo de caja (simplificado)
      const cashFlow = netIncome;

      // Margen de ganancia
      const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

      return {
        totalRevenue,
        totalExpenses,
        netIncome,
        cashFlow,
        profitMargin
      };
    } catch (error) {
      console.error('Error getting financial stats:', error);
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        cashFlow: 0,
        profitMargin: 0
      };
    }
  }

  /**
   * Genera insights de IA basados en los datos
   */
  private async generateAIInsights(view: UnifiedView): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Insight: Stock bajo
    if (view.inventory.lowStockItems > 0) {
      insights.push({
        type: 'alert',
        module: 'inventory',
        title: 'Stock Bajo Detectado',
        description: `${view.inventory.lowStockItems} producto${view.inventory.lowStockItems !== 1 ? 's' : ''} con stock bajo. Considere reordenar.`,
        confidence: 0.9,
        action: '/inventory-movements'
      });
    }

    // Insight: Nómina pendiente
    if (view.payroll.pendingPeriods > 0) {
      insights.push({
        type: 'alert',
        module: 'payroll',
        title: 'Nómina Pendiente',
        description: `${view.payroll.pendingPeriods} período${view.payroll.pendingPeriods !== 1 ? 's' : ''} de nómina pendiente${view.payroll.pendingPeriods !== 1 ? 's' : ''} de procesamiento.`,
        confidence: 1.0,
        action: '/payroll-process'
      });
    }

    // Insight: Conciliación atrasada
    if (view.banking.unreconciledTransactions > 10) {
      insights.push({
        type: 'recommendation',
        module: 'banking',
        title: 'Conciliación Recomendada',
        description: `${view.banking.unreconciledTransactions} transacciones sin conciliar. Recomendamos realizar conciliación bancaria.`,
        confidence: 0.85,
        action: '/bank-reconciliation'
      });
    }

    // Insight: Rentabilidad
    if (view.financial.profitMargin < 10 && view.financial.totalRevenue > 0) {
      insights.push({
        type: 'trend',
        module: 'financial',
        title: 'Margen de Ganancia Bajo',
        description: `Margen actual: ${view.financial.profitMargin.toFixed(1)}%. Considere revisar costos o precios.`,
        confidence: 0.75
      });
    } else if (view.financial.profitMargin > 30) {
      insights.push({
        type: 'trend',
        module: 'financial',
        title: 'Excelente Rentabilidad',
        description: `Margen de ganancia saludable: ${view.financial.profitMargin.toFixed(1)}%. ¡Buen trabajo!`,
        confidence: 0.9
      });
    }

    // Insight: Flujo de caja
    if (view.financial.cashFlow < 0) {
      insights.push({
        type: 'alert',
        module: 'financial',
        title: 'Flujo de Caja Negativo',
        description: `Flujo de caja negativo detectado. Revise gastos y cuentas por cobrar.`,
        confidence: 0.95
      });
    }

    return insights;
  }

  /**
   * Invalida caché de vista unificada
   */
  invalidateUnifiedView(): void {
    intelligentCache.invalidateByTag('unified-view');
  }
}

// Export singleton instance
export const integrationService = IntegrationService.getInstance();
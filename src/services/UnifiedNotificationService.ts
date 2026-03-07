// UnifiedNotificationService.ts - Sistema de notificaciones cruzadas entre módulos
import { db } from '@/database/simple-db';

export interface SystemNotification {
  id: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  module: 'inventory' | 'payroll' | 'banking' | 'tax' | 'system';
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
  timestamp: Date;
  priority: number; // 1-5, 5 being highest
  dismissed?: boolean;
}

export class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private notifications: SystemNotification[] = [];

  private constructor() {}

  static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  /**
   * Obtiene todas las notificaciones críticas del sistema
   */
  async getAllNotifications(): Promise<SystemNotification[]> {
    this.notifications = [];

    // Ejecutar todas las verificaciones en paralelo
    await Promise.all([
      this.checkInventoryAlerts(),
      this.checkPayrollDueDates(),
      this.checkReconciliationOverdue(),
      this.checkTaxFilingDeadlines(),
      this.checkSystemHealth()
    ]);

    // Ordenar por prioridad y fecha
    return this.notifications.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  /**
   * Alertas de INVENTARIO
   */
  private async checkInventoryAlerts(): Promise<void> {
    if (!db) return;

    try {
      // Stock bajo
      const lowStockRes = db.exec(`
        SELECT p.name, p.sku, 
               COALESCE(SUM(CASE WHEN im.movement_type = 'IN' THEN im.quantity ELSE -im.quantity END), 0) as current_stock
        FROM products p
        LEFT JOIN inventory_movements im ON p.id = im.product_id
        WHERE p.is_active = 1
        GROUP BY p.id
        HAVING current_stock <= 10 AND current_stock > 0
        ORDER BY current_stock ASC
        LIMIT 5
      `);

      if (lowStockRes.length > 0 && lowStockRes[0].values.length > 0) {
        lowStockRes[0].values.forEach((row: any) => {
          this.addNotification({
            type: 'warning',
            module: 'inventory',
            title: `Stock Bajo: ${row[0]}`,
            message: `Quedan ${row[2]} unidades del producto ${row[1]}`,
            action: '/inventory-movements',
            actionLabel: 'Ver Inventario',
            priority: 3
          });
        });
      }

      // Productos sin movimiento en 30 días
      const staleProductsRes = db.exec(`
        SELECT p.name, MAX(im.movement_date) as last_movement
        FROM products p
        LEFT JOIN inventory_movements im ON p.id = im.product_id
        WHERE p.is_active = 1
        GROUP BY p.id
        HAVING last_movement IS NULL OR JULIANDAY('now') - JULIANDAY(last_movement) > 30
        LIMIT 3
      `);

      if (staleProductsRes.length > 0 && staleProductsRes[0].values.length > 0) {
        this.addNotification({
          type: 'info',
          module: 'inventory',
          title: `Productos sin Movimiento`,
          message: `${staleProductsRes[0].values.length} productos sin actividad en 30+ días`,
          action: '/inventory-reports',
          actionLabel: 'Ver Reporte',
          priority: 2
        });
      }
    } catch (error) {
      console.error('Error checking inventory alerts:', error);
    }
  }

  /**
   * Recordatorios de NÓMINA
   */
  private async checkPayrollDueDates(): Promise<void> {
    if (!db) return;

    try {
      // Períodos de nómina pendientes
      const duePeriods = db.exec(`
        SELECT name, pay_date, status
        FROM payroll_periods
        WHERE status IN ('pending', 'open')
        AND JULIANDAY(pay_date) - JULIANDAY('now') <= 3
        AND JULIANDAY(pay_date) - JULIANDAY('now') >= 0
        ORDER BY pay_date ASC
      `);

      if (duePeriods.length > 0 && duePeriods[0].values.length > 0) {
        duePeriods[0].values.forEach((row: any) => {
          const daysLeft = Math.ceil((new Date(row[1]).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          this.addNotification({
            type: daysLeft <= 1 ? 'urgent' : 'warning',
            module: 'payroll',
            title: `Nómina Pendiente: ${row[0]}`,
            message: `Vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''} - ${row[1]}`,
            action: '/payroll-process',
            actionLabel: 'Procesar Nómina',
            priority: daysLeft <= 1 ? 5 : 4
          });
        });
      }

      // Empleados sin nómina procesada en el mes actual
      const unpaidEmployees = db.exec(`
        SELECT COUNT(DISTINCT e.id) as count
        FROM employees e
        WHERE e.status = 'active'
        AND e.id NOT IN (
          SELECT DISTINCT employee_id 
          FROM payroll_entries pe
          JOIN payroll_periods pp ON pe.period_id = pp.id
          WHERE strftime('%Y-%m', pp.pay_date) = strftime('%Y-%m', 'now')
        )
      `);

      if (unpaidEmployees.length > 0 && unpaidEmployees[0].values[0][0] > 0) {
        const count = unpaidEmployees[0].values[0][0];
        this.addNotification({
          type: 'warning',
          module: 'payroll',
          title: `Empleados sin Nómina`,
          message: `${count} empleado${count !== 1 ? 's' : ''} sin pago este mes`,
          action: '/employee-mgr',
          actionLabel: 'Ver Empleados',
          priority: 3
        });
      }
    } catch (error) {
      console.error('Error checking payroll alerts:', error);
    }
  }

  /**
   * Conciliaciones bancarias atrasadas
   */
  private async checkReconciliationOverdue(): Promise<void> {
    if (!db) return;

    try {
      // Cuentas sin conciliar en 30+ días
      const overdueAccounts = db.exec(`
        SELECT ba.account_name, ba.account_number, MAX(rs.statement_date) as last_reconciliation
        FROM bank_accounts ba
        LEFT JOIN reconciliation_statements rs ON ba.id = rs.bank_account_id
        WHERE ba.is_active = 1
        GROUP BY ba.id
        HAVING last_reconciliation IS NULL 
           OR JULIANDAY('now') - JULIANDAY(last_reconciliation) > 30
      `);

      if (overdueAccounts.length > 0 && overdueAccounts[0].values.length > 0) {
        overdueAccounts[0].values.forEach((row: any) => {
          const lastDate = row[2] || 'Nunca';
          this.addNotification({
            type: 'warning',
            module: 'banking',
            title: `Conciliación Atrasada: ${row[0]}`,
            message: `Última conciliación: ${lastDate}`,
            action: '/bank-reconciliation',
            actionLabel: 'Conciliar Ahora',
            priority: 3
          });
        });
      }

      // Transacciones bancarias no conciliadas
      const unreconciledCount = db.exec(`
        SELECT COUNT(*) as count
        FROM bank_transactions bt
        WHERE bt.status = 'pending'
        AND JULIANDAY('now') - JULIANDAY(bt.transaction_date) > 7
      `);

      if (unreconciledCount.length > 0 && unreconciledCount[0].values[0][0] > 0) {
        const count = unreconciledCount[0].values[0][0];
        this.addNotification({
          type: 'info',
          module: 'banking',
          title: `Transacciones sin Conciliar`,
          message: `${count} transacción${count !== 1 ? 'es' : ''} pendiente${count !== 1 ? 's' : ''} de conciliación`,
          action: '/bank-reconciliation',
          actionLabel: 'Ver Transacciones',
          priority: 2
        });
      }
    } catch (error) {
      console.error('Error checking reconciliation alerts:', error);
    }
  }

  /**
   * Fechas límite de impuestos
   */
  private async checkTaxFilingDeadlines(): Promise<void> {
    const today = new Date();
    const currentYear = today.getFullYear();

    // DR-15 mensual (día 20 de cada mes)
    const dr15Deadline = new Date(currentYear, today.getMonth(), 20);
    if (today > dr15Deadline) {
      dr15Deadline.setMonth(dr15Deadline.getMonth() + 1);
    }
    const daysUntilDR15 = Math.ceil((dr15Deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDR15 <= 5) {
      this.addNotification({
        type: daysUntilDR15 <= 2 ? 'urgent' : 'warning',
        module: 'tax',
        title: `Vencimiento DR-15`,
        message: `Declaración de impuestos vence en ${daysUntilDR15} día${daysUntilDR15 !== 1 ? 's' : ''}`,
        action: '/florida-dr15',
        actionLabel: 'Preparar DR-15',
        priority: daysUntilDR15 <= 2 ? 5 : 4
      });
    }

    // Sunbiz Annual Report (1 de mayo)
    const sunbizDeadline = new Date(currentYear, 4, 1);
    if (today > sunbizDeadline) {
      sunbizDeadline.setFullYear(currentYear + 1);
    }
    const daysUntilSunbiz = Math.ceil((sunbizDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilSunbiz <= 30) {
      this.addNotification({
        type: daysUntilSunbiz <= 7 ? 'urgent' : 'warning',
        module: 'tax',
        title: `Reporte Anual Sunbiz`,
        message: `Vence en ${daysUntilSunbiz} días - 1 de Mayo`,
        action: '/tax-config',
        actionLabel: 'Ver Configuración',
        priority: daysUntilSunbiz <= 7 ? 5 : 3
      });
    }
  }

  /**
   * Salud del sistema
   */
  private async checkSystemHealth(): Promise<void> {
    if (!db) return;

    try {
      // Verificar integridad de datos
      const tablesCheck = db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name IN ('customers', 'invoices', 'products', 'employees', 'bank_accounts')
      `);

      if (!tablesCheck.length || tablesCheck[0].values.length < 5) {
        this.addNotification({
          type: 'urgent',
          module: 'system',
          title: `Problema de Integridad`,
          message: `Algunas tablas del sistema no están disponibles`,
          action: '/system-logs',
          actionLabel: 'Ver Logs',
          priority: 5
        });
      }

      // Verificar tamaño de base de datos
      const dbSize = db.exec(`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`);
      if (dbSize.length > 0) {
        const sizeInMB = dbSize[0].values[0][0] / (1024 * 1024);
        if (sizeInMB > 100) { // Mayor a 100MB
          this.addNotification({
            type: 'info',
            module: 'system',
            title: `Base de Datos Grande`,
            message: `Tamaño actual: ${sizeInMB.toFixed(2)}MB - Considere optimización`,
            action: '/backups',
            actionLabel: 'Gestionar Backups',
            priority: 2
          });
        }
      }
    } catch (error) {
      console.error('Error checking system health:', error);
    }
  }

  /**
   * Agregar notificación a la lista
   */
  private addNotification(notification: Omit<SystemNotification, 'id' | 'timestamp'>): void {
    this.notifications.push({
      ...notification,
      id: `${notification.module}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    });
  }

  /**
   * Obtener notificaciones por módulo
   */
  async getNotificationsByModule(module: SystemNotification['module']): Promise<SystemNotification[]> {
    const all = await this.getAllNotifications();
    return all.filter(n => n.module === module);
  }

  /**
   * Obtener notificaciones urgentes
   */
  async getUrgentNotifications(): Promise<SystemNotification[]> {
    const all = await this.getAllNotifications();
    return all.filter(n => n.type === 'urgent' || n.priority >= 4);
  }

  /**
   * Marcar notificación como leída
   */
  dismissNotification(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.dismissed = true;
    }
  }

  /**
   * Obtener resumen de notificaciones
   */
  async getNotificationSummary(): Promise<{
    total: number;
    urgent: number;
    byModule: Record<string, number>;
  }> {
    const all = await this.getAllNotifications();
    const active = all.filter(n => !n.dismissed);

    const byModule: Record<string, number> = {};
    active.forEach(n => {
      byModule[n.module] = (byModule[n.module] || 0) + 1;
    });

    return {
      total: active.length,
      urgent: active.filter(n => n.type === 'urgent').length,
      byModule
    };
  }
}

// Exportar instancia singleton
export const notificationService = UnifiedNotificationService.getInstance();
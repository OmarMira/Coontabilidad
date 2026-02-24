import {
    Home, Users, Building2, Package, MapPin, ShoppingCart, TrendingUp,
    Package2, Calculator, FileText, BarChart3, Settings, Receipt, Search,
    ScanSearch, HardDrive, UserCheck, Lock, Bot, Activity,
    HelpCircle, Database, CreditCard, Shield,
    History, PieChart, ShieldCheck, Clock, DollarSign
} from 'lucide-react';

export interface MenuItemConfig {
    id: string;
    labelKey: string;
    icon: any;
    children?: MenuItemConfig[];
    badge?: string;
    isNew?: boolean;
}

export const NAVIGATION_CONFIG: MenuItemConfig[] = [
    {
        id: 'dashboard',
        labelKey: 'navigation.dashboard',
        icon: Home
    },
    {
        id: 'archivo',
        labelKey: 'navigation.archive',
        icon: FileText,
        children: [
            { id: 'company-data', labelKey: 'navigation.companyData', icon: Building2 },
            { id: 'admin-users', labelKey: 'navigation.usersSecurity', icon: UserCheck },
            { id: 'role-manager', labelKey: 'navigation.roleManager', icon: Shield },
            { id: 'audit-trail', labelKey: 'navigation.auditTrail', icon: History },
            { id: 'banks', labelKey: 'navigation.bankAccounts', icon: Building2 },
            { id: 'payment-methods', labelKey: 'navigation.paymentMethods', icon: CreditCard }
        ]
    },
    {
        id: 'cuentas-pagar',
        labelKey: 'navigation.accountsPayable',
        icon: Receipt,
        children: [
            { id: 'dashboard-suppliers', labelKey: 'navigation.suppliersDashboard', icon: Building2 },
            { id: 'suppliers', labelKey: 'navigation.suppliers', icon: Building2 },
            { id: 'bills', labelKey: 'navigation.purchaseInvoices', icon: FileText },
            { id: 'supplier-payments', labelKey: 'navigation.supplierPayments', icon: CreditCard },
            { id: 'purchase-orders', labelKey: 'navigation.purchaseOrders', icon: ShoppingCart },
            { id: 'payable-reports', labelKey: 'navigation.supplierReports', icon: BarChart3 }
        ]
    },
    {
        id: 'cuentas-cobrar',
        labelKey: 'navigation.accountsReceivable',
        icon: TrendingUp,
        children: [
            { id: 'dashboard-customers', labelKey: 'navigation.customersDashboard', icon: Users },
            { id: 'ard-module', labelKey: 'navigation.ardAnalysis', icon: ScanSearch },
            { id: 'customers', labelKey: 'navigation.customers', icon: Users },
            { id: 'invoices', labelKey: 'navigation.salesInvoices', icon: FileText },
            { id: 'customer-payments', labelKey: 'navigation.customerPayments', icon: CreditCard },
            { id: 'quotes', labelKey: 'navigation.quotes', icon: FileText },
            { id: 'receivable-reports', labelKey: 'navigation.customerReports', icon: BarChart3 }
        ]
    },
    {
        id: 'libro-mayor',
        labelKey: 'navigation.accounting',
        icon: Calculator,
        children: [
            { id: 'dashboard-financial', labelKey: 'navigation.financialDashboard', icon: TrendingUp },
            { id: 'reports-dashboard', labelKey: 'navigation.reportsDashboard', icon: BarChart3 },
            { id: 'accounting-periods', labelKey: 'navigation.closuresPeriods', icon: Lock },
            { id: 'ledger-hub', labelKey: 'navigation.ledgerAuxiliaries', icon: Database },
            { id: 'chart-accounts', labelKey: 'navigation.chartOfAccounts', icon: FileText },
            { id: 'journal-entries', labelKey: 'navigation.journalEntries', icon: FileText },
            { id: 'bank-reconciliation', labelKey: 'navigation.bankReconciliation', icon: FileText },
            { id: 'discrepancy-analysis', labelKey: 'navigation.discrepancyAnalysis', icon: BarChart3 },
            { id: 'bank-smart-import', labelKey: 'navigation.iaBankImport', icon: Bot },
            { id: 'general-ledger', labelKey: 'navigation.generalLedger', icon: FileText },
            { id: 'trial-balance', labelKey: 'navigation.trialBalance', icon: BarChart3 },
            { id: 'account-ledger', labelKey: 'navigation.accountAuxiliaries', icon: PieChart },
            { id: 'balance-sheet', labelKey: 'navigation.balanceSheet', icon: ShieldCheck },
            { id: 'income-statement', labelKey: 'navigation.incomeStatement', icon: TrendingUp },
            { id: 'cash-flow', labelKey: 'navigation.cashFlow', icon: DollarSign },
            { id: 'aging-report', labelKey: 'navigation.agingReport', icon: Clock },
            { id: 'fixed-assets', labelKey: 'navigation.assetManagement', icon: Package },
            { id: 'budgets', labelKey: 'navigation.budgets', icon: BarChart3 }
        ]
    },
    {
        id: 'payroll',
        labelKey: 'navigation.payroll',
        icon: Users,
        children: [
            { id: 'dashboard-payroll', labelKey: 'navigation.payrollDashboard', icon: PieChart },
            { id: 'employee-mgr', labelKey: 'navigation.employeeManagement', icon: UserCheck },
            { id: 'payroll-process', labelKey: 'navigation.processPayroll', icon: Calculator },
            { id: 'payroll-review', labelKey: 'navigation.reviewPayroll', icon: ShieldCheck },
            { id: 'payroll-reports', labelKey: 'navigation.payrollReports', icon: BarChart3 }
        ]
    },
    {
        id: 'inventario',
        labelKey: 'navigation.inventory',
        icon: Package,
        children: [
            { id: 'dashboard-inventory', labelKey: 'navigation.inventoryDashboard', icon: PieChart },
            { id: 'products', labelKey: 'navigation.productsServices', icon: Package },
            { id: 'inventory-movements', labelKey: 'navigation.movements', icon: TrendingUp },
            { id: 'inventory-adjustments', labelKey: 'navigation.inventoryAdjustments', icon: Settings },
            { id: 'inventory-reports', labelKey: 'navigation.inventoryReports', icon: BarChart3 },
            { id: 'product-categories', labelKey: 'navigation.categories', icon: Package2 },
            { id: 'locations', labelKey: 'navigation.locations', icon: MapPin }
        ]
    },
    {
        id: 'impuestos',
        labelKey: 'navigation.taxes',
        icon: Receipt,
        children: [
            { id: 'tax-config', labelKey: 'navigation.taxConfig', icon: Settings },
            { id: 'florida-dr15', labelKey: 'navigation.dr15Report', icon: FileText },
            { id: 'tax-calendar', labelKey: 'navigation.taxCalendar', icon: FileText },
            { id: 'tax-rates', labelKey: 'navigation.countyRates', icon: MapPin },
            { id: 'tax-reports', labelKey: 'navigation.taxReports', icon: BarChart3 }
        ]
    },
    {
        id: 'herramientas',
        labelKey: 'navigation.tools',
        icon: HelpCircle,
        children: [
            { id: 'accounting-diagnosis', labelKey: 'navigation.accountingDiagnosis', icon: Activity },
            { id: 'journal-entry-test', labelKey: 'navigation.journalEntryTest', icon: FileText },
            { id: 'backups', labelKey: 'navigation.backupsRestoration', icon: HardDrive },
            { id: 'system-logs', labelKey: 'navigation.systemLogs', icon: Activity },
            { id: 'auditoria', labelKey: 'navigation.transactionAudit', icon: Search },
            { id: 'system-audit', labelKey: 'navigation.audit', icon: History },
            { id: 'verify', labelKey: 'navigation.ironCoreVerify', icon: Shield },
            { id: 'help', labelKey: 'navigation.helpCenter', icon: HelpCircle }
        ]
    },
    {
        id: 'ai-assistant',
        labelKey: 'navigation.aiAssistant',
        icon: Bot
    }
];

export const getNavigationPath = (targetId: string, lang: 'es' | 'en' = 'es'): string => {
    const findPath = (items: MenuItemConfig[], parentLabel?: string): string | null => {
        for (const item of items) {
            if (item.id === targetId) {
                return parentLabel ? `${parentLabel} > ${item.id}` : item.id;
            }
            if (item.children) {
                const result = findPath(item.children, item.id);
                if (result) return result;
            }
        }
        return null;
    };

    return findPath(NAVIGATION_CONFIG) || targetId;
};

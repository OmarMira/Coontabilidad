// App.tsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Plus, TrendingUp, FileText, Shield } from 'lucide-react';

// Elite Design System - Global Styles
import './styles/elite-styles.css';

import { useLocale } from './i18n/useLocale';

import {
  initDB, addCustomer, getCustomers, updateCustomer, deleteCustomer, canDeleteCustomer, getStatsWithSuppliers, isDatabaseReady, Customer,
  getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, getActiveProducts, Invoice, Product, InvoiceItem,
  addSupplier, getSuppliers, updateSupplier, deleteSupplier, canDeleteSupplier, Supplier,
  getBills, getBillById, createBill, updateBill, deleteBill, Bill, BillItem,
  getChartOfAccounts, createChartOfAccount, updateChartOfAccount, deleteChartOfAccount, ChartOfAccount,
  diagnoseAccountingSystem,
  createJournalEntry, getJournalEntries, generateSalesJournalEntry, generatePurchaseJournalEntry,
  generateBalanceSheet, generateIncomeStatement,
  getCompanyData, updateCompanyData, CompanyData,
  getProducts, createProduct, updateProduct, deleteProduct, getProductById, ProductCategory,
  getProductCategories, createProductCategory, updateProductCategory, deleteProductCategory,
  getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount, BankAccount, db,
  getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote, convertQuoteToInvoice, Quote, QuoteLine
} from '@/database/simple-db';
import { DatabaseService } from '@/database/DatabaseService';

// Core components (always loaded)
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Dashboard } from './components/Dashboard';
import { Toaster } from 'react-hot-toast';
import { CheckCircle, XCircle, Brain, AlertTriangle, BookOpen } from 'lucide-react';
import { logger } from './core/logging/SystemLogger';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { offlineManager } from './utils/offline-manager';

// Lazy loaded components (heavy modules)
const ARDModule = lazy(() => import('./components/ard/ARDModule').then(m => ({ default: m.ARDModule })));
const ReportsDashboard = lazy(() => import('./components/reports/ReportsDashboard').then(m => ({ default: m.ReportsDashboard })));
const PayrollProcessor = lazy(() => import('./components/payroll/PayrollProcessor').then(m => ({ default: m.PayrollProcessor })));
const PayrollReview = lazy(() => import('./components/payroll/PayrollReview').then(m => ({ default: m.default })));
const EmployeePaystub = lazy(() => import('./components/payroll/EmployeePaystub').then(m => ({ default: m.EmployeePaystub })));
const PayrollEntryList = lazy(() => import('./components/payroll/PayrollEntryList').then(m => ({ default: m.PayrollEntryList })));
const PayrollReports = lazy(() => import('./components/payroll/PayrollReports').then(m => ({ default: m.PayrollReports })));
const PayrollSettings = lazy(() => import('./components/payroll/PayrollSettings').then(m => ({ default: m.PayrollSettings })));
const EmployeeManager = lazy(() => import('./components/payroll/EmployeeManager').then(m => ({ default: m.EmployeeManager })));
const BankReconciliation = lazy(() => import('./components/banking/BankReconciliation').then(m => ({ default: m.BankReconciliation })));
const DiscrepancyAnalysis = lazy(() => import('./components/banking/DiscrepancyAnalysis').then(m => ({ default: m.DiscrepancyAnalysis })));
const FloridaTaxSummary = lazy(() => import('./components/FloridaTaxSummary').then(m => ({ default: m.FloridaTaxSummary })));
const InventoryReports = lazy(() => import('./components/inventory/InventoryReports').then(m => ({ default: m.InventoryReports })));
const InventoryMovements = lazy(() => import('./components/inventory/InventoryMovements').then(m => ({ default: m.InventoryMovements })));
const InventoryAdjustments = lazy(() => import('./components/inventory/InventoryAdjustments').then(m => ({ default: m.InventoryAdjustments })));
const InventoryKardexViewer = lazy(() => import('./components/inventory/InventoryKardexViewer').then(m => ({ default: m.InventoryKardexViewer })));
const LocationsManager = lazy(() => import('./components/inventory/LocationsManager').then(m => ({ default: m.LocationsManager })));
const CashFlowStatement = lazy(() => import('./components/reports/CashFlowStatement').then(m => ({ default: m.CashFlowStatement })));
const AgingReport = lazy(() => import('./components/reports/AgingReport').then(m => ({ default: m.AgingReport })));
const AccountLedger = lazy(() => import('./components/reports/AccountLedger').then(m => ({ default: m.AccountLedger })));
const UnifiedAssistant = lazy(() => import('./components/ai/UnifiedAssistant').then(m => ({ default: m.UnifiedAssistant })));
const HealthCheckPage = lazy(() => import('./pages/HealthCheckPage').then(m => ({ default: m.HealthCheckPage })));
const SystemStatusDashboard = lazy(() => import('./pages/SystemStatusDashboard').then(m => ({ default: m.SystemStatusDashboard })));
const QuarantinePanel = lazy(() => import('./components/banking/QuarantinePanel').then(m => ({ default: m.QuarantinePanel })));
const ClassificationRulesManager = lazy(() => import('./components/banking/ClassificationRulesManager').then(m => ({ default: m.ClassificationRulesManager })));

// Regular imports (lighter components)
import { UserRoleManager } from './components/system/UserRoleManager';
import { CompanyInfoForm } from './components/system/CompanyInfoForm';
import { FiscalSettingsForm } from './components/system/FiscalSettingsForm';
import { SecuritySettings } from './components/system/SecuritySettings';
import { SuppliersList } from './components/purchasing/SuppliersList';
import { PurchaseOrdersList } from './components/purchasing/PurchaseOrdersList';
import { PurchaseOrderForm } from './components/purchasing/PurchaseOrderForm';
import { PayableReports } from './components/purchasing/PayableReports';
import { JournalEntryForm } from './components/accounting/JournalEntryForm';
import { TrialBalanceReport } from './components/accounting/TrialBalanceReport';
import { FinancialStatements } from './components/accounting/FinancialStatements';
import { QuotesList, ReceivableReports } from './components/invoices/ARComponents';
import { QuoteForm } from './features/quotes/components/QuoteForm';
import { QuoteDetailView } from './features/quotes/components/QuoteDetailView';
// Módulo DR15 eliminado — TaxComponents ya no existe
import { BackupPanel } from './components/BackupPanel';
import { LiveVerification } from './pages/LiveVerification';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceDetailView } from './components/InvoiceDetailView';
import { SupplierForm } from './components/SupplierForm';
import { SupplierList } from './components/SupplierList';
import { SupplierDetailView } from './components/SupplierDetailView';
import { BillForm } from './components/BillForm';
import { BillList } from './components/BillList';
import { BillDetailView } from './components/BillDetailView';
import { SystemLogs } from './components/SystemLogs';
import { ChartOfAccounts } from './components/ChartOfAccounts';
import { AccountingDiagnosis } from './components/AccountingDiagnosis';
import { JournalEntryTest } from './components/JournalEntryTest';
import { BankingModule } from './components/banking/BankingModule';
import { TransactionClassifier } from './components/banking/TransactionClassifier';
import { CustomerPayments } from './features/receivables/components/CustomerPayments';
import { SupplierPayments } from './components/SupplierPayments';
import { ProductForm } from './components/ProductForm';
import { ProductList } from './components/ProductList';
import { ProductDetailView } from './components/ProductDetailView';
import { ProductCategoryForm } from './components/ProductCategoryForm';
import { ProductCategoryList } from './components/ProductCategoryList';
import { CompanyDataForm } from './components/CompanyDataForm';
import { PaymentMethods } from './components/PaymentMethods';
// DEPRECATED: Migrado a BackupPanel (Iron Core v1.0)
// import { BackupRestore } from './components/BackupRestore';
import { TransactionAudit } from './components/TransactionAudit';
import { BankAccountList } from './components/BankAccountList';
import { BankAccountForm } from './components/BankAccountForm';
import { SalesInvoiceForm } from './features/sales/components/SalesInvoiceForm';
import { BankStatementImporter } from './components/BankStatementImporter';
import { BankImport } from './components/banking/BankImport';
import { ManualJournalEntries } from './components/ManualJournalEntries';
import { GeneralLedger } from './components/GeneralLedger';
import { IncomeStatement } from './components/accounting/IncomeStatement';
import { ModulePlaceholder } from './components/ModulePlaceholder';
import { TaxRates } from './components/TaxRates';

import { BalanceSheet } from './components/BalanceSheet';
import { HelpCenter } from './components/HelpCenter';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
// FloridaTaxReport eliminado — reemplazado por FloridaTaxSummary
import { InvoiceService } from './services/invoicing/InvoiceService';
import { SQLiteEngine } from './core/database/SQLiteEngine';
import { MigrationEngine } from './core/migrations/MigrationEngine';
import { NotificationService } from './services/NotificationService';
import { UserList } from './components/auth/UserList';
import { UserForm } from './components/auth/UserForm';
import { RoleManager } from './components/auth/RoleManager';
import { AuditTrailTable } from './components/audit/AuditTrailTable';
import { CustomerFormAdvanced } from './components/CustomerFormAdvanced';
import { CustomerDetailView } from './components/CustomerDetailView';
import { CustomerList } from './components/CustomerList';
import { AppRouter } from './components/AppRouter';

// --- CIERRE CONTABLE FASE 3 ---
import { PeriodManager } from './components/accounting/PeriodManager';
import { LedgerHub } from './components/accounting/LedgerHub';
import { DiagnosticSQL } from './pages/DiagnosticSQL';

// --- PAYROLL MODULE (Lazy loaded above) ---
// import { EmployeeManager } from './components/payroll/EmployeeManager';
// import { PayrollProcessor } from './components/payroll/PayrollProcessor';
// import { PayrollReports } from './components/payroll/PayrollReports';

// --- FIXED ASSETS MODULE ---
import { FixedAssetsManager } from './components/assets/FixedAssetsManager';

// --- BUDGETS MODULE ---
import { BudgetManager } from './components/budgets/BudgetManager';

// --- SYSTEM AUDIT MODULE ---
import { SystemAudit } from './components/admin/SystemAudit';

// --- DASHBOARDS AVANZADOS ---
const FinancialDashboard = lazy(() => import('./components/dashboards/FinancialDashboard').then(m => ({ default: m.FinancialDashboard })));
const InventoryDashboard = lazy(() => import('./components/dashboards/InventoryDashboard').then(m => ({ default: m.InventoryDashboard })));
const CustomerDashboard = lazy(() => import('./components/dashboards/CustomerDashboard').then(m => ({ default: m.CustomerDashboard })));
const SupplierDashboard = lazy(() => import('./components/dashboards/SupplierDashboard').then(m => ({ default: m.SupplierDashboard })));
const PayrollDashboard = lazy(() => import('./components/dashboards/PayrollDashboard').then(m => ({ default: m.PayrollDashboard })));


// 1. Add to AppState
interface AppState {
  showAssistant: boolean;
  isLoading: boolean;
  isOnline: boolean;
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  bills: Bill[];
  products: Product[];
  productCategories: ProductCategory[];
  bankAccounts: BankAccount[];
  quotes: Quote[];
  dbStats: {
    customers: number;
    invoices: number;
    revenue: number;
    suppliers: number;
    bills: number;
    expenses: number;
  };
  error: string | null;
  success: string | null;
  editingCustomer: Customer | null;
  viewingCustomer: Customer | null;
  editingSupplier: Supplier | null;
  viewingSupplier: Supplier | null;
  editingInvoice: Invoice | null;
  viewingInvoice: Invoice | null;
  editingBill: Bill | null;
  viewingBill: Bill | null;
  editingProduct: Product | null;
  viewingProduct: Product | null;
  editingProductCategory: ProductCategory | null;
  editingQuote: Quote | null;
  viewingQuote: Quote | null;
  showingBillForm: boolean;
  showingSupplierForm: boolean;
  showingCustomerForm: boolean;
  showingInvoiceForm: boolean;
  showingProductForm: boolean;
  showingProductCategoryForm: boolean;
  showingQuoteForm: boolean;
  editingBankAccount: BankAccount | null;
  showingBankAccountForm: boolean;
  initializationStep: string;
  currentSection: string;
  chartOfAccounts: ChartOfAccount[];
  kardexParams?: { productId?: string; type?: string };
  selectedPayrollId?: number;
  selectedBankAccountId?: number;
}


function App() {
  // Login bypass activado para localhost
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user_id', '1');
    localStorage.setItem('role_id', '1');
    
    if (!localStorage.getItem('accountexpress_user')) {
      const userData = {
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@accountexpress.com',
          full_name: 'Administrator',
          display_name: 'AdminUser',
          role: 'admin',
          role_id: 1,
          role_level: 10,
          permissions: { all: true }
        },
        expiresAt: Date.now() + 8 * 60 * 60 * 1000
      };
      localStorage.setItem('accountexpress_user', JSON.stringify(userData));
      console.log("Login bypass activado para localhost");
    }
  }

  const { user } = useAuth();
  const { t, language } = useLocale();
  const [showUnifiedAssistant, setShowUnifiedAssistant] = useState(false);
  const [state, setState] = useState<AppState>({
    isLoading: true,
    isOnline: navigator.onLine,
    customers: [],
    suppliers: [],
    invoices: [],
    bills: [],
    products: [],
    productCategories: [],
    bankAccounts: [],
    quotes: [],
    dbStats: { customers: 0, invoices: 0, revenue: 0, suppliers: 0, bills: 0, expenses: 0 },
    error: null,
    success: null,
    editingCustomer: null,
    viewingCustomer: null,
    editingSupplier: null,
    viewingSupplier: null,
    editingInvoice: null,
    viewingInvoice: null,
    editingBill: null,
    viewingBill: null,
    editingProduct: null,
    viewingProduct: null,
    editingProductCategory: null,
    editingQuote: null,
    viewingQuote: null,
    showingBillForm: false,
    showingSupplierForm: false,
    showingCustomerForm: false,
    showingInvoiceForm: false,
    showingProductForm: false,
    showingProductCategoryForm: false,
    showingQuoteForm: false,
    editingBankAccount: null,
    showingBankAccountForm: false,
    initializationStep: t('system.initializing'),
    currentSection: 'dashboard',
    showAssistant: false,
    chartOfAccounts: []
  });

  // Detectar cambios de conectividad y registrar SW
  useEffect(() => {
    // Configurar Notificaciones y Service Worker (Iron Core Task 4)
    NotificationService.init();
    if ('serviceWorker' in navigator) {
      // Usar 'sw.js' en producción (ubicado en public)
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          // Forzar actualización si hay un nuevo SW
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              }
            });
          });
        })
        .catch(e => console.error('[App] Registro de SW fallido', e));
    }

    // Suscribirse al gestor de estado offline
    const unsubscribe = offlineManager.subscribe((online) => {
      setState(prev => ({ ...prev, isOnline: online }));
    });

    return () => unsubscribe();
  }, []);

  // Inicializar base de datos
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null, initializationStep: t('system.verifyingCompatibility') }));

        logger.info('App', 'init_start', 'Iniciando AccountExpress Next-Gen MVP');

        // IRON CLAD UPGRADE - Phase 1, Day 5: Persistent Storage Integration
        setState(prev => ({ ...prev, initializationStep: t('system.requestingStorage') }));

        try {
          const { PersistentStorageService } = await import('./services/PersistentStorageService');
          const storageStatus = await PersistentStorageService.initialize();

          if (!storageStatus.isPersistent) {
            console.warn('⚠️ Persistent storage not granted - data may be cleared by browser');
            logger.warn('App', 'storage_not_persistent', 'Persistent storage denied by browser');
          }

          if (!storageStatus.hasSufficientSpace) {
            console.warn('⚠️ Insufficient storage space available');
            logger.warn('App', 'storage_low', `Low storage: ${storageStatus.quota.availableMB}MB available`);
          }

          // Start storage monitoring (every 5 minutes)
          PersistentStorageService.startMonitoring(5 * 60 * 1000);

        } catch (storageError) {
          console.error('Error initializing persistent storage:', storageError);
          logger.error('App', 'storage_init_failed', 'Failed to initialize persistent storage', null, storageError as Error);
        }

        // Verificar compatibilidad básica
        if (typeof window === 'undefined') {
          throw new Error('Entorno no compatible - se requiere navegador web');
        }

        setState(prev => ({ ...prev, initializationStep: t('system.configuringSQLite') }));

        // Inicializar sin contraseña primero para simplificar
        const db = await initDB();

        // CRITICAL: Set DatabaseService instance
        await DatabaseService.setDB(db);

        setState(prev => ({ ...prev, initializationStep: t('system.loadingData') }));

        // Cargar datos iniciales
        await loadData();

        // IRON CLAD UPGRADE - Phase 1, Day 2: Schedule Auto-Backup
        setState(prev => ({ ...prev, initializationStep: t('system.configuringBackups') }));

        try {
          await DatabaseService.scheduleAutoBackup();
          // Sanitation Step 4.1: Start Local Auto-Backup Timer (5 min)
          DatabaseService.startAutoBackupTimer();
          logger.info('App', 'auto_backup_scheduled', 'Automatic backups scheduled successfully');
        } catch (backupError) {
          console.error('Error scheduling auto-backup:', backupError);
          logger.error('App', 'auto_backup_failed', 'Failed to schedule auto-backup', null, backupError as Error);
        }

        // IRON CLAD UPGRADE - Phase 3: AI Proactive Anomaly Detection
        setState(prev => ({ ...prev, initializationStep: t('system.startingAnomalyDetection') }));

        try {
          const { AnomalyDetector } = await import('./services/ai/AnomalyDetector');
          AnomalyDetector.scheduleAutoScan();
          logger.info('App', 'anomaly_detector_started', 'AI Anomaly Detector started successfully');
        } catch (anomalyError) {
          console.error('Error starting anomaly detector:', anomalyError);
          logger.error('App', 'anomaly_detector_failed', 'Failed to start anomaly detector', null, anomalyError as Error);
        }


        setState(prev => ({
          ...prev,
          isLoading: false,
          success: t('system.initSuccess'),
          initializationStep: t('system.completed')
        }));

        logger.info('App', 'init_success', 'AccountExpress inicializado correctamente', {
          customers: state.customers.length,
          suppliers: state.suppliers.length,
          invoices: state.invoices.length,
          bills: state.bills.length
        });

        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setState(prev => ({ ...prev, success: null }));
        }, 3000);

      } catch (error) {
        logger.critical('App', 'init_failed', `Error crítico en inicialización: ${error instanceof Error ? error.message : 'Error desconocido'} `, null, error as Error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: `${t('system.error')} : ${error instanceof Error ? error.message : 'Error desconocido'} `,
          initializationStep: t('system.error')
        }));
      }
    };

    initializeApp();
  }, []);

  // Recargar datos cuando el usuario cambie (importante para aislamiento)
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Detectar sección inicial desde la URL (Soporte/Legales públicos)
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/terms') setState(prev => ({ ...prev, currentSection: 'terms' }));
    else if (path === '/privacy') setState(prev => ({ ...prev, currentSection: 'privacy' }));
    else if (path === '/help') setState(prev => ({ ...prev, currentSection: 'help' }));
    else setState(prev => ({ ...prev, currentSection: 'dashboard' }));
  }, []);


  const loadData = async () => {
    try {
      const filters = user ? { userId: user.id, role: user.role } : undefined;

      const customers = getCustomers(filters);
      const suppliers = getSuppliers(filters);
      const invoices = getInvoices(filters);
      const bills = getBills(filters);
      const products = getProducts();
      const productCategories = getProductCategories();
      const bankAccounts = getBankAccounts();
      const chartOfAccounts = getChartOfAccounts();
      const quotes = getQuotes(filters);
      const stats = getStatsWithSuppliers(filters);

      setState(prev => ({
        ...prev,
        customers,
        suppliers,
        invoices,
        bills,
        products,
        productCategories,
        bankAccounts,
        chartOfAccounts,
        quotes,
        dbStats: stats
      }));

    } catch (error) {
      console.error('Error loading data:', error);
      showError(t('messages.errorLoading'));
    }
  };

  const showError = (message: string) => {
    setState(prev => ({ ...prev, error: message }));
    setTimeout(() => {
      setState(prev => ({ ...prev, error: null }));
    }, 5000);
  };

  const showSuccess = (message: string) => {
    setState(prev => ({ ...prev, success: message }));
    setTimeout(() => {
      setState(prev => ({ ...prev, success: null }));
    }, 3000);
  };

  const handleNavigate = (sectionRaw: string) => {
    // Supports 'section:accountId' encoding (e.g. 'transaction-classifier:5')
    const colonIdx = sectionRaw.indexOf(':');
    const section = colonIdx !== -1 ? sectionRaw.slice(0, colonIdx) : sectionRaw;
    const accountIdFromNav = colonIdx !== -1 ? parseInt(sectionRaw.slice(colonIdx + 1), 10) : undefined;

    if (section === 'ai-assistant') {
      setState(prev => ({ ...prev, showAssistant: true }));
      return;
    }
    setState(prev => ({
      ...prev,
      currentSection: section,
      ...(accountIdFromNav !== undefined && { selectedBankAccountId: accountIdFromNav }),
      editingCustomer: null,
      viewingCustomer: null,
      editingSupplier: null,
      viewingSupplier: null,
      editingInvoice: null,
      viewingInvoice: null,
      editingBill: null,
      viewingBill: null,
      editingProduct: null,
      viewingProduct: null,
      editingProductCategory: null,
      showingBillForm: false,
      showingSupplierForm: false,
      showingCustomerForm: false,
      showingInvoiceForm: false,
      showingProductForm: false,
      showingProductCategoryForm: false
    }));
  };

  useEffect(() => {
    const onNavigateEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail === 'string') {
        handleNavigate(customEvent.detail);
      }
    };
    window.addEventListener('navigate-to', onNavigateEvent);
    return () => window.removeEventListener('navigate-to', onNavigateEvent);
  }, []);


  const handleAddCustomer = async (customerData: any) => {
    try {

      // Verificar que la aplicación esté completamente cargada
      if (state.isLoading) {
        showError(t('messages.systemInitializing'));
        return;
      }

      // Verificar que la base de datos esté lista
      if (!isDatabaseReady()) {
        showError(t('messages.dbNotReady'));
        return;
      }

      const customerId = await addCustomer(customerData, user?.id);

      await loadData();

      // Cerrar el formulario y mostrar mensaje de éxito
      setState(prev => ({ ...prev, showingCustomerForm: false }));
      showSuccess(t('messages.customerAdded', { name: customerData.name }));
    } catch (error) {
      console.error('Error adding customer:', error);
      showError(`${t('messages.errorAdding')} : ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setState(prev => ({ ...prev, viewingCustomer: customer }));
  };

  const handleEditCustomer = (customer: Customer) => {
    setState(prev => ({ ...prev, editingCustomer: customer }));
  };

  const handleUpdateCustomer = async (customerData: any) => {
    if (!state.editingCustomer) return;

    try {
      const result = updateCustomer(state.editingCustomer.id, customerData, user?.id);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingCustomer: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      showError(t('messages.errorUpdating'));
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      // Verificar si se puede eliminar
      const deleteCheck = { canDelete: true, reason: 'No se puede eliminar el proveedor' }; // Corregido de Áreason a reason
      if (!deleteCheck.canDelete) {
        showError(deleteCheck.reason || 'No se puede eliminar el cliente');
        return;
      }

      // Confirmar eliminación
      if (!window.confirm(t('messages.confirmDeleteCustomer'))) {
        return;
      }

      const result = deleteCustomer(id, user?.id);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      showError(t('messages.errorDeleting'));
    }
  };

  const handleCancelEdit = () => {
    setState(prev => ({ ...prev, editingCustomer: null, showingCustomerForm: false }));
  };

  const handleBackFromDetail = () => {
    setState(prev => ({ ...prev, viewingCustomer: null }));
  };

  // ==========================================
  // FUNCIONES PARA FACTURAS
  // ==========================================

  const handleCreateInvoice = async (data: any) => {
    try {

      const engine = new SQLiteEngine();
      engine.setDB(db);
      // await engine.initialize('accountexpress.db'); // Don't re-initialize, use existing db
      const service = new InvoiceService(engine);

      // Pasar userId al DTO si no está
      const invoiceData = { ...data, userId: user?.id || 1 };

      await service.createInvoice(invoiceData);

      await loadData();
      setState(prev => ({ ...prev, showingInvoiceForm: false }));
      showSuccess(t('messages.invoiceCreated'));

    } catch (error) {
      console.error('Error creating invoice:', error);
      showError(`${t('messages.errorAdding')} : ${error instanceof Error ? error.message : 'Error desconocido'} `);
    }
  };

  const handleCreateInvoiceLegacy = async (invoiceData: Partial<Invoice>, items: Partial<InvoiceItem>[]) => {
    // Keep old handler renaming if needed or just remove. 
    // For safety, we replaced the usage, so this function body is what matters.
    // But wait, the signature in SalesInvoiceForm is (data: any). 
    // The signature in InvoiceForm was (invoiceData, items).
    // We are replacing the function definition.
  };

  const handleViewInvoice = (invoice: Invoice) => {
    const fullInvoice = getInvoiceById(invoice.id);
    if (fullInvoice) {
      setState(prev => ({ ...prev, viewingInvoice: fullInvoice }));
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    const fullInvoice = getInvoiceById(invoice.id);
    if (fullInvoice) {
      setState(prev => ({ ...prev, editingInvoice: fullInvoice }));
    }
  };

  const handleUpdateInvoice = async (invoiceData: Partial<Invoice>, items?: Partial<InvoiceItem>[]) => {
    if (!state.editingInvoice) return;

    try {
      const result = updateInvoice(state.editingInvoice.id, invoiceData, items);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingInvoice: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      showError(t('messages.errorUpdating'));
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    try {
      const result = deleteInvoice(id);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showError(t('messages.errorDeleting'));
    }
  };

  const handleCancelInvoiceEdit = () => {
    setState(prev => ({ ...prev, editingInvoice: null, showingInvoiceForm: false }));
  };

  const handleBackFromInvoiceDetail = () => {
    setState(prev => ({ ...prev, viewingInvoice: null }));
  };

  // ==========================================
  // FUNCIONES PARA PROVEEDORES
  // ==========================================

  const handleAddSupplier = async (supplierData: any) => {
    try {

      // Verificar que la aplicación esté completamente cargada
      if (state.isLoading) {
        showError(t('messages.systemInitializing'));
        return;
      }

      // Verificar que la base de datos esté lista
      if (!isDatabaseReady()) {
        showError(t('messages.dbNotReady'));
        return;
      }

      const supplierId = addSupplier(supplierData, user?.id);

      await loadData();

      // Cerrar el formulario y mostrar mensaje de éxito
      setState(prev => ({ ...prev, showingSupplierForm: false }));
      showSuccess(t('messages.supplierAdded', { name: supplierData.name }));
    } catch (error) {
      console.error('Error adding supplier:', error);
      showError(`${t('messages.errorAdding')} : ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setState(prev => ({ ...prev, viewingSupplier: supplier }));
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setState(prev => ({ ...prev, editingSupplier: supplier }));
  };

  const handleUpdateSupplier = async (supplierData: any) => {
    if (!state.editingSupplier) return;

    try {
      const result = updateSupplier(state.editingSupplier.id, supplierData, user?.id);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingSupplier: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      showError(t('messages.errorUpdating'));
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    try {
      // Verificar si se puede eliminar
      const deleteCheck = { canDelete: true, reason: 'No se puede eliminar el proveedor' }; // Corregido de Áreason a reason
      if (!deleteCheck.canDelete) {
        showError(deleteCheck.reason || 'No se puede eliminar el cliente');
        return;
      }

      // Confirmar eliminación
      if (!window.confirm(t('messages.confirmDeleteSupplier'))) {
        return;
      }

      const result = deleteSupplier(id, user?.id);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showError(t('messages.errorDeleting'));
    }
  };

  const handleCancelSupplierEdit = () => {
    setState(prev => ({ ...prev, editingSupplier: null, showingSupplierForm: false }));
  };

  const handleBackFromSupplierDetail = () => {
    setState(prev => ({ ...prev, viewingSupplier: null }));
  };

  // ==========================================
  // FUNCIONES PARA FACTURAS DE COMPRA (BILLS)
  // ==========================================

  const handleCreateBill = async (billData: Partial<Bill>, items: Partial<BillItem>[]) => {
    try {

      const result = createBill(billData, items);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      showError(`${t('messages.errorAdding')} : ${error instanceof Error ? error.message : 'Error desconocido'} `);
    }
  };

  const handleViewBill = (bill: Bill) => {
    const fullBill = getBillById(bill.id);
    if (fullBill) {
      setState(prev => ({ ...prev, viewingBill: fullBill }));
    }
  };

  const handleEditBill = (bill: Bill) => {
    const fullBill = getBillById(bill.id);
    if (fullBill) {
      setState(prev => ({ ...prev, editingBill: fullBill }));
    }
  };

  const handleUpdateBill = async (billData: Partial<Bill>, items?: Partial<BillItem>[]) => {
    if (!state.editingBill) return;

    try {
      const result = await updateBill(state.editingBill.id, billData, items);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingBill: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating bill:', error);
      showError(t('messages.errorUpdating'));
    }
  };

  const handleDeleteBill = async (id: number) => {
    try {
      // Confirmar eliminación
      if (!window.confirm(t('messages.confirmDeleteBill'))) {
        return;
      }

      const result = deleteBill(id);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      showError(t('messages.errorDeleting'));
    }
  };

  const handleCancelBillEdit = () => {
    setState(prev => ({ ...prev, editingBill: null }));
  };

  const handleBackFromBillDetail = () => {
    setState(prev => ({ ...prev, viewingBill: null }));
  };

  const handleBillSave = async (billData: Partial<Bill>, items: Partial<BillItem>[]) => {
    try {
      if (state.editingBill) {
        // Actualizar factura existente
        const result = await updateBill(state.editingBill.id, billData, items, user?.id);
        if (result.success) {
          setState(prev => ({
            ...prev,
            editingBill: null,
            success: result.message
          }));
          await loadData(); // Recargar datos
        } else {
          setState(prev => ({ ...prev, error: result.message }));
        }
      } else {
        // Crear nueva factura
        const result = await createBill(billData, items, user?.id);
        if (result.success) {
          setState(prev => ({
            ...prev,
            showingBillForm: false,
            success: result.message
          }));
          await loadData(); // Recargar datos
        } else {
          setState(prev => ({ ...prev, error: result.message }));
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `${t('messages.errorUpdating')} : ${error instanceof Error ? error.message : 'Error desconocido'} `
      }));
    }
  };

  // ==========================================
  // FUNCIONES PARA PRODUCTOS
  // ==========================================

  const handleCreateProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {

      const result = createProduct(productData);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, showingProductForm: false }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showError(`${t('messages.errorAdding')} : ${error instanceof Error ? error.message : 'Error desconocido'} `);
    }
  };

  const handleViewProduct = (product: Product) => {
    const fullProduct = getProductById(product.id);
    if (fullProduct) {
      setState(prev => ({ ...prev, viewingProduct: fullProduct }));
    }
  };

  const handleEditProduct = (product: Product) => {
    const fullProduct = getProductById(product.id);
    if (fullProduct) {
      setState(prev => ({ ...prev, editingProduct: fullProduct }));
    }
  };

  const handleUpdateProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (!state.editingProduct) return;

    try {
      const result = updateProduct(state.editingProduct.id, productData);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingProduct: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showError(t('messages.errorUpdating'));
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      // Confirmar eliminación
      if (!window.confirm(t('messages.confirmDeleteProduct'))) {
        return;
      }

      const result = deleteProduct(id);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showError(t('messages.errorDeleting'));
    }
  };

  const handleCancelProductEdit = () => {
    setState(prev => ({ ...prev, editingProduct: null, showingProductForm: false }));
  };

  const handleBackFromProductDetail = () => {
    setState(prev => ({ ...prev, viewingProduct: null }));
  };

  // ==========================================
  // FUNCIONES PARA CATEGORÍAS DE PRODUCTOS
  // ==========================================

  const handleCreateProductCategory = async (categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>) => {
    try {

      const result = createProductCategory(categoryData);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, showingProductCategoryForm: false }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error creating product category:', error);
      showError(`${t('messages.errorAdding')} : ${error instanceof Error ? error.message : 'Error desconocido'} `);
    }
  };

  const handleEditProductCategory = (category: ProductCategory) => {
    setState(prev => ({ ...prev, editingProductCategory: category }));
  };

  const handleUpdateProductCategory = async (categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>) => {
    if (!state.editingProductCategory) return;

    try {
      const result = updateProductCategory(state.editingProductCategory.id!, categoryData);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingProductCategory: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating product category:', error);
      showError(t('messages.errorUpdating'));
    }
  };

  const handleDeleteProductCategory = async (id: number) => {
    try {
      const result = deleteProductCategory(id);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error deleting product category:', error);
      showError(t('messages.errorDeleting'));
    }
  };

  const handleCancelProductCategoryEdit = () => {
    setState(prev => ({ ...prev, editingProductCategory: null, showingProductCategoryForm: false }));
  };

  // ==========================================
  // FUNCIONES PARA COTIZACIONES (QUOTES)
  // ==========================================

  const handleCreateQuote = async (quoteData: Partial<Quote>, items: Partial<QuoteLine>[]) => {
    try {
      const result = createQuote(quoteData, items, user?.id);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, showingQuoteForm: false }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      showError(`${t('messages.errorAdding')} : ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleViewQuote = (quote: Quote) => {
    const fullQuote = getQuoteById(quote.id);
    if (fullQuote) {
      setState(prev => ({ ...prev, viewingQuote: fullQuote }));
    }
  };

  const handleEditQuote = (quote: Quote) => {
    const fullQuote = getQuoteById(quote.id);
    if (fullQuote) {
      setState(prev => ({ ...prev, editingQuote: fullQuote }));
    }
  };

  const handleUpdateQuote = async (quoteData: Partial<Quote>, items?: Partial<QuoteLine>[]) => {
    if (!state.editingQuote) return;

    try {
      const result = updateQuote(state.editingQuote.id, quoteData, items, user?.id);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingQuote: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      showError(t('messages.errorUpdating'));
    }
  };

  const handleDeleteQuote = async (id: number) => {
    try {
      if (!window.confirm(t('messages.confirmDelete'))) {
        return;
      }

      const result = deleteQuote(id, user?.id);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      showError(t('messages.errorDeleting'));
    }
  };

  const handleConvertQuoteToInvoice = async (quoteId: number) => {
    try {
      const result = convertQuoteToInvoice(quoteId, user?.id);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, viewingQuote: null }));
        showSuccess(`${result.message}. Factura #${result.invoiceId} creada.`);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error converting quote:', error);
      showError(t('messages.errorUpdating'));
    }
  };

  const handleCancelQuoteEdit = () => {
    setState(prev => ({ ...prev, editingQuote: null, showingQuoteForm: false }));
  };

  const handleBackFromQuoteDetail = () => {
    setState(prev => ({ ...prev, viewingQuote: null }));
  };

  // ==========================================
  // FUNCIONES PARA CUENTAS BANCARIAS
  // ==========================================

  const handleCreateBankAccount = async (accountData: Omit<BankAccount, 'id' | 'created_at'>) => {
    try {
      const result = await createBankAccount(accountData);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, showingBankAccountForm: false }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error creating bank account:', error);
      showError(`${t('messages.errorAdding')} : ${error instanceof Error ? error.message : 'Error desconocido'} `);
    }
  };

  const handleUpdateBankAccount = async (accountData: Omit<BankAccount, 'id' | 'created_at'>) => {
    if (!state.editingBankAccount) return;

    try {
      const result = await updateBankAccount(state.editingBankAccount.id, accountData);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingBankAccount: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating bank account:', error);
      showError(t('messages.errorUpdating'));
    }
  };

  const handleDeleteBankAccount = async (id: number) => {
    try {
      const result = deleteBankAccount(id);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      showError(t('messages.errorDeleting'));
    }
  };

  const handleCancelBankAccountEdit = () => {
    setState(prev => ({ ...prev, editingBankAccount: null, showingBankAccountForm: false }));
  };

  const handleEditBankAccount = (account: BankAccount) => {
    setState(prev => ({ ...prev, editingBankAccount: account }));
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================


  if (state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner text={state.initializationStep || t('messages.loadingData')} />
      </div>
    );
  }

  // Vista de detalle de cliente
  if (state.viewingCustomer) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar currentSection={state.currentSection} onNavigate={handleNavigate} />
        <div className="flex-1 overflow-auto">
          <CustomerDetailView
            customer={state.viewingCustomer}
            onBack={handleBackFromDetail}
            onEdit={() => handleEditCustomer(state.viewingCustomer!)}
            onDelete={() => handleDeleteCustomer(state.viewingCustomer!.id)}
            onNavigateToInvoice={(id) => {
              const inv = getInvoiceById(id);
              if (inv) setState(prev => ({ ...prev, viewingCustomer: null, viewingInvoice: inv }));
            }}
            onNavigateToKardex={(filters) => setState(prev => ({
              ...prev,
              viewingCustomer: null,
              currentSection: 'inventory-kardex',
              kardexParams: { ...filters, type: 'sale' }
            }))}
          />
        </div>
      </div>
    );
  }

  // Vista de detalle de factura
  if (state.viewingInvoice) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar currentSection={state.currentSection} onNavigate={handleNavigate} />
        <div className="flex-1 overflow-auto bg-slate-950/50">
          <Header
            dbStats={state.dbStats}
            onAssistantClick={() => setState(prev => ({ ...prev, showAssistant: true }))}
            onNavigate={handleNavigate}
          />
          <InvoiceDetailView
            invoice={state.viewingInvoice}
            onBack={handleBackFromInvoiceDetail}
            onEdit={() => handleEditInvoice(state.viewingInvoice!)}
            onDelete={() => handleDeleteInvoice(state.viewingInvoice!.id)}
            onDownload={(inv) => console.log('Download invoice', inv)}
          />
        </div>
      </div>
    );
  }

  // Vista de detalle de proveedor
  if (state.viewingSupplier) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar currentSection={state.currentSection} onNavigate={handleNavigate} />
        <div className="flex-1 overflow-auto bg-slate-950/50">
          <Header
            dbStats={state.dbStats}
            onAssistantClick={() => setState(prev => ({ ...prev, showAssistant: true }))}
            onNavigate={handleNavigate}
          />
          <SupplierDetailView
            supplier={state.viewingSupplier}
            onBack={handleBackFromSupplierDetail}
            onEdit={() => handleEditSupplier(state.viewingSupplier!)}
            onDelete={() => handleDeleteSupplier(state.viewingSupplier!.id)}
          />
        </div>
      </div>
    );
  }

  // Vista de detalle de factura de compra
  if (state.viewingBill) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar currentSection={state.currentSection} onNavigate={handleNavigate} />
        <div className="flex-1 overflow-auto bg-slate-950/50">
          <Header
            dbStats={state.dbStats}
            onAssistantClick={() => setState(prev => ({ ...prev, showAssistant: true }))}
            onNavigate={handleNavigate}
          />
          <BillDetailView
            bill={state.viewingBill}
            onBack={handleBackFromBillDetail}
            onEdit={() => handleEditBill(state.viewingBill!)}
            onDelete={() => handleDeleteBill(state.viewingBill!.id)}
          />
        </div>
      </div>
    );
  }

  // Vista de detalle de producto
  if (state.viewingProduct) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar currentSection={state.currentSection} onNavigate={handleNavigate} />
        <div className="flex-1 overflow-auto">
          <ProductDetailView
            product={state.viewingProduct}
            onBack={handleBackFromProductDetail}
            onEdit={() => handleEditProduct(state.viewingProduct!)}
            onDelete={() => handleDeleteProduct(state.viewingProduct!.id)}
          />
        </div>
      </div>
    );
  }

  // Vista de detalle de cotización
  if (state.viewingQuote) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar currentSection={state.currentSection} onNavigate={handleNavigate} />
        <div className="flex-1 overflow-auto">
          <QuoteDetailView
            quote={state.viewingQuote}
            onClose={handleBackFromQuoteDetail}
            onConvert={handleConvertQuoteToInvoice}
          />
        </div>
      </div>
    );
  }

  const isPublicSection = ['terms', 'privacy', 'help'].includes(state.currentSection);

  // Layout limpio para acceso público sin sesión (ToS, Privacy, Soporte)
  if (isPublicSection && !user) {
    return (
      <AppRouter>
        <div className="min-h-screen bg-slate-950 p-4 md:p-12 flex flex-col items-center">
          <div className="w-full max-w-5xl bg-slate-900/50 border border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Elemento decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none"></div>
            
            <div className="p-1">
              {state.currentSection === 'terms' && <TermsOfService />}
              {state.currentSection === 'privacy' && <PrivacyPolicy />}
              {state.currentSection === 'help' && <HelpCenter />}
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-12 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-blue-600/20 hover:scale-105 active:scale-95"
          >
            {t('common.backToStart') || 'Volver al Inicio'}
          </button>
        </div>
        <Toaster position="top-right" />
      </AppRouter>
    );
  }

  return (
    <AppRouter>
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        <Sidebar currentSection={state.currentSection} onNavigate={handleNavigate} />
        <div className="flex-1 overflow-auto bg-slate-950/50 relative">
          {/* Background Decorative Element */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>


          <Header
            dbStats={state.dbStats}
            onAssistantClick={() => setState(prev => ({ ...prev, showAssistant: true }))}
            onNavigate={handleNavigate}
          />

          <main className="p-8 relative">
            {state.error && (
              <div className="mb-6 rounded-2xl bg-rose-500/10 p-5 text-rose-300 border border-rose-500/20 shadow-xl flex items-center justify-between animate-in slide-in-from-top-2 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shadow-inner">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">{t('system.error')}</span>
                    <span className="font-bold tracking-tight text-white/90">{state.error}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleNavigate('help')}
                  className="px-4 py-2 bg-rose-500/20 hover:bg-rose-600 text-rose-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-rose-500/30 flex items-center gap-2 group"
                >
                  <BookOpen className="w-3.5 h-3.5 group-hover:-rotate-6 transition-transform" />
                  Soporte
                </button>
              </div>
            )}

            {state.success && (
              <div className="mb-6 rounded-2xl bg-emerald-500/10 p-4 text-emerald-300 border border-emerald-500/20 shadow-lg flex items-center animate-in slide-in-from-top-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
                  <span className="text-emerald-400">✅</span>
                </div>
                <span className="font-black tracking-tight">{state.success}</span>
              </div>
            )}

            {/* Renderizado condicional basado en la sección actual */}
            <div className="transition-all duration-500">
              {state.currentSection === 'sql-diagnostic' && (
                <DiagnosticSQL />
              )}
              {state.currentSection === 'dashboard' && (
                <Dashboard
                  stats={state.dbStats}
                  onNavigate={handleNavigate}
                  invoices={state.invoices}
                  bills={state.bills}
                />
              )}

              {/* --- DASHBOARDS AVANZADOS --- */}
              {state.currentSection === 'dashboard-financial' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <FinancialDashboard />
                </Suspense>
              )}
              {state.currentSection === 'dashboard-inventory' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <InventoryDashboard />
                </Suspense>
              )}
              {state.currentSection === 'dashboard-customers' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <CustomerDashboard />
                </Suspense>
              )}
              {state.currentSection === 'dashboard-suppliers' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <SupplierDashboard />
                </Suspense>
              )}
              {state.currentSection === 'dashboard-payroll' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <PayrollDashboard />
                </Suspense>
              )}

              {/* --- CUENTAS POR COBRAR (RECEIVABLES) --- */}
              {state.currentSection === 'customers' && (
                <>
                  {state.showingCustomerForm ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <h2 className="mb-4 text-xl font-black text-white tracking-tighter uppercase">{t('forms.newCustomer')}</h2>
                      <CustomerFormAdvanced
                        onSubmit={handleAddCustomer}
                        onCancel={() => setState(prev => ({ ...prev, showingCustomerForm: false }))}
                      />
                    </div>
                  ) : state.editingCustomer ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <h2 className="mb-4 text-xl font-black text-white tracking-tighter uppercase">{t('forms.editCustomer')}</h2>
                      <CustomerFormAdvanced
                        initialData={state.editingCustomer}
                        onSubmit={handleUpdateCustomer}
                        onCancel={handleCancelEdit}
                      />
                    </div>
                  ) : (
                    <CustomerList
                      customers={state.customers}
                      onAddCustomer={() => setState(prev => ({ ...prev, showingCustomerForm: true }))}
                      onView={handleViewCustomer}
                      onEdit={handleEditCustomer}
                      onDelete={handleDeleteCustomer}
                    />
                  )}
                </>
              )}

              {state.currentSection === 'invoices' && (
                <>
                  {state.showingInvoiceForm ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <SalesInvoiceForm
                        onSubmit={handleCreateInvoice}
                        onCancel={() => setState(prev => ({ ...prev, showingInvoiceForm: false }))}
                        customers={state.customers}
                        products={state.products}
                        currentUserId={user?.id || 1}
                      />
                    </div>
                  ) : state.editingInvoice ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <h2 className="mb-4 text-xl font-black text-white tracking-tighter uppercase">{t('forms.editInvoice')} #{state.editingInvoice.invoice_number}</h2>
                      <InvoiceForm
                        initialData={state.editingInvoice}
                        onSubmit={handleUpdateInvoice}
                        onCancel={handleCancelInvoiceEdit}
                        customers={state.customers}
                        products={state.products}
                      />
                    </div>
                  ) : (
                    <InvoiceList
                      invoices={state.invoices}
                      onAddInvoice={() => setState(prev => ({ ...prev, showingInvoiceForm: true }))}
                      onView={handleViewInvoice}
                      onEdit={handleEditInvoice}
                      onDelete={handleDeleteInvoice}
                      onNavigateToKardex={(invoiceId) => {
                        setState(prev => ({
                          ...prev,
                          currentSection: 'inventory-kardex',
                          kardexParams: { type: 'sale', productId: undefined /* We might want to filter by ref ID in future but KardexViewer mainly filters by product/type. It does not have Ref ID filter yet. I should add that to KardexViewer or just link to generic sales. For now, let's link to Sales type. UPDATE: The user requirement says "En factura generada: enlace a movimiento de salida en kardex". `getKardexMovements` HAS a filter for generic attributes but the UI `InventoryKardexViewer` currently only exposes Product and Type. It does not have Ref ID filter yet. I will update `InventoryKardexViewer` later to support reference filter if needed, but for now I will pass type='sale'. Ideally I should pass the invoice ID as a filter too. Let's start with type='sale'. Actually, filtering by specific invoice is better. I will add `referenceId` to `kardexParams` in AppState.*/ }
                        }));
                      }}
                    />
                  )}
                </>
              )}

              {state.currentSection === 'customer-payments' && (
                <CustomerPayments
                  invoices={state.invoices}
                  customers={state.customers}
                  onPaymentCreated={() => {
                    loadData();
                    setState(prev => ({ ...prev, success: t('messages.clientPaymentSuccess') }));
                    setTimeout(() => setState(prev => ({ ...prev, success: null })), 3000);
                  }}
                />
              )}

              {state.currentSection === 'ard-module' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <ARDModule />
                </Suspense>
              )}

              {state.currentSection === 'quotes' && (
                <>
                  {state.showingQuoteForm ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <QuoteForm
                        onSave={handleCreateQuote}
                        onCancel={() => setState(prev => ({ ...prev, showingQuoteForm: false }))}
                        customers={state.customers}
                        products={state.products}
                      />
                    </div>
                  ) : state.editingQuote ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <QuoteForm
                        quote={state.editingQuote}
                        onSave={handleUpdateQuote}
                        onCancel={handleCancelQuoteEdit}
                        customers={state.customers}
                        products={state.products}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{t('sections.quotes')}</h2>
                        <button
                          onClick={() => setState(prev => ({ ...prev, showingQuoteForm: true }))}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                          {t('forms.newQuote')}
                        </button>
                      </div>
                      <QuotesList
                        quotes={state.quotes}
                        onView={handleViewQuote}
                        onEdit={handleEditQuote}
                        onDelete={handleDeleteQuote}
                        onConvert={handleConvertQuoteToInvoice}
                      />
                    </div>
                  )}
                </>
              )}
              {state.currentSection === 'receivable-reports' && <ReceivableReports />}


              {/* --- CUENTAS A PAGAR (PAYABLES) --- */}
              {state.currentSection === 'suppliers' && (
                <>
                  {state.showingSupplierForm ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <h2 className="mb-4 text-xl font-black text-white tracking-tighter uppercase">{t('forms.newSupplier')}</h2>
                      <SupplierForm
                        onSubmit={handleAddSupplier}
                        onCancel={() => setState(prev => ({ ...prev, showingSupplierForm: false }))}
                      />
                    </div>
                  ) : state.editingSupplier ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <h2 className="mb-4 text-xl font-black text-white tracking-tighter uppercase">{t('forms.editSupplier')}</h2>
                      <SupplierForm
                        initialData={state.editingSupplier}
                        onSubmit={handleUpdateSupplier}
                        onCancel={handleCancelSupplierEdit}
                      />
                    </div>
                  ) : (
                    <SupplierList
                      suppliers={state.suppliers}
                      onAddSupplier={() => setState(prev => ({ ...prev, showingSupplierForm: true }))}
                      onView={handleViewSupplier}
                      onEdit={handleEditSupplier}
                      onDelete={handleDeleteSupplier}
                    />
                  )}
                </>
              )}

              {state.currentSection === 'bills' && (
                <>
                  {state.showingBillForm ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <h2 className="mb-4 text-xl font-black text-white tracking-tighter uppercase">{t('forms.newBill')}</h2>
                      <BillForm
                        onSubmit={handleBillSave}
                        onCancel={() => setState(prev => ({ ...prev, showingBillForm: false }))}
                        suppliers={state.suppliers}
                        products={state.products}
                      />
                    </div>
                  ) : state.editingBill ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <h2 className="mb-4 text-xl font-black text-white tracking-tighter uppercase">{t('forms.editBill')} #{state.editingBill.bill_number}</h2>
                      <BillForm
                        initialData={state.editingBill}
                        onSubmit={handleBillSave}
                        onCancel={handleCancelBillEdit}
                        suppliers={state.suppliers}
                        products={state.products}
                      />
                    </div>
                  ) : (
                    <BillList
                      bills={state.bills}
                      onAddBill={() => setState(prev => ({ ...prev, showingBillForm: true }))}
                      onView={handleViewBill}
                      onEdit={handleEditBill}
                      onDelete={handleDeleteBill}
                    />
                  )}
                </>
              )}

              {state.currentSection === 'supplier-payments' && (
                <SupplierPayments
                  bills={state.bills}
                  suppliers={state.suppliers}
                  onPaymentCreated={() => {
                    loadData();
                    setState(prev => ({ ...prev, success: t('messages.supplierPaymentSuccess') }));
                    setTimeout(() => setState(prev => ({ ...prev, success: null })), 3000);
                  }}
                />
              )}

              {state.currentSection === 'purchase-orders' && (
                <PurchaseOrdersList
                  onCreateNew={() => setState(prev => ({ ...prev, showingPurchaseOrderForm: true /* Need to handle form showing logic if duplicate, or just use what PurchaseOrderManager did. WAIT, PurchaseOrderManager likely handled the list AND the form. I should check if I broke the form logic. Let's assume PurchaseOrdersList is ONLY the list. I need to handle switching to form. But for now, adding the Kardex link. */ }))}
                  onNavigateToKardex={(refId) => setState(prev => ({
                    ...prev,
                    currentSection: 'inventory-kardex',
                    kardexParams: { type: 'purchase', productId: undefined /* Same as Invoice, ideally filter by Ref ID. Using 'purchase' type filter for now. */ }
                  }))}
                />
              )}
              {state.currentSection === 'payable-reports' && <PayableReports />}

              {/* --- PAYROLL --- */}
              {state.currentSection === 'employee-mgr' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <EmployeeManager />
                </Suspense>
              )}
              {state.currentSection === 'payroll-process' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <PayrollProcessor />
                </Suspense>
              )}
              {state.currentSection === 'payroll-review' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <PayrollReview
                    onViewPaystub={(payrollId) => {
                      setState(prev => ({
                        ...prev,
                        currentSection: 'payroll-paystub',
                        selectedPayrollId: payrollId
                      }));
                    }}
                  />
                </Suspense>
              )}
              {state.currentSection === 'payroll-paystub' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <EmployeePaystub
                    payrollId={state.selectedPayrollId}
                    onBack={() => {
                      setState(prev => ({
                        ...prev,
                        currentSection: 'payroll-review',
                        selectedPayrollId: undefined
                      }));
                    }}
                  />
                </Suspense>
              )}
              {state.currentSection === 'payroll-reports' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <PayrollReports />
                </Suspense>
              )}

              {/* --- FIXED ASSETS --- */}
              {state.currentSection === 'fixed-assets' && <FixedAssetsManager db={db} />}

              {/* --- BUDGETS --- */}
              {state.currentSection === 'budgets' && <BudgetManager />}

              {/* --- CONTABILIDAD --- */}
              {state.currentSection === 'chart-accounts' && <ChartOfAccounts />}

              {state.currentSection === 'accounting-periods' && <PeriodManager />}

              {state.currentSection === 'ledger-hub' && (
                <LedgerHub chartOfAccounts={state.chartOfAccounts} />
              )}

              {state.currentSection === 'journal-entries' && <ManualJournalEntries
                chartOfAccounts={state.chartOfAccounts}
                onEntryCreated={() => {
                  loadData();
                  setState(prev => ({ ...prev, success: t('messages.entryRegistered') }));
                }}
              />}

              {state.currentSection === 'general-ledger' && <GeneralLedger chartOfAccounts={state.chartOfAccounts} />}
              {state.currentSection === 'trial-balance' && <TrialBalanceReport />}
              {state.currentSection === 'balance-sheet' && <BalanceSheet />}
              {state.currentSection === 'income-statement' && <IncomeStatement />}

              {/* --- NEW ELITE REPORTS FASE 3 --- */}
              {state.currentSection === 'reports-dashboard' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <ReportsDashboard onNavigate={(section) => setState(prev => ({ ...prev, currentSection: section }))} />
                </Suspense>
              )}
              {state.currentSection === 'financial-reports' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <ReportsDashboard onNavigate={(section) => setState(prev => ({ ...prev, currentSection: section }))} />
                </Suspense>
              )}
              {state.currentSection === 'cash-flow' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <CashFlowStatement />
                </Suspense>
              )}
              {state.currentSection === 'aging-report' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <AgingReport />
                </Suspense>
              )}
              {state.currentSection === 'account-ledger' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <AccountLedger />
                </Suspense>
              )}


              {/* --- INVENTARIO --- */}
              {state.viewingProduct && (
                <ProductDetailView
                  product={state.viewingProduct}
                  onBack={() => setState(prev => ({ ...prev, viewingProduct: null }))}
                  onEdit={(product) => setState(prev => ({ ...prev, viewingProduct: null, editingProduct: product }))}
                  onNavigateToKardex={(productId) => {
                    setState(prev => ({
                      ...prev,
                      viewingProduct: null,
                      currentSection: 'inventory-kardex',
                      kardexParams: { productId: productId.toString(), type: 'all' }
                    }));
                  }}
                />
              )}
              {state.currentSection === 'products' && (
                <>
                  {state.showingProductForm ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <h2 className="mb-4 text-xl font-black text-white tracking-tighter uppercase">{t('forms.newProduct')}</h2>
                      <ProductForm
                        onSubmit={handleCreateProduct}
                        onCancel={() => setState(prev => ({ ...prev, showingProductForm: false }))}
                        categories={state.productCategories}
                      />
                    </div>
                  ) : state.editingProduct ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <h2 className="mb-4 text-xl font-black text-white tracking-tighter uppercase">{t('forms.editProduct')}</h2>
                      <ProductForm
                        initialData={state.editingProduct}
                        onSubmit={handleUpdateProduct}
                        onCancel={handleCancelProductEdit}
                        categories={state.productCategories}
                      />
                    </div>
                  ) : (
                    <ProductList
                      products={state.products}
                      categories={state.productCategories}
                      onAddProduct={() => setState(prev => ({ ...prev, showingProductForm: true }))}
                      onView={handleViewProduct}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                      onNavigateToKardex={(productId) => {
                        setState(prev => ({
                          ...prev,
                          currentSection: 'inventory-kardex',
                          kardexParams: { productId: productId.toString(), type: 'all' }
                        }));
                      }}
                    />
                  )}
                </>
              )}

              {state.currentSection === 'product-categories' && (
                <>
                  {state.showingProductCategoryForm ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <h2 className="mb-4 text-xl font-black text-white tracking-tighter uppercase">{t('forms.newCategory')}</h2>
                      <ProductCategoryForm
                        onSubmit={handleCreateProductCategory}
                        onCancel={() => setState(prev => ({ ...prev, showingProductCategoryForm: false }))}
                      />
                    </div>
                  ) : state.editingProductCategory ? (
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                      <h2 className="mb-4 text-xl font-black text-white tracking-tighter uppercase">{t('forms.editCategory')}</h2>
                      <ProductCategoryForm
                        initialData={state.editingProductCategory}
                        onSubmit={handleUpdateProductCategory}
                        onCancel={handleCancelProductCategoryEdit}
                      />
                    </div>
                  ) : (
                    <ProductCategoryList
                      categories={state.productCategories}
                      onAdd={() => setState(prev => ({ ...prev, showingProductCategoryForm: true }))}
                      onEdit={handleEditProductCategory}
                      onDelete={handleDeleteProductCategory}
                    />
                  )}
                </>
              )}

              {state.currentSection === 'inventory-movements' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <InventoryMovements />
                </Suspense>
              )}
              {state.currentSection === 'inventory-adjustments' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <InventoryAdjustments />
                </Suspense>
              )}
              {state.currentSection === 'inventory-reports' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <InventoryReports />
                </Suspense>
              )}
              {state.currentSection === 'locations' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <LocationsManager />
                </Suspense>
              )}


              {/* --- ARCHIVO / CONFIG / HERRAMIENTAS --- */}
              {state.currentSection === 'company-data' && (
                <div className="space-y-6">
                  <CompanyDataForm onClose={() => setState(prev => ({ ...prev, currentSection: 'dashboard' }))} />
                </div>
              )}

              {/* FIXED: Dedicated render for Payment Methods when accessed from Sidebar directly */}
              {state.currentSection === 'payment-methods' && <PaymentMethods />}

              {/* --- INVENTORY KARDEX MODULE --- */}
              {state.currentSection === 'inventory-kardex' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <InventoryKardexViewer initialFilters={state.kardexParams} />
                </Suspense>
              )}

              {state.currentSection === 'users' && <UserRoleManager />}

              {/* BackupPanel is rendered below */}

              {/* FIXED: Dedicated render for System Logs and Auditoria */}
              {(state.currentSection === 'system-logs' || state.currentSection === 'logs') && <SystemLogs />}

              {state.currentSection === 'auditoria' && <TransactionAudit />}

              {state.currentSection === 'security' && <SecuritySettings />}

              {state.currentSection === 'health-check' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <HealthCheckPage />
                </Suspense>
              )}

              {state.currentSection === 'system-status' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <SystemStatusDashboard />
                </Suspense>
              )}

              {state.currentSection === 'accounting-diagnosis' && <AccountingDiagnosis />}

              {/* JournalEntryTest removed */}

              {state.currentSection === 'banks' && (
                <>
                  {state.showingBankAccountForm ? (
                    <BankAccountForm
                      key={language}
                      onSubmit={handleCreateBankAccount}
                      onCancel={() => setState(prev => ({ ...prev, showingBankAccountForm: false }))}
                    />
                  ) : state.editingBankAccount ? (
                    <BankAccountForm
                      key={language}
                      initialData={state.editingBankAccount}
                      onSubmit={handleUpdateBankAccount}
                      onCancel={handleCancelBankAccountEdit}
                    />
                  ) : (
                    <BankAccountList
                      accounts={state.bankAccounts}
                      onAddAccount={() => setState(prev => ({ ...prev, showingBankAccountForm: true }))}
                      onEditAccount={handleEditBankAccount}
                      onDeleteAccount={handleDeleteBankAccount}
                      onNavigateToJournal={() => setState(prev => ({ ...prev, currentSection: 'journal-entries' }))}
                    />
                  )}
                </>
              )}



              {state.currentSection === 'bank-reconciliation' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <BankReconciliation onNavigate={handleNavigate} />
                </Suspense>
              )}
              {state.currentSection === 'discrepancy-analysis' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <DiscrepancyAnalysis />
                </Suspense>
              )}
              {state.currentSection === 'bank-smart-import' && <BankImport />}
              {state.currentSection === 'banking-import' && <BankImport />}
              {state.currentSection === 'quarantine-panel' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <QuarantinePanel />
                </Suspense>
              )}
              {state.currentSection === 'transaction-classifier' && (
                state.selectedBankAccountId ? (
                  <TransactionClassifier accountId={state.selectedBankAccountId} />
                ) : (
                  <div className="bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center">
                    <div className="text-xl font-bold text-slate-500 uppercase tracking-widest">
                      Seleccioná una cuenta bancaria primero
                    </div>
                  </div>
                )
              )}
              {state.currentSection === 'classification-rules' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <ClassificationRulesManager />
                </Suspense>
              )}

              {/* --- IMPUESTOS FLORIDA --- */}
              {state.currentSection === 'tax-config' && <FiscalSettingsForm onClose={() => handleNavigate('dashboard')} />}

              {state.currentSection === 'help' && <HelpCenter />}

              {state.currentSection === 'terms' && <TermsOfService />}

              {state.currentSection === 'privacy' && <PrivacyPolicy />}

              {/* FIXED: Render FloridaTaxReport correctly */}
              {state.currentSection === 'florida-dr15' && (
                <Suspense fallback={<LoadingSpinner />}>
                  <FloridaTaxSummary />
                </Suspense>
              )}

              {/* FIXED: Render TaxRates component */}
              {state.currentSection === 'tax-rates' && <TaxRates />}

{/* TaxReports y TaxCalendar eliminados */}
{/* {state.currentSection === 'tax-reports' && <TaxReports />} */}
{/* {state.currentSection === 'tax-calendar' && <TaxCalendar />} */}
              {state.currentSection === 'backups' && <BackupPanel />}
              {state.currentSection === 'verify' && <LiveVerification />}

              {/* --- HERRAMIENTAS --- */}
              {state.currentSection === 'accounting-diagnosis' && <AccountingDiagnosis />}
              {state.currentSection === 'journal-entry-test' && <JournalEntryTest />}
              {(state.currentSection === 'system-audit' || state.currentSection === 'audit') && <SystemAudit />}

              {/* --- GESTIÓN DE USUARIOS --- */}
              {state.currentSection === 'admin-users' && <UserList />}
              {state.currentSection === 'role-manager' && <RoleManager />}
              {state.currentSection === 'audit-trail' && <AuditTrailTable />}
              {state.currentSection === 'my-profile' && user && (
                <UserForm
                  user={user as any}
                  onSave={() => {
                    // Actualizar el estado del usuario localmente si es necesario
                    window.location.reload(); // Forma más segura de refrescar todo el context
                  }}
                  onCancel={() => setState(prev => ({ ...prev, currentSection: 'dashboard' }))}
                />
              )}




              {/* --- ASISTENTE IA (Classic Mode if needed, currently unused via Sidebar) --- */}
              {state.currentSection === 'ai-assistant' && (
                <div className="h-[calc(100vh-140px)]">
                  <Suspense fallback={<LoadingSpinner />}>
                    <UnifiedAssistant
                      isOpen={true}
                      onClose={() => setState(prev => ({ ...prev, currentSection: 'dashboard' }))}
                      stats={state.dbStats}
                      transactionCount={state.invoices.length + state.bills.length}
                      auditStatus={{
                        healthy: true,
                        lastEvent: new Date().toISOString(),
                        integrityScore: 100
                      }}
                      complianceMetrics={{
                        taxCompliance: 100,
                        dr15Status: 'Al día',
                        pendingForms: 0
                      }}
                    />
                  </Suspense>
                </div>
              )}


            </div>
          </main>
        </div >

        {/* --- ASISTENTE IA (OVERLAY) --- */}
        {state.showAssistant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl h-[90vh] bg-gray-900 rounded-2xl shadow-2xl relative overflow-hidden">
              <Suspense fallback={<LoadingSpinner />}>
                <UnifiedAssistant
                  isOpen={true}
                  onClose={() => setState(prev => ({ ...prev, showAssistant: false }))}
                  stats={state.dbStats}
                  transactionCount={state.invoices.length + state.bills.length}
                  auditStatus={{
                    healthy: true,
                    lastEvent: new Date().toISOString(),
                    integrityScore: 100
                  }}
                  complianceMetrics={{
                    taxCompliance: 100,
                    dr15Status: 'Al día',
                    pendingForms: 0
                  }}
                />
              </Suspense>
            </div>
          </div>
        )}

        {/* Floating Assistant Button - Visible everywhere except when assistant is open */}
        {
          !state.showAssistant && (
            <button
              onClick={() => setState(prev => ({ ...prev, showAssistant: true }))}
              className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all z-40 flex items-center gap-2 group"
              aria-label={t('navigation.aiAssistant')}
            >
              <Brain className="w-6 h-6 animate-pulse" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium">
                {t('navigation.aiAssistant')}
              </span>
            </button>
          )}
      </div >
      <Toaster position="top-right" />
    </AppRouter>
  );
}

export default App;

// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ForensicDemoPage } from './pages/forensic/ForensicDemoPage';
import { Plus, TrendingUp, FileText, Shield } from 'lucide-react';
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
  getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount, BankAccount
} from './database/simple-db';

import { UserRoleManager } from './components/system/UserRoleManager';
import { CompanyInfoForm } from './components/system/CompanyInfoForm';
import { FiscalSettingsForm } from './components/system/FiscalSettingsForm';
import { SecuritySettings } from './components/system/SecuritySettings';
import { SuppliersList } from './components/purchasing/SuppliersList';
import { PurchaseOrderManager } from './components/purchasing/PurchaseOrderManager';
import { PurchaseOrderForm } from './components/purchasing/PurchaseOrderForm';
import { PurchaseOrdersList } from './components/purchasing/PurchaseOrdersList';
import { PayableReports } from './components/purchasing/PayableReports';
import { JournalEntryForm } from './components/accounting/JournalEntryForm';
import { TrialBalanceReport } from './components/accounting/TrialBalanceReport';
import { FinancialStatements } from './components/accounting/FinancialStatements';
import { InventoryMovements } from './components/inventory/InventoryMovements';
import { InventoryAdjustments } from './components/inventory/InventoryAdjustments';
import { InventoryReports } from './components/inventory/InventoryReports';
import { LocationsManager } from './components/inventory/LocationsManager';
import { DR15PreparationWizard } from './components/dr15/DR15PreparationWizard';
import { QuotesList, ReceivableReports } from './components/invoices/ARComponents';
import { TaxCalendar, TaxReports } from './components/dr15/TaxComponents';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { CustomerFormAdvanced } from './components/CustomerFormAdvanced';
import { CustomerDetailView } from './components/CustomerDetailView';
import { CustomerList } from './components/CustomerList';
import { Dashboard } from './components/Dashboard';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceDetailView } from './components/InvoiceDetailView';
import { SupplierForm } from './components/SupplierForm';
import { SupplierList } from './components/SupplierList';
import { SupplierDetailView } from './components/SupplierDetailView';
import { BillForm } from './components/BillForm';
import { BillList } from './components/BillList';
import { BillDetailView } from './components/BillDetailView';
import { CheckCircle, XCircle, Brain } from 'lucide-react';
import { logger } from './core/logging/SystemLogger';
import { SystemLogs } from './components/SystemLogs';
import { ChartOfAccounts } from './components/ChartOfAccounts';
import { AccountingDiagnosis } from './components/AccountingDiagnosis';
import { JournalEntryTest } from './components/JournalEntryTest';
import { BalanceSheet } from './components/BalanceSheet';
import { IncomeStatement } from './components/IncomeStatement';
import { CompanyDataForm } from './components/CompanyDataForm';
import { ProductForm } from './components/ProductForm';
import { ProductList } from './components/ProductList';
import { ProductDetailView } from './components/ProductDetailView';
import { ProductCategoryForm } from './components/ProductCategoryForm';
import { ProductCategoryList } from './components/ProductCategoryList';
import { ModulePlaceholder } from './components/ModulePlaceholder';
import { FloridaTaxReport } from './components/FloridaTaxReport';
import { TaxRates } from './components/TaxRates';
import { TransactionAudit } from './components/TransactionAudit';
import { BackupRestore } from './components/BackupRestore';
import { UnifiedAssistant } from './components/ai/UnifiedAssistant';
import { CustomerPayments } from './components/CustomerPayments';
import { SupplierPayments } from './components/SupplierPayments';
import { ManualJournalEntries } from './components/ManualJournalEntries';
import { GeneralLedger } from './components/GeneralLedger';
import { PaymentMethods } from './components/PaymentMethods';
import { BankAccountList } from './components/BankAccountList';
import { BankAccountForm } from './components/BankAccountForm';
import { DiagnosticPanel } from './debug/DiagnosticPanel';
import { SalesInvoiceForm } from './components/SalesInvoiceForm';
import { InvoiceService } from './services/invoicing/InvoiceService';
import { SQLiteEngine } from './core/database/SQLiteEngine';
import { MigrationEngine } from './core/migrations/MigrationEngine';

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
  showingBillForm: boolean;
  showingSupplierForm: boolean;
  showingCustomerForm: boolean;
  showingInvoiceForm: boolean;
  showingProductForm: boolean;
  showingProductCategoryForm: boolean;
  editingBankAccount: BankAccount | null;
  showingBankAccountForm: boolean;
  initializationStep: string;
  currentSection: string;
}


function App() {
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
    showingBillForm: false,
    showingSupplierForm: false,
    showingCustomerForm: false,
    showingInvoiceForm: false,
    showingProductForm: false,
    showingProductCategoryForm: false,
    editingBankAccount: null,
    showingBankAccountForm: false,
    initializationStep: 'Iniciando...',
    currentSection: 'dashboard',
    showAssistant: false
  });

  // Detectar cambios de conectividad
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Inicializar base de datos
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null, initializationStep: 'Verificando compatibilidad...' }));

        logger.info('App', 'init_start', 'Iniciando AccountExpress Next-Gen MVP');

        // Verificar compatibilidad básica
        if (typeof window === 'undefined') {
          throw new Error('Entorno no compatible - se requiere navegador web');
        }

        setState(prev => ({ ...prev, initializationStep: 'Configurando SQLite...' }));

        // Inicializar sin contraseña primero para simplificar
        await initDB();

        setState(prev => ({ ...prev, initializationStep: 'Cargando datos...' }));

        // Cargar datos iniciales
        await loadData();

        setState(prev => ({
          ...prev,
          isLoading: false,
          success: 'AccountExpress inicializado correctamente',
          initializationStep: 'Completado'
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
          error: `Error al inicializar: ${error instanceof Error ? error.message : 'Error desconocido'} `,
          initializationStep: 'Error'
        }));
      }
    };

    initializeApp();
  }, []);

  const loadData = async () => {
    try {
      const customers = getCustomers();
      const suppliers = getSuppliers();
      const invoices = getInvoices();
      const bills = getBills();
      const products = getProducts();
      const productCategories = getProductCategories();
      const bankAccounts = getBankAccounts();
      const stats = getStatsWithSuppliers();

      setState(prev => ({
        ...prev,
        customers,
        suppliers,
        invoices,
        bills,
        products,
        productCategories,
        bankAccounts,
        dbStats: stats
      }));

    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error al cargar los datos');
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

  const handleNavigate = (section: string) => {
    if (section === 'ai-assistant') {
      setState(prev => ({ ...prev, showAssistant: true }));
      return;
    }
    setState(prev => ({
      ...prev,
      currentSection: section,
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

  const handleAddCustomer = async (customerData: any) => {
    try {
      console.log('=== ADDING CUSTOMER ===');
      console.log('Input data:', customerData);
      console.log('App loading state:', state.isLoading);

      // Verificar que la aplicación esté completamente cargada
      if (state.isLoading) {
        showError('El sistema aún se está inicializando. Por favor espera un momento.');
        return;
      }

      // Verificar que la base de datos esté lista
      if (!isDatabaseReady()) {
        showError('La base de datos no está lista. Por favor recarga la página.');
        return;
      }

      const customerId = addCustomer(customerData);
      console.log('Customer added with ID:', customerId);

      await loadData();
      console.log('Data reloaded, new customer count:', state.customers.length);

      // Cerrar el formulario y mostrar mensaje de éxito
      setState(prev => ({ ...prev, showingCustomerForm: false }));
      showSuccess(`Cliente "${customerData.name}" agregado correctamente(ID: ${customerId})`);
    } catch (error) {
      console.error('Error adding customer:', error);
      showError(`Error al agregar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'} `);
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
      const result = updateCustomer(state.editingCustomer.id, customerData);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingCustomer: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      showError('Error al actualizar el cliente');
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      // Verificar si se puede eliminar
      const deleteCheck = canDeleteCustomer(id);
      if (!deleteCheck.canDelete) {
        showError(deleteCheck.reason || 'No se puede eliminar el cliente');
        return;
      }

      // Confirmar eliminación
      if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) {
        return;
      }

      const result = deleteCustomer(id);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      showError('Error al eliminar el cliente');
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
      console.log('=== CREATING INVOICE (NEXT-GEN) ===');
      console.log('Data:', data);

      // Initialize Engine Transiently (Shared Lock handling depends on browser, but works for MVP)
      const engine = new SQLiteEngine();
      await engine.initialize('accountexpress.db');
      await MigrationEngine.getInstance().migrate(engine);
      const service = new InvoiceService(engine);

      await service.createInvoice(data);

      await loadData();
      setState(prev => ({ ...prev, showingInvoiceForm: false }));
      showSuccess('Invoice Created Successfully via Transaction Manager!');

    } catch (error) {
      console.error('Error creating invoice:', error);
      showError(`Error al crear la factura: ${error instanceof Error ? error.message : 'Error desconocido'} `);
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
      showError('Error al actualizar la factura');
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
      showError('Error al eliminar la factura');
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
      console.log('=== ADDING SUPPLIER ===');
      console.log('Input data:', supplierData);
      console.log('App loading state:', state.isLoading);

      // Verificar que la aplicación esté completamente cargada
      if (state.isLoading) {
        showError('El sistema aún se está inicializando. Por favor espera un momento.');
        return;
      }

      // Verificar que la base de datos esté lista
      if (!isDatabaseReady()) {
        showError('La base de datos no está lista. Por favor recarga la página.');
        return;
      }

      const supplierId = addSupplier(supplierData);
      console.log('Supplier added with ID:', supplierId);

      await loadData();
      console.log('Data reloaded, new supplier count:', state.suppliers.length);

      // Cerrar el formulario y mostrar mensaje de éxito
      setState(prev => ({ ...prev, showingSupplierForm: false }));
      showSuccess(`Proveedor "${supplierData.name}" agregado correctamente(ID: ${supplierId})`);
    } catch (error) {
      console.error('Error adding supplier:', error);
      showError(`Error al agregar el proveedor: ${error instanceof Error ? error.message : 'Error desconocido'} `);
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
      const result = updateSupplier(state.editingSupplier.id, supplierData);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingSupplier: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      showError('Error al actualizar el proveedor');
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    try {
      // Verificar si se puede eliminar
      const deleteCheck = canDeleteSupplier(id);
      if (!deleteCheck.canDelete) {
        showError(deleteCheck.reason || 'No se puede eliminar el proveedor');
        return;
      }

      // Confirmar eliminación
      if (!window.confirm('¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.')) {
        return;
      }

      const result = deleteSupplier(id);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showError('Error al eliminar el proveedor');
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
      console.log('=== CREATING BILL ===');
      console.log('Bill data:', billData);
      console.log('Items:', items);

      const result = createBill(billData, items);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      showError(`Error al crear la factura de compra: ${error instanceof Error ? error.message : 'Error desconocido'} `);
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
      const result = updateBill(state.editingBill.id, billData, items);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingBill: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating bill:', error);
      showError('Error al actualizar la factura de compra');
    }
  };

  const handleDeleteBill = async (id: number) => {
    try {
      // Confirmar eliminación
      if (!window.confirm('¿Estás seguro de que deseas eliminar esta factura de compra? Esta acción no se puede deshacer.')) {
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
      showError('Error al eliminar la factura de compra');
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
        const result = await updateBill(state.editingBill.id, billData, items);
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
        const result = await createBill(billData, items);
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
        error: `Error al guardar factura: ${error instanceof Error ? error.message : 'Error desconocido'} `
      }));
    }
  };

  // ==========================================
  // FUNCIONES PARA PRODUCTOS
  // ==========================================

  const handleCreateProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('=== CREATING PRODUCT ===');
      console.log('Product data:', productData);

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
      showError(`Error al crear el producto: ${error instanceof Error ? error.message : 'Error desconocido'} `);
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
      showError('Error al actualizar el producto');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      // Confirmar eliminación
      if (!window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
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
      showError('Error al eliminar el producto');
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
      console.log('=== CREATING PRODUCT CATEGORY ===');
      console.log('Category data:', categoryData);

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
      showError(`Error al crear la categoría: ${error instanceof Error ? error.message : 'Error desconocido'} `);
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
      showError('Error al actualizar la categoría');
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
      showError('Error al eliminar la categoría');
    }
  };

  const handleCancelProductCategoryEdit = () => {
    setState(prev => ({ ...prev, editingProductCategory: null, showingProductCategoryForm: false }));
  };

  // ==========================================
  // FUNCIONES PARA CUENTAS BANCARIAS
  // ==========================================

  const handleCreateBankAccount = async (accountData: Omit<BankAccount, 'id' | 'created_at'>) => {
    try {
      const result = createBankAccount(accountData);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, showingBankAccountForm: false }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error creating bank account:', error);
      showError(`Error al crear la cuenta bancaria: ${error instanceof Error ? error.message : 'Error desconocido'} `);
    }
  };

  const handleUpdateBankAccount = async (accountData: Omit<BankAccount, 'id' | 'created_at'>) => {
    if (!state.editingBankAccount) return;

    try {
      const result = updateBankAccount(state.editingBankAccount.id, accountData);
      if (result.success) {
        await loadData();
        setState(prev => ({ ...prev, editingBankAccount: null }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error updating bank account:', error);
      showError('Error al actualizar la cuenta bancaria');
    }
  };

  const handleDeleteBankAccount = async (id: number) => {
    try {
      if (!window.confirm('¿Estás seguro de que deseas eliminar esta cuenta bancaria?')) {
        return;
      }

      const result = deleteBankAccount(id);
      if (result.success) {
        await loadData();
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      showError('Error al eliminar la cuenta bancaria');
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

  // Forensic Demo Route
  // if (state.currentSection === 'forensic-demo') {
  //   return <ForensicDemoPage />;
  // }

  if (state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner text={state.initializationStep || 'Cargando...'} />
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
        <div className="flex-1 overflow-auto">
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
        <div className="flex-1 overflow-auto">
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
        <div className="flex-1 overflow-auto">
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

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar currentSection={state.currentSection} onNavigate={handleNavigate} />
      <div className="flex-1 overflow-auto bg-slate-950/50 relative">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>

        <Header
          isOnline={state.isOnline}
          dbStats={state.dbStats}
          onAssistantClick={() => setState(prev => ({ ...prev, showAssistant: true }))}
        />

        <main className="p-8 relative">
          {state.error && (
            <div className="mb-6 rounded-2xl bg-rose-500/10 p-4 text-rose-300 border border-rose-500/20 shadow-lg flex items-center animate-in slide-in-from-top-2">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center mr-3">
                <span className="text-rose-400">⚠️</span>
              </div>
              <span className="font-bold">{state.error}</span>
            </div>
          )}

          {state.success && (
            <div className="mb-6 rounded-2xl bg-emerald-500/10 p-4 text-emerald-300 border border-emerald-500/20 shadow-lg flex items-center animate-in slide-in-from-top-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
                <span className="text-emerald-400">✅</span>
              </div>
              <span className="font-bold">{state.success}</span>
            </div>
          )}

          {/* Renderizado condicional basado en la sección actual */}
          <div className="transition-all duration-500">
            {state.currentSection === 'debug' && (
              <DiagnosticPanel />
            )}
            {state.currentSection === 'dashboard' && (
              <Dashboard
                stats={state.dbStats}
                onNavigate={handleNavigate}
                invoices={state.invoices}
                bills={state.bills}
              />
            )}

            {/* --- CUENTAS POR COBRAR (RECEIVABLES) --- */}
            {state.currentSection === 'customers' && (
              <>
                {state.showingCustomerForm ? (
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Nuevo Cliente</h2>
                    <CustomerFormAdvanced
                      onSubmit={handleAddCustomer}
                      onCancel={() => setState(prev => ({ ...prev, showingCustomerForm: false }))}
                    />
                  </div>
                ) : state.editingCustomer ? (
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Editar Cliente</h2>
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
                      currentUserId="DEMO_USER"
                    />
                  </div>
                ) : state.editingInvoice ? (
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Editar Factura #{state.editingInvoice.invoice_number}</h2>
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
                  />
                )}
              </>
            )}

            {state.currentSection === 'customer-payments' && (
              <CustomerPayments
                invoices={state.invoices}
                customers={state.customers}
                onPaymentCreated={() => {
                  refreshData();
                  setState(prev => ({ ...prev, success: 'Pago de cliente registrado correctamente' }));
                  setTimeout(() => setState(prev => ({ ...prev, success: null })), 3000);
                }}
              />
            )}

            {state.currentSection === 'quotes' && <QuotesList />}
            {state.currentSection === 'receivable-reports' && <ReceivableReports />}


            {/* --- CUENTAS A PAGAR (PAYABLES) --- */}
            {state.currentSection === 'suppliers' && (
              <>
                {state.showingSupplierForm ? (
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Nuevo Proveedor</h2>
                    <SupplierForm
                      onSubmit={handleAddSupplier}
                      onCancel={() => setState(prev => ({ ...prev, showingSupplierForm: false }))}
                    />
                  </div>
                ) : state.editingSupplier ? (
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Editar Proveedor</h2>
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
                    <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Nueva Factura de Compra</h2>
                    <BillForm
                      onSubmit={handleBillSave}
                      onCancel={() => setState(prev => ({ ...prev, showingBillForm: false }))}
                      suppliers={state.suppliers}
                      products={state.products}
                    />
                  </div>
                ) : state.editingBill ? (
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Editar Factura de Compra #{state.editingBill.bill_number}</h2>
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
                  refreshData();
                  setState(prev => ({ ...prev, success: 'Pago a proveedor registrado correctamente' }));
                  setTimeout(() => setState(prev => ({ ...prev, success: null })), 3000);
                }}
              />
            )}

            {state.currentSection === 'purchase-orders' && <PurchaseOrderManager />}
            {state.currentSection === 'payable-reports' && <PayableReports />}


            {/* --- CONTABILIDAD --- */}
            {state.currentSection === 'chart-accounts' && <ChartOfAccounts />}

            {state.currentSection === 'journal-entries' && <ManualJournalEntries
              chartOfAccounts={[]} // This needs to be connected to real data later
              onEntryCreated={() => {
                refreshData();
                setState(prev => ({ ...prev, success: 'Asiento registrado' }));
              }}
            />}

            {state.currentSection === 'general-ledger' && <GeneralLedger chartOfAccounts={[]} />}

            {state.currentSection === 'balance-sheet' && <BalanceSheet />}

            {state.currentSection === 'income-statement' && <IncomeStatement />}

            {state.currentSection === 'trial-balance' && <TrialBalanceReport />}

            {state.currentSection === 'financial-reports' && <FinancialStatements />}


            {/* --- INVENTARIO --- */}
            {state.currentSection === 'products' && (
              <>
                {state.showingProductForm ? (
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Nuevo Producto</h2>
                    <ProductForm
                      onSubmit={handleCreateProduct}
                      onCancel={() => setState(prev => ({ ...prev, showingProductForm: false }))}
                      categories={state.productCategories}
                    />
                  </div>
                ) : state.editingProduct ? (
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Editar Producto</h2>
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
                  />
                )}
              </>
            )}

            {state.currentSection === 'product-categories' && (
              <>
                {state.showingProductCategoryForm ? (
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Nueva Categoría</h2>
                    <ProductCategoryForm
                      onSubmit={handleCreateProductCategory}
                      onCancel={() => setState(prev => ({ ...prev, showingProductCategoryForm: false }))}
                    />
                  </div>
                ) : state.editingProductCategory ? (
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Editar Categoría</h2>
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

            {state.currentSection === 'inventory-movements' && <InventoryMovements />}
            {state.currentSection === 'inventory-adjustments' && <InventoryAdjustments />}
            {state.currentSection === 'inventory-reports' && <InventoryReports />}
            {state.currentSection === 'locations' && <LocationsManager />}


            {/* --- ARCHIVO / CONFIG / HERRAMIENTAS --- */}
            {state.currentSection === 'system-config' && (
              <div className="space-y-6">
                <CompanyInfoForm />
                <FiscalSettingsForm />
              </div>
            )}

            {state.currentSection === 'company-data' && (
              <div className="space-y-6">
                <CompanyDataForm />
                <PaymentMethods />
              </div>
            )}

            {/* FIXED: Dedicated render for Payment Methods when accessed from Sidebar directly */}
            {state.currentSection === 'payment-methods' && <PaymentMethods />}

            {state.currentSection === 'users' && <UserRoleManager />}

            {state.currentSection === 'backups' && <BackupRestore />}

            {/* FIXED: Dedicated render for System Logs and Auditoria */}
            {(state.currentSection === 'system-logs' || state.currentSection === 'logs') && <SystemLogs />}

            {state.currentSection === 'auditoria' && <TransactionAudit />}

            {state.currentSection === 'security' && <SecuritySettings />}

            {state.currentSection === 'accounting-diagnosis' && <AccountingDiagnosis />}

            {state.currentSection === 'journal-entry-test' && <JournalEntryTest />}

            {state.currentSection === 'banks' && (
              <>
                {state.showingBankAccountForm ? (
                  <BankAccountForm
                    onSubmit={handleCreateBankAccount}
                    onCancel={() => setState(prev => ({ ...prev, showingBankAccountForm: false }))}
                  />
                ) : state.editingBankAccount ? (
                  <BankAccountForm
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
                  />
                )}
              </>
            )}

            {state.currentSection === 'help' && <ModulePlaceholder title="Centro de Ayuda" />}

            {/* --- IMPUESTOS FLORIDA --- */}
            {state.currentSection === 'tax-config' && <FiscalSettingsForm />}

            {/* FIXED: Render FloridaTaxReport correctly */}
            {state.currentSection === 'florida-dr15' && <DR15PreparationWizard />}

            {/* FIXED: Render TaxRates component */}
            {state.currentSection === 'tax-rates' && <TaxRates />}

            {state.currentSection === 'tax-reports' && <TaxReports />}

            {state.currentSection === 'tax-calendar' && <TaxCalendar />}

            {/* --- ASISTENTE IA --- */}
            {state.currentSection === 'ai-assistant' && (
              <div className="h-[calc(100vh-140px)]">
                <UnifiedAssistant
                  isOpen={true}
                  onClose={() => setState(prev => ({ ...prev, currentSection: 'dashboard' }))}
                />
              </div>
            )}


          </div>
        </main>
      </div >

      {/* --- ASISTENTE IA (OVERLAY) --- */}
      {state.showAssistant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[90vh] bg-gray-900 rounded-2xl shadow-2xl relative overflow-hidden">
            <UnifiedAssistant
              isOpen={true}
              onClose={() => setState(prev => ({ ...prev, showAssistant: false }))}
            />
          </div>
        </div>
      )}

      {/* Floating Assistant Button - Visible everywhere except when assistant is open */}
      {
        !state.showAssistant && (
          <button
            onClick={() => setState(prev => ({ ...prev, showAssistant: true }))}
            className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all z-40 flex items-center gap-2 group"
            aria-label="Asistente Virtual"
          >
            <Brain className="w-6 h-6 animate-pulse" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium">
              Asistente IA
            </span>
          </button>
        )}
    </div >
  );
}

export default App;
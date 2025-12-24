import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
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
  getProductCategories, createProductCategory, updateProductCategory, deleteProductCategory
} from './database/simple-db';
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
import { IAPanel } from './components/IAPanel';
import { FloridaTaxReport } from './components/FloridaTaxReport';

interface AppState {
  isLoading: boolean;
  isOnline: boolean;
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  bills: Bill[];
  products: Product[];
  productCategories: ProductCategory[];
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
  showingIAPanel: boolean;
  initializationStep: string;
  currentSection: string;
}

function App() {
  const [state, setState] = useState<AppState>({
    isLoading: true,
    isOnline: navigator.onLine,
    customers: [],
    suppliers: [],
    invoices: [],
    bills: [],
    products: [],
    productCategories: [],
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
    showingIAPanel: false,
    initializationStep: 'Iniciando...',
    currentSection: 'dashboard'
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
        logger.critical('App', 'init_failed', `Error crítico en inicialización: ${error instanceof Error ? error.message : 'Error desconocido'}`, null, error as Error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: `Error al inicializar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
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
      const stats = getStatsWithSuppliers();
      
      setState(prev => ({
        ...prev,
        customers,
        suppliers,
        invoices,
        bills,
        products,
        productCategories,
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
      showSuccess(`Cliente "${customerData.name}" agregado correctamente (ID: ${customerId})`);
    } catch (error) {
      console.error('Error adding customer:', error);
      showError(`Error al agregar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

  const handleCreateInvoice = async (invoiceData: Partial<Invoice>, items: Partial<InvoiceItem>[]) => {
    try {
      console.log('=== CREATING INVOICE ===');
      console.log('Invoice data:', invoiceData);
      console.log('Items:', items);
      
      const result = createInvoice(invoiceData, items);
      if (result.success) {
        await loadData();
        // Cerrar el formulario y mostrar mensaje de éxito
        setState(prev => ({ ...prev, showingInvoiceForm: false }));
        showSuccess(result.message);
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      showError(`Error al crear la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
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
      showSuccess(`Proveedor "${supplierData.name}" agregado correctamente (ID: ${supplierId})`);
    } catch (error) {
      console.error('Error adding supplier:', error);
      showError(`Error al agregar el proveedor: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      showError(`Error al crear la factura de compra: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
        error: `Error al guardar factura: ${error instanceof Error ? error.message : 'Error desconocido'}` 
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
      showError(`Error al crear el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      showError(`Error al crear la categoría: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

  // Pantalla de carga
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
            <LoadingSpinner size="lg" text={`${state.initializationStep}`} />
            <div className="mt-4 space-y-2 text-sm text-gray-400">
              <p>• Configurando SQLite local</p>
              <p>• Verificando esquema de base de datos</p>
              <p>• Cargando datos iniciales</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (state.error && !state.success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-900/20 border border-red-700 p-8 rounded-lg">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-300 mb-2">Error de Inicialización</h2>
            <p className="text-red-200 mb-4">{state.error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentSection = () => {
    switch (state.currentSection) {
      // Secciones de Archivo
      case 'dashboard':
        return <Dashboard stats={state.dbStats} onNavigate={handleNavigate} />;
      
      case 'auditoria':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Auditoría del Sistema</h2>
            <p className="text-gray-400 mb-6">Registro de actividades y cambios en el sistema</p>
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
              <p className="text-green-300 text-sm">✅ Sistema de auditoría activo</p>
              <p className="text-green-200 text-xs mt-1">Todas las operaciones se registran automáticamente</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'system-logs':
        return <SystemLogs />;

      case 'chart-accounts':
        return <ChartOfAccounts />;

      case 'accounting-diagnosis':
        return <AccountingDiagnosis />;

      case 'journal-entry-test':
        return <JournalEntryTest />;

      case 'balance-sheet':
        return <BalanceSheet />;

      case 'income-statement':
        return <IncomeStatement />;

      // Secciones de Archivo
      case 'system-config':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Configuración del Sistema</h2>
            <p className="text-gray-400 mb-6">Parámetros generales de funcionamiento</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'company-data':
        return <CompanyDataForm />;

      case 'users':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Usuarios y Roles</h2>
            <p className="text-gray-400 mb-6">Gestión de usuarios y permisos del sistema</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'backups':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Respaldos y Restauración</h2>
            <p className="text-gray-400 mb-6">Gestión de copias de seguridad del sistema</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'security':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Seguridad y Cifrado</h2>
            <p className="text-gray-400 mb-6">Configuración de seguridad y cifrado de datos</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      // Sección de Impuestos Florida
      case 'tax-config':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Configuración Fiscal Florida</h2>
            <p className="text-gray-400 mb-6">Configuración de impuestos estatales y locales</p>
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
              <p className="text-green-300 text-sm">✅ Tasas de impuestos por condado configuradas</p>
              <p className="text-green-200 text-xs mt-1">Sistema calcula automáticamente según el condado del cliente</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'tax-rates':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Tasas por Condado</h2>
            <p className="text-gray-400 mb-6">Tasas de impuestos configuradas para condados de Florida</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-semibold">Miami-Dade</h3>
                <p className="text-green-400 text-lg font-mono">7.5%</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-semibold">Broward</h3>
                <p className="text-green-400 text-lg font-mono">7.0%</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-semibold">Orange</h3>
                <p className="text-green-400 text-lg font-mono">6.5%</p>
              </div>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'florida-dr15':
        return <FloridaTaxReport />;

      case 'tax-reports':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Reportes Fiscales</h2>
            <p className="text-gray-400 mb-6">Informes y análisis de obligaciones fiscales</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'tax-calendar':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Calendario Fiscal</h2>
            <p className="text-gray-400 mb-6">Fechas importantes y vencimientos fiscales</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );
      
      // Secciones de Cuentas a Pagar
      case 'suppliers':
        // Si estamos viendo un proveedor específico
        if (state.viewingSupplier) {
          return (
            <SupplierDetailView
              supplier={state.viewingSupplier}
              onBack={handleBackFromSupplierDetail}
              onEdit={handleEditSupplier}
            />
          );
        }
        
        // Si estamos editando un proveedor
        if (state.editingSupplier) {
          return (
            <SupplierForm
              onSubmit={handleUpdateSupplier}
              onCancel={handleCancelSupplierEdit}
              initialData={state.editingSupplier}
              isEditing={true}
            />
          );
        }
        
        // Si estamos creando un nuevo proveedor
        if (state.showingSupplierForm) {
          return (
            <SupplierForm
              onSubmit={handleAddSupplier}
              onCancel={() => setState(prev => ({ ...prev, showingSupplierForm: false }))}
            />
          );
        }
        
        // Vista principal - LISTADO PRIMERO con botón Nuevo Proveedor
        return (
          <div className="space-y-6">
            {/* Header con botón Nuevo Proveedor */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Proveedores</h1>
                <p className="text-gray-400">Gestión de proveedores y contactos</p>
              </div>
              <button
                onClick={() => setState(prev => ({ ...prev, showingSupplierForm: true }))}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Proveedor</span>
              </button>
            </div>
            
            {/* Lista de proveedores */}
            <SupplierList
              suppliers={state.suppliers}
              onEdit={handleEditSupplier}
              onView={handleViewSupplier}
              onDelete={handleDeleteSupplier}
            />
          </div>
        );

      case 'bills-payable':
        // Si estamos viendo una factura específica
        if (state.viewingBill) {
          return (
            <BillDetailView
              bill={state.viewingBill}
              onBack={() => setState(prev => ({ ...prev, viewingBill: null }))}
              onEdit={(bill) => setState(prev => ({ ...prev, editingBill: bill, viewingBill: null }))}
            />
          );
        }
        
        // Si estamos editando una factura
        if (state.editingBill) {
          return (
            <BillForm
              initialData={state.editingBill}
              isEditing={true}
              suppliers={state.suppliers}
              products={state.products}
              onSubmit={handleBillSave}
              onCancel={() => setState(prev => ({ ...prev, editingBill: null }))}
            />
          );
        }
        
        // Si estamos creando una nueva factura
        if (state.showingBillForm) {
          return (
            <BillForm
              suppliers={state.suppliers}
              products={state.products}
              onSubmit={handleBillSave}
              onCancel={() => setState(prev => ({ ...prev, showingBillForm: false }))}
            />
          );
        }
        
        // Vista principal - LISTADO PRIMERO con botón Nueva Factura
        return (
          <div className="space-y-6">
            {/* Header con botón Nueva Factura */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Facturas de Compra</h1>
                <p className="text-gray-400">Gestión de facturas de proveedores</p>
              </div>
              <button
                onClick={() => setState(prev => ({ ...prev, showingBillForm: true }))}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Nueva Factura</span>
              </button>
            </div>
            
            {/* Lista de facturas */}
            <BillList
              bills={state.bills}
              onView={(bill: Bill) => setState(prev => ({ ...prev, viewingBill: bill }))}
              onEdit={(bill: Bill) => setState(prev => ({ ...prev, editingBill: bill }))}
              onDelete={handleDeleteBill}
            />
          </div>
        );
      case 'customers':
        // Si estamos viendo un cliente específico
        if (state.viewingCustomer) {
          return (
            <CustomerDetailView
              customer={state.viewingCustomer}
              onBack={handleBackFromDetail}
              onEdit={handleEditCustomer}
            />
          );
        }
        
        // Si estamos editando un cliente
        if (state.editingCustomer) {
          return (
            <CustomerFormAdvanced
              onSubmit={handleUpdateCustomer}
              onCancel={handleCancelEdit}
              initialData={state.editingCustomer}
              isEditing={true}
            />
          );
        }
        
        // Si estamos creando un nuevo cliente
        if (state.showingCustomerForm) {
          return (
            <CustomerFormAdvanced
              onSubmit={handleAddCustomer}
              onCancel={() => setState(prev => ({ ...prev, showingCustomerForm: false }))}
            />
          );
        }
        
        // Vista principal - LISTADO PRIMERO con botón Nuevo Cliente
        return (
          <div className="space-y-6">
            {/* Header con botón Nuevo Cliente */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Clientes</h1>
                <p className="text-gray-400">Gestión de clientes y contactos</p>
              </div>
              <button
                onClick={() => setState(prev => ({ ...prev, showingCustomerForm: true }))}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Cliente</span>
              </button>
            </div>
            
            {/* Lista de clientes */}
            <CustomerList
              customers={state.customers}
              onEdit={handleEditCustomer}
              onView={handleViewCustomer}
              onDelete={handleDeleteCustomer}
            />
          </div>
        );
      
      case 'invoices':
        // Si estamos viendo una factura específica
        if (state.viewingInvoice) {
          return (
            <InvoiceDetailView
              invoice={state.viewingInvoice}
              onBack={handleBackFromInvoiceDetail}
              onEdit={handleEditInvoice}
            />
          );
        }
        
        // Si estamos editando una factura
        if (state.editingInvoice) {
          return (
            <InvoiceForm
              onSubmit={handleUpdateInvoice}
              onCancel={handleCancelInvoiceEdit}
              customers={state.customers}
              products={state.products}
              initialData={state.editingInvoice}
              isEditing={true}
            />
          );
        }
        
        // Si estamos creando una nueva factura
        if (state.showingInvoiceForm) {
          return (
            <InvoiceForm
              onSubmit={handleCreateInvoice}
              customers={state.customers}
              products={state.products}
              onCancel={() => setState(prev => ({ ...prev, showingInvoiceForm: false }))}
            />
          );
        }
        
        // Vista principal - LISTADO PRIMERO con botón Nueva Factura
        return (
          <div className="space-y-6">
            {/* Header con botón Nueva Factura */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Facturas de Venta</h1>
                <p className="text-gray-400">Gestión de facturas de clientes</p>
              </div>
              <button
                onClick={() => setState(prev => ({ ...prev, showingInvoiceForm: true }))}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Nueva Factura</span>
              </button>
            </div>
            
            {/* Lista de facturas */}
            <InvoiceList
              invoices={state.invoices}
              onView={handleViewInvoice}
              onEdit={handleEditInvoice}
              onDelete={handleDeleteInvoice}
            />
          </div>
        );
      
      case 'customer-payments':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Pagos de Clientes</h2>
            <p className="text-gray-400 mb-6">Registro de pagos recibidos de clientes</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );
      
      case 'quotes':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Cotizaciones</h2>
            <p className="text-gray-400 mb-6">Gestión de cotizaciones y presupuestos</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );
      
      case 'receivable-reports':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Reportes Cuentas por Cobrar</h2>
            <p className="text-gray-400 mb-6">Informes y análisis de cuentas por cobrar</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'supplier-payments':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Pagos a Proveedores</h2>
            <p className="text-gray-400 mb-6">Registro de pagos realizados a proveedores</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );
      
      case 'purchase-orders':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Órdenes de Compra</h2>
            <p className="text-gray-400 mb-6">Gestión de órdenes de compra a proveedores</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );
      
      case 'payable-reports':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Reportes Cuentas por Pagar</h2>
            <p className="text-gray-400 mb-6">Informes y análisis de cuentas por pagar</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );
      
      // Secciones de Inventario
      case 'products':
        // Si estamos viendo un producto específico
        if (state.viewingProduct) {
          return (
            <ProductDetailView
              product={state.viewingProduct}
              onBack={handleBackFromProductDetail}
              onEdit={handleEditProduct}
            />
          );
        }
        
        // Si estamos editando un producto
        if (state.editingProduct) {
          return (
            <ProductForm
              onSubmit={handleUpdateProduct}
              onCancel={handleCancelProductEdit}
              initialData={state.editingProduct}
              isEditing={true}
            />
          );
        }
        
        // Si estamos creando un nuevo producto
        if (state.showingProductForm) {
          return (
            <ProductForm
              onSubmit={handleCreateProduct}
              onCancel={() => setState(prev => ({ ...prev, showingProductForm: false }))}
            />
          );
        }
        
        // Vista principal - LISTADO PRIMERO con botón Nuevo Producto
        return (
          <div className="space-y-6">
            {/* Header con botón Nuevo Producto */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Productos y Servicios</h1>
                <p className="text-gray-400">Catálogo de productos y servicios</p>
              </div>
              <button
                onClick={() => setState(prev => ({ ...prev, showingProductForm: true }))}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Producto</span>
              </button>
            </div>
            
            {/* Lista de productos */}
            <ProductList
              products={state.products}
              onEdit={handleEditProduct}
              onView={handleViewProduct}
              onDelete={handleDeleteProduct}
            />
          </div>
        );

      case 'product-categories':
        // Si estamos editando una categoría
        if (state.editingProductCategory) {
          return (
            <ProductCategoryForm
              onSubmit={handleUpdateProductCategory}
              onCancel={handleCancelProductCategoryEdit}
              initialData={state.editingProductCategory}
              isEditing={true}
            />
          );
        }
        
        // Si estamos creando una nueva categoría
        if (state.showingProductCategoryForm) {
          return (
            <ProductCategoryForm
              onSubmit={handleCreateProductCategory}
              onCancel={() => setState(prev => ({ ...prev, showingProductCategoryForm: false }))}
            />
          );
        }
        
        // Vista principal - LISTADO con gestión de categorías
        return (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-white">Categorías de Productos</h1>
              <p className="text-gray-400">Organización y clasificación de productos</p>
            </div>
            
            {/* Lista de categorías */}
            <ProductCategoryList
              categories={state.productCategories}
              onEdit={handleEditProductCategory}
              onDelete={handleDeleteProductCategory}
              onAdd={() => setState(prev => ({ ...prev, showingProductCategoryForm: true }))}
            />
          </div>
        );
      
      case 'inventory-movements':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Movimientos de Inventario</h2>
            <p className="text-gray-400 mb-6">Registro de entradas y salidas de inventario</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );
      
      case 'inventory-adjustments':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Ajustes de Inventario</h2>
            <p className="text-gray-400 mb-6">Correcciones y ajustes de stock</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );
      
      case 'inventory-reports':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Reportes de Inventario</h2>
            <p className="text-gray-400 mb-6">Informes de stock, valorización y rotación</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'locations':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Ubicaciones</h2>
            <p className="text-gray-400 mb-6">Gestión de ubicaciones y almacenes</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );
      
      // Secciones de parámetros generales
      case 'journal-entries':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Asientos Contables</h2>
            <p className="text-gray-400 mb-6">Registro manual de asientos contables</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'general-ledger':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Libro Mayor</h2>
            <p className="text-gray-400 mb-6">Registro detallado de todas las transacciones contables</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'trial-balance':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Balance de Comprobación</h2>
            <p className="text-gray-400 mb-6">Verificación de saldos deudores y acreedores</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'financial-reports':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Reportes Financieros</h2>
            <p className="text-gray-400 mb-6">Informes financieros personalizados y análisis</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'payment-methods':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Métodos de Pago</h2>
            <p className="text-gray-400 mb-6">Configuración de formas de pago disponibles</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'banks':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Cuentas Bancarias</h2>
            <p className="text-gray-400 mb-6">Gestión de cuentas bancarias de la empresa</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'help':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Centro de Ayuda</h2>
            <p className="text-gray-400 mb-6">Documentación y soporte técnico</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );

      case 'ai-assistant':
        // Activar el panel de IA y mostrar información
        if (!state.showingIAPanel) {
          setState(prev => ({ ...prev, showingIAPanel: true }));
        }
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Asistente IA</h2>
            <p className="text-gray-400 mb-6">Asistente inteligente para consultas contables</p>
            <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4 mb-6">
              <p className="text-purple-300 text-sm">🤖 IA No Intrusiva Activada</p>
              <p className="text-purple-200 text-xs mt-1">Panel flotante disponible en la esquina inferior derecha</p>
            </div>
            <div className="space-y-4 text-left max-w-2xl mx-auto">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Características:</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Solo acceso de lectura a datos</li>
                  <li>• Análisis financiero inteligente</li>
                  <li>• Recomendaciones de negocio</li>
                  <li>• Alertas de cumplimiento</li>
                  <li>• Insights de tendencias</li>
                </ul>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Cumplimiento:</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Documento Técnico Sección 7: "IA No Intrusiva"</li>
                  <li>• Acceso solo a vistas _summary</li>
                  <li>• No modifica datos del sistema</li>
                  <li>• Procesamiento 100% local</li>
                </ul>
              </div>
            </div>
            <button 
              onClick={() => setState(prev => ({ ...prev, showingIAPanel: true }))}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors mt-4"
            >
              Abrir Panel de IA
            </button>
          </div>
        );
      
      // Secciones de configuración
      case 'transactions':
        return (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Base de Datos - Transacciones</h2>
            <p className="text-gray-400 mb-6">Gestión de registros de transacciones</p>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">🚧 En desarrollo</p>
              <p className="text-yellow-200 text-xs mt-1">Próximamente disponible</p>
            </div>
            <button 
              onClick={() => handleNavigate('dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        );
      
      default:
        return <Dashboard stats={state.dbStats} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <Sidebar 
        currentSection={state.currentSection}
        onNavigate={handleNavigate}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header 
          isOnline={state.isOnline} 
          dbStats={state.dbStats} 
        />

        {/* Notificaciones */}
        {state.error && (
          <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mx-6 mt-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-300">{state.error}</p>
            </div>
          </div>
        )}

        {state.success && (
          <div className="bg-green-900/20 border-l-4 border-green-500 p-4 mx-6 mt-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <p className="text-green-300">{state.success}</p>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderCurrentSection()}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div>
                <p>AccountExpress Next-Gen v1.0.0 • ERP Contable Local-First</p>
                <p>Especializado para negocios en Florida, USA</p>
              </div>
              <div className="text-right">
                <p>Datos almacenados localmente con SQLite</p>
                <p>
                  Estado: 
                  <span className={`ml-1 font-medium ${
                    state.isOnline ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {state.isOnline ? 'Online' : 'Offline'} • Funcionando
                  </span>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Botón flotante de IA */}
      {!state.showingIAPanel && (
        <button
          onClick={() => setState(prev => ({ ...prev, showingIAPanel: true }))}
          className="fixed bottom-20 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-40"
          title="Abrir Asistente IA"
        >
          <Brain className="w-6 h-6" />
        </button>
      )}

      {/* Panel de IA */}
      <IAPanel
        isVisible={state.showingIAPanel}
        onClose={() => setState(prev => ({ ...prev, showingIAPanel: false }))}
      />
    </div>
  );
}

export default App;
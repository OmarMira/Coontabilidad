// ==========================================
// MÓDULO 01 — Tipos e Interfaces
// Extraído de simple-db.ts líneas 88-292 y 1327-1846
// ==========================================

export interface MonthlySummary {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  growth: number;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  social_security?: string;
  address?: string;
  phone?: string;
  hire_date: string;
  department?: string;
  position?: string;
  salary_type: 'monthly' | 'hourly';
  salary_rate: number;
  status: 'active' | 'inactive' | 'on_leave';
  florida_county?: string;
  hourly_rate?: number;
  salary?: number;
  pay_type?: 'hourly' | 'salaried';
  filing_status?: 'single' | 'married' | 'married_separate' | 'head_of_household';
  allowances?: number;
  additional_withholding?: number;
  ytd_gross_pay?: number;
  ytd_federal_tax?: number;
  ytd_fica?: number;
  ytd_medicare?: number;
  ssn?: string;
}

export interface PayrollPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  pay_date: string;
  status: 'open' | 'processing' | 'closed' | 'cancelled';
  total_gross: number;
  total_net: number;
}

export interface PayrollEntry {
  id: number;
  payroll_id: number;
  employee_id: number;
  first_name?: string;
  last_name?: string;
  gross_pay: number;
  net_pay: number;
  deductions: number;
  status: 'pending' | 'calculated' | 'approved' | 'paid' | 'cancelled';
  payment_method?: string;
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
}

export interface PayrollLineItem {
  id: number;
  payroll_entry_id: number;
  type: 'earning' | 'deduction' | 'tax';
  category: string;
  description: string;
  amount: number;
  is_calculated: boolean;
}

export interface PayrollSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export interface Payroll {
  id?: number;
  month: number;
  year: number;
  status: 'Open' | 'Approved' | 'Paid';
  total_gross: number;
  total_deductions: number;
  total_net: number;
  notes?: string;
  period_name?: string;
  period_id?: number;
  employee_count?: number;
  is_locked?: number;
  lock_date?: string;
  locked_by?: number;
  journal_entry_id?: number;
  journal_hash?: string;
  fl_unemployment_tax?: number;
  fl_excess_wages?: number;
  fl_taxable_wages?: number;
  total_gross_pay?: number;
  total_tax_load?: number;
  total_net_pay?: number;
  total_withholdings?: number;
  processed_by?: number;
  processed_at?: string;
  approved_by?: number;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaxBracket {
  id?: number;
  min_income: number;
  max_income?: number;
  fixed_amount: number;
  percentage: number;
  type?: 'monthly' | 'annual';
}

export interface AssetCategory {
  id?: number;
  name: string;
  description?: string;
  default_useful_life_years?: number;
  default_depreciation_rate?: number;
  account_code?: string;
  depreciation_expense_account?: string;
  accumulated_depreciation_account?: string;
  is_active?: number;
  created_at?: string;
}

export interface FixedAsset {
  id?: number;
  category_id: number;
  asset_number: string;
  description: string;
  purchase_date: string;
  purchase_cost: number;
  salvage_value?: number;
  depreciation_method: 'SL' | 'DB' | 'SYD';
  useful_life_years: number;
  location?: string;
  serial_number?: string;
  status: 'active' | 'disposed' | 'fully_depreciated';
  is_active?: number;
  created_at?: string;
  accumulated_depreciation?: number;
  book_value?: number;
  category_name?: string;
}

export interface AssetDepreciation {
  id?: number;
  asset_id: number;
  period_month: number;
  period_year: number;
  amount: number;
  journal_entry_id?: number;
  created_at?: string;
}

export interface FiscalYear {
  id: number;
  year: number;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed' | 'locked';
}

export interface AccountingPeriod {
  id: number;
  fiscal_year_id: number;
  name: string;
  month: number;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed' | 'locked';
}

export interface Customer {
  id: number;
  name: string;
  business_name?: string;
  document_type?: 'SSN' | 'EIN' | 'ITIN' | 'PASSPORT';
  document_number?: string;
  business_type?: string;
  email?: string;
  email_secondary?: string;
  phone?: string;
  phone_secondary?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  florida_county?: string;
  credit_limit?: number;
  payment_terms?: number;
  paymentCount?: number;
  tax_exempt?: boolean;
  tax_id?: string;
  assigned_salesperson?: string;
  status?: 'active' | 'inactive' | 'suspended';
  notes?: string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: number;
  name: string;
  business_name?: string;
  document_type?: 'SSN' | 'EIN' | 'ITIN' | 'PASSPORT';
  document_number?: string;
  business_type?: string;
  email?: string;
  email_secondary?: string;
  phone?: string;
  phone_secondary?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  florida_county?: string;
  credit_limit?: number;
  payment_terms?: number;
  paymentCount?: number;
  tax_exempt?: boolean;
  tax_id?: string;
  assigned_buyer?: string;
  status?: 'active' | 'inactive' | 'suspended';
  notes?: string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}

export interface KardexFilters {
  productId?: number;
  startDate?: string;
  endDate?: string;
  operationType?: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parent_id?: number | null;
  image_path?: string;
  slug?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category_id?: number;
  category?: ProductCategory;
  unit_of_measure: string;
  taxable: boolean;
  tax_rate?: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  supplier_id?: number;
  supplier?: Supplier;
  barcode?: string;
  image_path?: string;
  weight?: number;
  dimensions?: string;
  is_service: boolean;
  service_duration?: number;
  warranty_period?: number;
  notes?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  customer_business_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_zip?: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  hash?: string;
  signed_at?: string;
  signed_by?: number;
  version?: number;
  journal_entry_id?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  customer?: Customer;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total: number;
  taxable?: boolean | number;
  product?: {
    name: string;
    sku: string;
  };
}

export interface Bill {
  id: number;
  bill_number: string;
  supplier_id: number;
  supplier_name?: string;
  supplier_business_name?: string;
  supplier_email?: string;
  issue_date: string;
  due_date: string;
  category?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'received' | 'approved' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  journal_entry_id?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  supplier?: Supplier;
  items?: BillItem[];
}

export interface BillItem {
  id: number;
  bill_id: number;
  product_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total: number;
  taxable?: boolean | number;
  product?: {
    name: string;
    sku: string;
  };
}

export interface Payment {
  id: number;
  payment_number: string;
  invoice_id?: number;
  customer_id?: number;
  date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface SupplierPayment {
  id: number;
  payment_number: string;
  bill_id?: number;
  supplier_id?: number;
  date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface Quote {
  id: number;
  quote_number: string;
  customer_id: number;
  customer?: Customer;
  issue_date: string;
  expiration_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  converted_to_invoice_id?: number;
  notes?: string;
  terms?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  items?: QuoteLine[];
}

export interface QuoteLine {
  id: number;
  quote_id: number;
  product_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total: number;
  discount_percent?: number;
  discount_percentage?: number;
  taxable?: boolean | number;
  product_name?: string;
  sku?: string;
}

export interface ChartOfAccount {
  id: number;
  code: string;
  name: string;
  type: string;
  subtype?: string;
  active: boolean;
}

export interface JournalEntry {
  id: number;
  entry_number?: string;
  description: string;
  transaction_date?: string;
  entry_date: string;
  reference?: string;
  reference_number?: string;
  total_debit: number;
  total_credit: number;
  is_balanced?: boolean;
  created_at?: string;
  created_by?: number;
  verified_by?: number;
  verified_at?: string;
  details?: JournalDetail[];
}

export interface JournalDetail {
  id: number;
  journal_entry_id: number;
  account_code: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  account_name?: string;
  account_type?: string;
  normal_balance?: string;
  account?: {
    account_code: string;
    account_name: string;
    account_type: string;
    normal_balance: string;
  };
}

export interface FloridaDR15Report {
  periodMonth: number;
  periodYear: number;
  grossSales: number;
  taxableSales: number;
  totalTaxCollected: number;
  countyBreakdown: Array<{
    county: string;
    rate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
  exemptSales: number;
  adjustments: Array<{
    description: string;
    amount: number;
    type: 'credit' | 'debit';
  }>;
  netTaxDue: number;
  dueDate: Date;
  filedBy?: number;
  filedAt?: Date;
  status: 'pending' | 'filed' | 'paid' | 'late';
}

export interface FinancialSummary {
  report_type: string;
  total_assets: number;
  total_liabilities_equity: number;
  imbalance: number;
  period: string;
}

export interface TaxSummary {
  period: string;
  total_sales: number;
  taxable_sales: number;
  exempt_sales: number;
  total_tax_collected: number;
}

export interface BankAccount {
  id: number;
  account_name: string;
  bank_name: string;
  account_number: string;
  routing_number?: string;
  account_type: 'checking' | 'savings' | 'credit_card';
  currency: string;
  current_balance: number;
  active: number;
  is_active?: number;
  created_at?: string;
}

export interface BankTransaction {
  id: number;
  bank_account_id: number;
  transaction_date: string;
  description: string;
  amount: number;
  reference?: string;
  status: 'pending' | 'matched' | 'unmatched' | 'excluded';
  fit_id?: string;
  category?: string;
  journal_entry_id?: number;
  created_at?: string;
}

export interface ReconciliationStatement {
  id: number;
  bank_account_id: number;
  statement_date: string;
  beginning_balance: number;
  ending_balance: number;
  status: 'open' | 'completed';
  period_start?: string;
  period_end?: string;
}

export interface ReconciliationMatch {
  id: number;
  statement_id: number;
  bank_transaction_id: number;
  journal_entry_id: number;
  match_type: 'system' | 'manual';
  match_score?: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: 'cash' | 'credit_card' | 'bank_transfer' | 'check' | 'other';
  details?: string;
  active: boolean;
}

export interface AuditEntry {
  id: number;
  timestamp: string;
  user_id: number;
  action: string;
  module: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  ip_address?: string;
  previous_value?: string;
  new_value?: string;
  hash?: string;
}

export interface UserSession {
  id: number;
  user_id: number;
  token: string;
  ip_address: string;
  user_agent: string;
  login_at: string;
  last_activity_at: string;
  expires_at: string;
  created_at?: string;
}

export interface Budget {
  id: number;
  budget_name: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED';
  total_budget_amount: number;
  department?: string;
  notes?: string;
  alert_threshold_percentage?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  approved_by?: number;
  approved_at?: string;
}

export interface BudgetLine {
  id: number;
  budget_id: number;
  account_number: number;
  annual_amount: number;
  monthly_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetPeriod {
  id: number;
  budget_line_id: number;
  period_number: number;
  budgeted_amount: number;
  actual_amount: number;
  variance: number;
  notes?: string;
  updated_at: string;
}

export interface BudgetVarianceAnalysis {
  account_number: number;
  account_name: string;
  annual_budget: number;
  annual_actual: number;
  annual_variance: number;
  annual_variance_percent: number;
  ytd_budget: number;
  ytd_actual: number;
  ytd_variance: number;
  ytd_variance_percent: number;
  periods: {
    period_number: number;
    period_name: string;
    budgeted: number;
    actual: number;
    variance: number;
    variance_percent: number;
    is_favorable: boolean;
  }[];
}

export interface PayrollFilter {
  employeeId?: number;
  status?: string;
  year?: number;
  month?: number;
}

export interface TrialBalanceRow {
  account_code: string;
  account_name: string;
  account_type: string;
  debit_balance: number;
  credit_balance: number;
}

export interface IncomeStatementItem {
  account_code: string;
  account_name: string;
  amount: number;
  type: 'revenue' | 'expense';
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  order_date: string;
  expected_date?: string;
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  total_amount: number;
  notes?: string;
  created_at?: string;
}

export interface PurchaseOrderItem {
  id: number;
  po_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at?: string;
}

export interface KardexEntry extends StockMovement {
  product_name?: string;
  sku?: string;
  running_balance?: number;
}

export interface CompanyData {
  id?: number;
  name: string;
  legal_name?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_path?: string;
  florida_county?: string;
  fiscal_year_start?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FiscalSettings {
  fiscal_year_start_month: number;
  fiscal_year_start_day: number;
  default_currency: string;
  tax_method: 'cash' | 'accrual';
}

export interface MatchCandidate {
  journalEntry: JournalEntry;
  score: number;
  matchReason: string;
}

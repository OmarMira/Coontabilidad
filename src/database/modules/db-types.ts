// ==========================================
// MÓDULO 01 — Tipos e Interfaces
// Extraído de simple-db.ts líneas 88-292 y 1327-1846
// ==========================================



export interface Employee {
  id: number;
  employee_number?: string;
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
  period_id: number;
  employee_id: number;
  first_name?: string;
  last_name?: string;
  gross_amount: number;
  net_amount: number;
  deductions_amount: number;
  status: 'draft' | 'pending' | 'calculated' | 'approved' | 'paid' | 'cancelled';
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
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_at?: string;
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
  asset_code: string;
  name: string;
  description?: string;
  category_id: number;
  purchase_date: string;
  purchase_cost: number;
  salvage_value?: number;
  depreciation_method: 'straight_line' | 'declining_balance' | 'sum_of_years';
  useful_life_years: number;
  useful_life_months: number;
  current_value?: number;
  accumulated_depreciation?: number;
  location?: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  purchase_order?: string;
  supplier_id?: number;
  warranty_expiration?: string;
  notes?: string;
  status: 'active' | 'disposed' | 'fully_depreciated';
  disposal_date?: string;
  disposal_value?: number;
  disposal_reason?: string;
  created_by?: number;
  created_at?: string;
  book_value?: number;
  category_name?: string;
}

export interface AssetDepreciation {
  id?: number;
  asset_id: number;
  period_date: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  net_book_value: number;
  is_posted?: number;
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
  parent?: ProductCategory;
  tax_rate?: number;
  image_path?: string;
  slug?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
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
  customer_id: number;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  reference_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
}

export interface SupplierPayment {
  id: number;
  payment_number: string;
  bill_id?: number;
  supplier_id: number;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  reference_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
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
  account_code: string;
  number?: string;
  account_name: string;
  account_type: string;
  normal_balance: 'debit' | 'credit';
  description?: string;
  is_active: boolean;
  balance?: number;
  subtype?: string;
  parent_code?: string;
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
  period: string;
  totalTaxableSales: number;
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
  account_type: 'checking' | 'savings' | 'credit' | 'other';
  currency: string;
  balance: number;
  is_active: boolean;
  notes?: string;
  created_at?: string;
}

export interface BankTransaction {
  id: number;
  bank_account_id: number;
  transaction_date: string;
  description: string;
  amount: number;
  reference_number?: string;
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
  statement_balance: number;
  system_balance: number;
  difference?: number;
  status: 'pending' | 'completed' | 'reviewed';
  notes?: string;
  created_at?: string;
}

export interface ReconciliationMatch {
  id: number;
  statement_id: number;
  bank_transaction_id: number;
  journal_entry_id?: number;
  match_confidence: number;
  match_type: 'automatic' | 'manual';
  matched_by?: number;
  notes?: string;
  matched_at?: string;
}

export interface PaymentMethod {
  id: number;
  method_name: string;
  method_type: string;
  is_active: boolean;
  requires_reference: boolean;
  created_at?: string;
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
  po_number?: string;
  order_number?: string;
  supplier_id: number;
  supplier_name?: string;
  order_date: string;
  expected_date?: string;
  status: 'draft' | 'sent' | 'approved' | 'partial' | 'received' | 'cancelled';
  total_amount: number;
  notes?: string;
  items?: PurchaseOrderItem[];
  created_at?: string;
  created_by?: number;
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
  movement_type: 'in' | 'out' | 'adjustment' | 'purchase' | 'sale' | 'return' | 'initial';
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at?: string;
}

export interface KardexEntry extends StockMovement {
  product_name?: string;
  product_sku?: string;
  sku?: string;
  running_balance?: number;
  user_name?: string;
  formatted_date?: string;
}

export interface CompanyData {
  id: number;
  company_name: string;
  legal_name: string;
  tax_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website?: string;
  logo_path?: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  currency: string;
  language: string;
  timezone: string;
  sales_commission_rate: number;
  sales_commission_percentage: number;
  discount_amount: number;
  discount_percentage: number;
  shipping_rate: number;
  shipping_percentage: number;
  reposition_policy_days: number;
  late_fee_amount: number;
  late_fee_percentage: number;
  annual_interest_rate: number;
  grace_period_days: number;
  documentation_cost: number;
  other_costs: number;
  chart_of_accounts_name: string;
  date_format: string;
  netIncreaseInCash: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface FiscalSettings {
  id?: number;
  tax_year_start?: string;
  tax_frequency?: string;
  sales_tax_method?: string;
  dr15_filing_day?: number;
  default_tax_rate?: number;
  active?: boolean;
}

export interface MonthlySummary {
  month: string;
  revenue: number;
  expenses: number;
}

export interface MatchCandidate {
  journalEntry: JournalEntry;
  score: number;
  matchReason: string;
}

export interface PayrollRecord {
  id?: number;
  employee_id: number;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate?: number;
  regular_pay: number;
  overtime_pay: number;
  bonuses: number;
  commissions: number;
  gross_pay: number;
  social_security_tax: number;
  medicare_tax: number;
  medicare_additional_tax: number;
  federal_income_tax: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  journal_entry_id?: number;
  status: 'draft' | 'approved' | 'paid' | 'voided';
  processed_by?: number;
  processed_at?: string;
  approved_by?: number;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}

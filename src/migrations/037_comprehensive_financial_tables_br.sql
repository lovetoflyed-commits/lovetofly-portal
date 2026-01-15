-- Migration: Comprehensive Financial Management System (Brazilian Tax Compliant)
-- Compliant with: NF-e, RPS, DRE (Demonstrativo de Resultado do Exercício), NFC-e
-- Brazilian Tax Requirements: CNPJ, CPF, NCM, CFOP

-- Drop existing simplified tables if they exist
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS financial_transactions CASCADE;

-- 1. FINANCIAL ACCOUNTS (Plano de Contas - Chart of Accounts)
CREATE TABLE IF NOT EXISTS financial_accounts (
  id SERIAL PRIMARY KEY,
  account_code VARCHAR(20) UNIQUE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
  category VARCHAR(100) NOT NULL, -- e.g., REVENUE, COGS, OPERATING_EXPENSE, FINANCIAL, TAX
  sub_category VARCHAR(100),
  parent_account_id INTEGER REFERENCES financial_accounts(id),
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_account_code ON financial_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_account_type ON financial_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_account_category ON financial_accounts(category);

-- 2. INCOME SOURCES (Receitas)
CREATE TABLE IF NOT EXISTS income_sources (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  source_type VARCHAR(100) NOT NULL, -- ONLINE_PAYMENT, SERVICE_FEE, SPONSORSHIP, ADVERTISING, COURSES, CONSULTING, OTHER
  source_name VARCHAR(255) NOT NULL,
  description TEXT,
  tax_treatment VARCHAR(50) NOT NULL DEFAULT 'TRIBUTED', -- TRIBUTED, EXEMPT, SUSPENDED
  financial_account_id INTEGER REFERENCES financial_accounts(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_income_source_company ON income_sources(company_id);
CREATE INDEX IF NOT EXISTS idx_income_source_type ON income_sources(source_type);

-- 3. FINANCIAL TRANSACTIONS (Movimentações Financeiras)
CREATE TABLE IF NOT EXISTS financial_transactions (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- INCOME, EXPENSE, TRANSFER, REFUND, ADJUSTMENT
  category VARCHAR(100) NOT NULL, -- income category or expense category
  sub_category VARCHAR(100),
  amount NUMERIC(14,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BRL',
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, failed, reversed
  
  -- Income specifics
  income_source_id INTEGER REFERENCES income_sources(id),
  payment_method VARCHAR(50), -- CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, PIX, CASH, CHECK, OTHER
  
  -- Invoice/Document specifics
  invoice_id INTEGER,
  nf_number VARCHAR(50), -- NF-e or RPS number
  rps_number VARCHAR(50),
  
  -- Tax information (Brazilian compliance)
  icms_amount NUMERIC(14,2) DEFAULT 0.00, -- ICMS tax
  pis_amount NUMERIC(14,2) DEFAULT 0.00, -- PIS tax
  cofins_amount NUMERIC(14,2) DEFAULT 0.00, -- COFINS tax
  iss_amount NUMERIC(14,2) DEFAULT 0.00, -- ISS (service tax)
  ir_amount NUMERIC(14,2) DEFAULT 0.00, -- Income tax
  tax_rate NUMERIC(5,2) DEFAULT 0.00,
  
  -- References
  user_id INTEGER REFERENCES users(id),
  related_contract_id INTEGER,
  customer_id INTEGER,
  
  -- Description and notes
  description TEXT,
  reference_number VARCHAR(100),
  notes TEXT,
  
  -- Financial account
  financial_account_id INTEGER REFERENCES financial_accounts(id),
  
  -- Timestamps
  transaction_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transaction_company ON financial_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transaction_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_transaction_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transaction_payment_method ON financial_transactions(payment_method);

-- 4. INVOICES (Notas Fiscais - NF-e and RPS)
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  
  -- NF-e / RPS Information
  nf_number VARCHAR(50),
  nf_series VARCHAR(10),
  rps_number VARCHAR(50),
  nf_type VARCHAR(50), -- NF-e, RPS, NFC-e, MANUAL
  
  -- Invoice details
  contract_id INTEGER REFERENCES contracts(id),
  customer_id INTEGER,
  description TEXT,
  
  -- Amount and taxes (Brazilian tax system)
  subtotal NUMERIC(14,2) NOT NULL,
  discount_amount NUMERIC(14,2) DEFAULT 0.00,
  tax_amount NUMERIC(14,2) DEFAULT 0.00,
  total_amount NUMERIC(14,2) NOT NULL,
  
  icms_amount NUMERIC(14,2) DEFAULT 0.00,
  pis_amount NUMERIC(14,2) DEFAULT 0.00,
  cofins_amount NUMERIC(14,2) DEFAULT 0.00,
  iss_amount NUMERIC(14,2) DEFAULT 0.00,
  ir_amount NUMERIC(14,2) DEFAULT 0.00,
  
  -- Invoice status
  status VARCHAR(50) DEFAULT 'draft', -- draft, issued, sent, received, paid, cancelled
  
  -- Dates
  issue_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,
  
  -- Financial info
  payment_method VARCHAR(50),
  currency VARCHAR(10) DEFAULT 'BRL',
  
  -- Fiscal info
  cfop VARCHAR(10), -- Código Fiscal de Operações e Prestações
  ncm VARCHAR(20), -- Nomenclatura Comum do MERCOSUL (for products)
  
  -- Document XML/JSON
  nf_data JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoice_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_nf_number ON invoices(nf_number);
CREATE INDEX IF NOT EXISTS idx_invoice_rps_number ON invoices(rps_number);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_issue_date ON invoices(issue_date);

-- 5. EXPENSES (Despesas)
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  
  -- Expense classification (Brazilian compliance)
  expense_type VARCHAR(100) NOT NULL, -- OPERATIONAL, ADMINISTRATIVE, COGS, FINANCIAL, TAX, OTHER
  category VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100),
  
  amount NUMERIC(14,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BRL',
  
  -- Expense details
  description TEXT,
  vendor_name VARCHAR(255),
  vendor_cnpj_cpf VARCHAR(20),
  
  -- Invoice information
  invoice_number VARCHAR(100),
  nf_number VARCHAR(50),
  
  -- Status
  status VARCHAR(50) DEFAULT 'recorded', -- recorded, paid, cancelled
  
  -- Dates
  expense_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,
  
  -- Payment
  payment_method VARCHAR(50),
  
  -- Document (for audit trail)
  document_path VARCHAR(255),
  
  -- Financial account
  financial_account_id INTEGER REFERENCES financial_accounts(id),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_company ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expense_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expense_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_status ON expenses(status);

-- 6. TAX CALCULATIONS (Cálculos de Impostos)
CREATE TABLE IF NOT EXISTS tax_calculations (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  
  -- Tax type
  tax_type VARCHAR(50) NOT NULL, -- ICMS, PIS, COFINS, ISS, IR, SIMPLES
  
  -- Calculation period
  reference_date DATE NOT NULL,
  start_date DATE,
  end_date DATE,
  
  -- Amounts
  taxable_base NUMERIC(14,2),
  tax_rate NUMERIC(5,2),
  calculated_amount NUMERIC(14,2),
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, calculated, reported, paid
  
  -- Due date
  due_date DATE,
  payment_date DATE,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tax_company ON tax_calculations(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_type ON tax_calculations(tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_reference_date ON tax_calculations(reference_date);

-- 7. SPONSORSHIPS & PARTNERSHIPS
CREATE TABLE IF NOT EXISTS sponsorships (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  
  sponsor_name VARCHAR(255) NOT NULL,
  sponsor_cnpj_cpf VARCHAR(20),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  
  -- Sponsorship details
  sponsorship_type VARCHAR(100), -- MONETARY, PRODUCT, SERVICE, MEDIA
  description TEXT,
  
  -- Financial terms
  amount NUMERIC(14,2),
  currency VARCHAR(10) DEFAULT 'BRL',
  
  -- Duration
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, cancelled
  
  -- Contract
  contract_id INTEGER REFERENCES contracts(id),
  
  -- Tax treatment
  income_source_id INTEGER REFERENCES income_sources(id),
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sponsorship_company ON sponsorships(company_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_status ON sponsorships(status);

-- 8. ADVERTISING REVENUE
CREATE TABLE IF NOT EXISTS advertising_revenue (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  
  advertiser_name VARCHAR(255) NOT NULL,
  advertiser_cnpj_cpf VARCHAR(20),
  contact_email VARCHAR(255),
  
  -- Ad details
  campaign_name VARCHAR(255),
  description TEXT,
  
  -- Financial terms
  amount NUMERIC(14,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BRL',
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Billing
  billing_frequency VARCHAR(50), -- MONTHLY, QUARTERLY, ANNUAL, ONE_TIME
  invoice_id INTEGER REFERENCES invoices(id),
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, cancelled
  
  -- Tax treatment
  income_source_id INTEGER REFERENCES income_sources(id),
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advertising_company ON advertising_revenue(company_id);
CREATE INDEX IF NOT EXISTS idx_advertising_status ON advertising_revenue(status);

-- 9. PAYMENT TRACKING & RECONCILIATION
CREATE TABLE IF NOT EXISTS payment_records (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  
  -- Related documents
  invoice_id INTEGER REFERENCES invoices(id),
  transaction_id INTEGER REFERENCES financial_transactions(id),
  
  -- Payment details
  payment_method VARCHAR(50) NOT NULL,
  payment_date DATE NOT NULL,
  amount_paid NUMERIC(14,2) NOT NULL,
  
  -- Reference info
  transaction_reference VARCHAR(100),
  confirmation_code VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, pending, failed, reversed
  
  -- Bank details
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_company ON payment_records(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_invoice ON payment_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payment_records(payment_date);

-- 10. FINANCIAL REPORTS & DASHBOARDS
CREATE TABLE IF NOT EXISTS financial_reports (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  
  report_type VARCHAR(100) NOT NULL, -- DRE, BALANCO_PATRIMONIAL, FLUXO_CAIXA, APURACAO_ICMS, APURACAO_PIS_COFINS
  report_name VARCHAR(255),
  
  -- Period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Report data (JSON format for flexibility)
  report_data JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'generated', -- generated, sent, filed, approved
  
  -- Fiscal filing
  filing_date DATE,
  filing_number VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_company ON financial_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_report_type ON financial_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_report_period ON financial_reports(start_date, end_date);

-- 11. AUDIT TRAIL
CREATE TABLE IF NOT EXISTS financial_audit_log (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  
  entity_type VARCHAR(100), -- transaction, invoice, expense, etc
  entity_id INTEGER,
  
  action VARCHAR(50), -- CREATE, UPDATE, DELETE, APPROVE, REJECT
  old_values JSONB,
  new_values JSONB,
  
  reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_company ON financial_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON financial_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON financial_audit_log(created_at);

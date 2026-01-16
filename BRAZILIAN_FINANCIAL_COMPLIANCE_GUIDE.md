# Brazilian Financial Management System - Complete Documentation

## Overview

This financial management system is designed to fully comply with Brazilian tax laws, accounting standards, and commercial regulations. It provides comprehensive tracking of all financial activities required for tax filing and business compliance.

---

## Table of Contents

1. [Income Management](#income-management)
2. [Expense Management](#expense-management)
3. [Tax Calculations](#tax-calculations)
4. [Financial Reports](#financial-reports)
5. [Compliance Features](#compliance-features)
6. [API Reference](#api-reference)
7. [Brazilian Tax Framework](#brazilian-tax-framework)

---

## Income Management

### Income Sources Supported

The system tracks all types of business income:

- **Online Payments** - Payment processor transactions (Stripe, PagSeguro, etc.)
- **Service Fees** - Service provision fees and professional services
- **Sponsorships** - Monetary and in-kind sponsorships
- **Advertising Revenue** - Banner ads, sponsored content, partnerships
- **Course Sales** - E-learning and educational content sales
- **Consulting Services** - Professional consulting fees
- **Product Sales** - Physical or digital product sales
- **Commission Income** - Affiliate and commission-based revenue

### Income Source Configuration

Each income source can be configured with:

```sql
INSERT INTO income_sources (company_id, source_type, source_name, tax_treatment, financial_account_id)
VALUES ($1, 'ONLINE_PAYMENT', 'Stripe Payments', 'TRIBUTED', $2);
```

### Tax Treatment Classification

- **TRIBUTED** - Subject to full taxation (PIS, COFINS, ISS where applicable)
- **EXEMPT** - Tax-exempt income (e.g., certain NGO donations)
- **SUSPENDED** - Deferred tax treatment (temporary status)

---

## Expense Management

### Expense Categories (Operational)

The system classifies expenses for proper DRE (Income Statement) reporting:

#### 1. **OPERATIONAL** Expenses
- Shipping & Delivery
- Office Supplies
- Utilities
- Maintenance & Repairs
- Marketing & Advertising
- Professional Services
- Equipment & Machinery
- Vehicle Costs

#### 2. **ADMINISTRATIVE** Expenses
- Salaries & Payroll
- Rent
- Insurance
- Accounting & Legal
- Communication
- Travel & Transportation

#### 3. **COGS** (Cost of Goods Sold)
- Raw Materials
- Direct Labor
- Manufacturing Supplies
- Product Packaging

#### 4. **FINANCIAL** Expenses
- Bank Fees
- Interest on Loans
- Financial Charges

#### 5. **TAX** Expenses
- Tax penalties & interest
- Professional tax services
- Government fees

### Expense Tracking Features

Each expense record includes:
- Vendor information (CNPJ/CPF)
- Invoice number for audit trail
- NF-e tracking (for validation)
- Payment method and date
- Document attachment support

---

## Tax Calculations

### Brazilian Taxes Implemented

#### 1. **ICMS** (Imposto sobre Circulação de Mercadorias e Serviços)
- Product circulation tax
- Standard rate: 18% (varies by state)
- Applies to: Product sales, certain services
- Calculation: Applied automatically on products

#### 2. **PIS** (Programa de Integração Social)
- Rate: 1.65%
- Applies to: All business income
- Compliance: Required for federal funding calculations
- Calculation: Automatic on all income transactions

#### 3. **COFINS** (Contribuição para Financiamento da Seguridade Social)
- Rate: 7.6%
- Applies to: All business income
- Compliance: Social security financing requirement
- Calculation: Automatic on all income transactions

#### 4. **ISS** (Imposto sobre Serviços)
- Service tax
- Rate: 2-5% (varies by municipality)
- Applies to: Services (consulting, advertising, media)
- Requirement: Must file RPS (Recibo Provisório de Serviços)

#### 5. **IR** (Imposto de Renda)
- Income tax
- Estimated rate: 12.5% on net income (for tax estimation)
- Compliance: Quarterly tax estimates required for some regimes

### Tax Calculation Engine

The system automatically calculates taxes based on transaction type:

```typescript
// Example: Service income with full tax treatment
const transaction = {
  type: 'INCOME',
  category: 'SERVICE',
  amount: 1000.00,
};

// System calculates:
// - ICMS: R$ 0.00 (not applicable for services)
// - ISS: R$ 50.00 (5% of 1000)
// - PIS: R$ 16.50 (1.65% of 1000)
// - COFINS: R$ 76.00 (7.6% of 1000)
// - IR: R$ 125.00 (12.5% estimated on 1000)
// Total Taxes: R$ 267.50
// Net Income: R$ 732.50
```

### Custom Tax Rules

For specific business models, custom tax rates can be configured:

```sql
UPDATE income_sources 
SET custom_tax_rate = 0.15 
WHERE id = $1;
```

---

## Financial Reports

### 1. **DRE** (Demonstrativo de Resultado do Exercício)
**Income Statement** - Shows revenue, expenses, and profit/loss

Structure:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Income Statement - January 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPERATING INCOME:
  Online Payment Revenue        R$ 15,000.00
  Service Fees                  R$  8,500.00
  Sponsorship Income            R$  5,000.00
  Advertising Revenue           R$  3,200.00
                                ───────────
  Total Operating Income        R$ 31,700.00

COST OF GOODS SOLD:
  Raw Materials                 R$  2,000.00
  Direct Labor                  R$  1,500.00
                                ───────────
  Total COGS                    R$  3,500.00

GROSS PROFIT                    R$ 28,200.00

OPERATING EXPENSES:
  Salaries & Payroll           R$ 10,000.00
  Rent & Utilities              R$  2,000.00
  Marketing                     R$  1,500.00
  Professional Services         R$  1,200.00
                                ───────────
  Total Operating Expenses      R$ 14,700.00

FINANCIAL RESULT:
  Bank Fees                    (R$    150.00)

INCOME BEFORE TAXES            R$ 13,350.00

TAXES:
  ISS (Services)               (R$    512.50)
  PIS                          (R$    523.05)
  COFINS                       (R$  2,409.20)
  Estimated IR                 (R$  1,668.75)
                                ───────────
  Total Taxes                  (R$  5,113.50)

NET INCOME                      R$  8,236.50
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. **FLUXO DE CAIXA** (Cash Flow Statement)
Shows cash inflows and outflows by date

### 3. **APURAÇÃO ICMS** (ICMS Tax Filing)
Itemized report of all ICMS transactions for quarterly filing

### 4. **APURAÇÃO PIS/COFINS** (PIS/COFINS Tax Filing)
Social security tax compliance report

### 5. **BALANO PATRIMONIAL** (Balance Sheet)
Assets, liabilities, and equity (future implementation)

---

## Compliance Features

### Document Management

1. **Invoice Tracking**
   - NF-e (Eletronic Invoice) number tracking
   - RPS (Provisional Service Receipt) for services
   - NFC-e for consumer transactions
   - Automatic validation of document numbers

2. **Vendor Information**
   - CNPJ/CPF storage and validation
   - Name and contact tracking
   - Invoice reference for audit trail

3. **Audit Trail**
   - All transactions logged with timestamps
   - User tracking for every modification
   - Complete revision history
   - Reason for changes documented

### Financial Account Structure

Chart of Accounts (Plano de Contas) organization:

```
1000 - ASSETS
  1100 - Current Assets
    1110 - Cash & Banks
    1120 - Accounts Receivable
    1130 - Inventory
  1200 - Fixed Assets
    1210 - Equipment
    1220 - Accumulated Depreciation

2000 - LIABILITIES
  2100 - Current Liabilities
    2110 - Accounts Payable
    2120 - Tax Payable
    2130 - Payroll Payable
  2200 - Long-term Liabilities
    2210 - Loans

3000 - EQUITY
  3100 - Capital
  3200 - Retained Earnings

4000 - INCOME
  4100 - Operating Income
    4110 - Service Revenue
    4120 - Product Revenue
    4130 - Fee Income
  4200 - Other Income
    4210 - Interest Income
    4220 - Sponsorship Income

5000 - EXPENSES
  5100 - Operating Expenses
    5110 - Salaries
    5120 - Rent
    5130 - Utilities
  5200 - COGS
    5210 - Materials
    5220 - Labor
  5300 - Financial Expenses
    5310 - Bank Fees
    5320 - Interest Expense
```

---

## API Reference

### Income Sources Management

**GET** `/api/admin/finance/income-sources?company_id={id}`
- Lists all configured income sources

**POST** `/api/admin/finance/income-sources`
```json
{
  "company_id": 1,
  "source_type": "ONLINE_PAYMENT",
  "source_name": "Stripe Integration",
  "description": "Credit card payments via Stripe",
  "tax_treatment": "TRIBUTED",
  "financial_account_id": 123
}
```

### Financial Transactions

**GET** `/api/admin/finance/comprehensive-transactions?company_id={id}&start_date=2026-01-01&end_date=2026-01-31`
- Lists all income/expense transactions with tax calculations
- Returns: transaction amounts, automatic tax breakdowns, status

**POST** `/api/admin/finance/comprehensive-transactions`
```json
{
  "company_id": 1,
  "transaction_type": "INCOME",
  "category": "SERVICE",
  "amount": 1000.00,
  "currency": "BRL",
  "payment_method": "PIX",
  "description": "Consulting services for client ABC",
  "transaction_date": "2026-01-13",
  "tax_type": "SERVICE"
}
```

Response includes automatic tax calculation:
```json
{
  "transaction": {
    "id": 1,
    "amount": 1000.00,
    "icms_amount": 0.00,
    "iss_amount": 50.00,
    "pis_amount": 16.50,
    "cofins_amount": 76.00,
    "ir_amount": 125.00,
    "tax_rate": 26.75
  }
}
```

### Expenses Management

**POST** `/api/admin/finance/expenses`
```json
{
  "company_id": 1,
  "expense_type": "OPERATIONAL",
  "category": "Professional Services",
  "sub_category": "Accounting",
  "amount": 500.00,
  "vendor_name": "ABC Contadores LTDA",
  "vendor_cnpj_cpf": "12.345.678/0001-90",
  "invoice_number": "001",
  "nf_number": "NF-123456789",
  "expense_date": "2026-01-13"
}
```

### Sponsorships & Partnerships

**POST** `/api/admin/finance/sponsorships`
```json
{
  "company_id": 1,
  "sponsor_name": "Empresa XYZ",
  "sponsor_cnpj_cpf": "12.345.678/0001-90",
  "sponsorship_type": "MONETARY",
  "amount": 50000.00,
  "currency": "BRL",
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "income_source_id": 5
}
```

### Advertising Revenue

**POST** `/api/admin/finance/advertising`
```json
{
  "company_id": 1,
  "advertiser_name": "Tech Company XYZ",
  "advertiser_cnpj_cpf": "98.765.432/0001-10",
  "campaign_name": "Q1 2026 Campaign",
  "amount": 15000.00,
  "currency": "BRL",
  "start_date": "2026-01-01",
  "end_date": "2026-03-31",
  "billing_frequency": "MONTHLY"
}
```

### Financial Reports

**POST** `/api/admin/finance/reports`
```json
{
  "company_id": 1,
  "report_type": "DRE",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31"
}
```

Generates automatic DRE with:
- Total income by category
- Total taxes calculated
- Operating expenses
- Net income calculation
- Profit margin percentage

---

## Brazilian Tax Framework

### Tax Regimes Supported

#### 1. **SIMPLES NACIONAL** (Simplified Tax Regime)
- Single tax payment covering federal, state, and municipal taxes
- Requires monthly DAS payment
- Used for small businesses and startups
- Income limit: R$ 4.8 million/year

#### 2. **LUCRO PRESUMIDO** (Presumed Profit)
- Tax based on presumed profit percentage
- For businesses with revenue < R$ 78 million
- Quarterly tax estimates required
- ICMS, PIS, COFINS, IR calculated separately

#### 3. **LUCRO REAL** (Real Profit)
- Tax based on actual profit
- Required for businesses with revenue > R$ 78 million
- Monthly/quarterly tax estimates
- Comprehensive financial statements required
- Most complex but accurate for large operations

### Filing Requirements by Regime

#### SIMPLES NACIONAL
- **Monthly**: DAS-SIMEI (micro-entrepreneur) or DAS-MEI/EPP
- **Annual**: DASN-SIMEI (Declaração Anual)
- No need for separate tax appraisals

#### LUCRO PRESUMIDO
- **Quarterly**: DARF for IR, PIS, COFINS
- **Monthly**: ICMS appraisal (if applicable)
- **Annual**: ECF (Electronic Tax Return)

#### LUCRO REAL
- **Monthly**: DARF for IR, PIS, COFINS
- **Monthly**: ICMS appraisal (if applicable)
- **Quarterly**: LALUR (Profit & Loss Calculation Form)
- **Annual**: ECF (Electronic Tax Return)

### Key Compliance Dates

| Tax | Period | Due Date | Form |
|-----|--------|----------|------|
| ICMS | Monthly | Last day of month | GIA/ST |
| PIS/COFINS | Monthly/Quarterly | Until 20th of next month | APE |
| IR | Monthly/Quarterly | Until 20th of next month | DARF |
| ISS | Monthly | Until 10th of next month | RPS/NFS-e |
| Annual ECF | January 31 | January 31 | ECF/LALUR |

---

## Implementation Roadmap

### Phase 1: ✅ COMPLETED
- [ ] Financial accounts (Chart of Accounts)
- [ ] Income source configuration
- [ ] Basic transaction recording
- [ ] Automatic tax calculations
- [ ] DRE report generation
- [ ] Sponsorship tracking
- [ ] Advertising revenue tracking

### Phase 2: IN PROGRESS
- [ ] Enhanced invoice management (NF-e integration)
- [ ] Expense categorization
- [ ] ICMS appraisal automation
- [ ] PIS/COFINS appraisal automation
- [ ] Tax payment tracking
- [ ] Audit trail improvements

### Phase 3: PLANNED
- [ ] RPS (Provisional Service Receipt) integration
- [ ] NF-e XML generation and validation
- [ ] Integration with accounting software (SomaConta, etc.)
- [ ] Automatic DAS calculation (SIMPLES)
- [ ] LALUR generation (LUCRO REAL)
- [ ] Multi-company consolidation
- [ ] Integration with tax authorities API

---

## Quick Start: Setting Up Financial Module

### 1. Create Income Source

```bash
POST /api/admin/finance/income-sources
{
  "company_id": 1,
  "source_type": "ONLINE_PAYMENT",
  "source_name": "Stripe Payments",
  "tax_treatment": "TRIBUTED"
}
```

### 2. Record an Income Transaction

```bash
POST /api/admin/finance/comprehensive-transactions
{
  "company_id": 1,
  "transaction_type": "INCOME",
  "category": "SERVICE",
  "amount": 1000.00,
  "payment_method": "PIX",
  "description": "Consulting services",
  "tax_type": "SERVICE"
}
```

### 3. Record an Expense

```bash
POST /api/admin/finance/expenses
{
  "company_id": 1,
  "expense_type": "OPERATIONAL",
  "category": "Professional Services",
  "amount": 500.00,
  "vendor_name": "ABC Services",
  "vendor_cnpj_cpf": "12.345.678/0001-90"
}
```

### 4. Generate DRE Report

```bash
POST /api/admin/finance/reports
{
  "company_id": 1,
  "report_type": "DRE",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31"
}
```

---

## Data Export & Integration

### Export Formats Supported

- **CSV** - For spreadsheet analysis
- **PDF** - For tax filing submission
- **JSON** - For system integration
- **XML** - For NF-e/RPS transmission

### Integration Points

- Tax authority portals (e-CAC)
- Accounting software (SAP, TOTVS)
- Banks (automatic reconciliation)
- Payment processors (Stripe, PagSeguro)
- Payroll systems

---

## Support & Updates

This system is designed to comply with Brazilian tax laws as of January 2026. Regular updates will be provided as regulations change.

For questions or compliance matters:
- Consult with a certified accountant (Contador)
- Review current SPED documentation
- Contact tax authority (Receita Federal)


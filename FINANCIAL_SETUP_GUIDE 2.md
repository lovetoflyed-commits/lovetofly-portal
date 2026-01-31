# Financial Management System - Implementation & Setup Guide

## 🚀 Quick Start

### Step 1: Run Database Migration

```bash
npm run migrate:up
```

This will create all the necessary tables:
- `financial_accounts` - Chart of Accounts
- `income_sources` - Income configuration
- `financial_transactions` - All income/expense entries
- `invoices` - Invoice tracking with NF-e support
- `expenses` - Expense categorization
- `tax_calculations` - Tax computation
- `sponsorships` - Sponsorship tracking
- `advertising_revenue` - Advertising revenue
- `payment_records` - Payment reconciliation
- `financial_reports` - DRE, Cash Flow, Tax reports
- `financial_audit_log` - Complete audit trail

### Step 2: Initialize Income Sources

```bash
# Configure your primary income sources
curl -X POST http://localhost:3000/api/admin/finance/income-sources \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "source_type": "ONLINE_PAYMENT",
    "source_name": "Stripe Payments",
    "description": "Credit card processing via Stripe",
    "tax_treatment": "TRIBUTED"
  }'
```

### Step 3: Access Finance Dashboard

Navigate to: `http://localhost:3000/admin/finance`

---

## 💰 Income Management

### Recording Online Payments

**Automatically Calculates:**
- PIS: 1.65%
- COFINS: 7.6%
- ISS: 5% (for services)
- IR: 12.5% estimated

```bash
POST /api/admin/finance/comprehensive-transactions

{
  "company_id": 1,
  "transaction_type": "INCOME",
  "category": "SERVICE",
  "amount": 1000.00,
  "currency": "BRL",
  "payment_method": "PIX",
  "description": "Consulting services",
  "transaction_date": "2026-01-13",
  "tax_type": "SERVICE"
}
```

**Response:**
```json
{
  "transaction": {
    "id": 1,
    "amount": 1000.00,
    "currency": "BRL",
    "status": "pending",
    "icms_amount": 0.00,
    "pis_amount": 16.50,
    "cofins_amount": 76.00,
    "iss_amount": 50.00,
    "ir_amount": 125.00,
    "tax_rate": 26.75,
    "transaction_date": "2026-01-13",
    "created_at": "2026-01-13T10:30:00Z"
  }
}
```

### Recording Sponsorships

```bash
POST /api/admin/finance/sponsorships

{
  "company_id": 1,
  "sponsor_name": "Empresa XYZ LTDA",
  "sponsor_cnpj_cpf": "12.345.678/0001-90",
  "contact_email": "contact@empresa.com",
  "sponsorship_type": "MONETARY",
  "description": "Annual partnership - Love to Fly 2026",
  "amount": 50000.00,
  "currency": "BRL",
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "income_source_id": 3
}
```

### Recording Advertising Revenue

```bash
POST /api/admin/finance/advertising

{
  "company_id": 1,
  "advertiser_name": "Tech Company ABC",
  "advertiser_cnpj_cpf": "98.765.432/0001-10",
  "contact_email": "ads@techcompany.com",
  "campaign_name": "Q1 2026 Campaign",
  "description": "Homepage banner sponsorship",
  "amount": 15000.00,
  "currency": "BRL",
  "start_date": "2026-01-01",
  "end_date": "2026-03-31",
  "billing_frequency": "MONTHLY"
}
```

---

## 📉 Expense Management

### Recording Operational Expenses

```bash
POST /api/admin/finance/expenses

{
  "company_id": 1,
  "expense_type": "OPERATIONAL",
  "category": "Professional Services",
  "sub_category": "Accounting",
  "amount": 500.00,
  "currency": "BRL",
  "description": "Monthly accounting services",
  "vendor_name": "ABC Contadores LTDA",
  "vendor_cnpj_cpf": "12.345.678/0001-90",
  "invoice_number": "001",
  "nf_number": "NF-123456789",
  "expense_date": "2026-01-13",
  "due_date": "2026-02-13",
  "payment_method": "BANK_TRANSFER"
}
```

### Expense Categories

| Type | Category | Use Case |
|------|----------|----------|
| OPERATIONAL | Office Supplies | Pens, paper, etc. |
| OPERATIONAL | Utilities | Electricity, internet, water |
| OPERATIONAL | Marketing | Ads, campaigns, content |
| OPERATIONAL | Maintenance | Equipment repairs |
| ADMINISTRATIVE | Salaries | Employee payroll |
| ADMINISTRATIVE | Rent | Office space |
| ADMINISTRATIVE | Insurance | Business liability |
| COGS | Materials | Product components |
| COGS | Labor | Production labor |
| FINANCIAL | Bank Fees | Transaction fees |
| FINANCIAL | Interest | Loan interest |
| TAX | Penalties | Tax penalties |
| TAX | Professional Services | Tax consultant |

---

## 📊 Financial Reports

### 1. DRE (Demonstrativo de Resultado do Exercício)

**Income Statement for Jan 2026**

```bash
POST /api/admin/finance/reports

{
  "company_id": 1,
  "report_type": "DRE",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31"
}
```

**Generated Report Structure:**
```
INCOME (Receitas Operacionais):
  Online Payments        R$ 15,000.00
  Services              R$  8,500.00
  Sponsorships          R$  5,000.00
  Advertising           R$  3,200.00
  ────────────────────────────────
  TOTAL INCOME         R$ 31,700.00

COST OF GOODS SOLD:
  Materials             R$  2,000.00
  Labor                 R$  1,500.00
  ────────────────────────────────
  TOTAL COGS            R$  3,500.00

GROSS PROFIT           R$ 28,200.00

OPERATING EXPENSES:
  Salaries             R$ 10,000.00
  Rent                 R$  2,000.00
  Marketing            R$  1,500.00
  Professional Svcs    R$  1,200.00
  ────────────────────────────────
  TOTAL OPERATING       R$ 14,700.00

FINANCIAL RESULT:
  Bank Fees            (R$    150.00)

INCOME BEFORE TAXES   R$ 13,350.00

TAXES PAYABLE:
  ISS (5% on services) (R$    512.50)
  PIS (1.65%)          (R$    523.05)
  COFINS (7.6%)        (R$  2,409.20)
  IR Estimate (12.5%)  (R$  1,668.75)
  ────────────────────────────────
  TOTAL TAXES          (R$  5,113.50)

NET INCOME            R$  8,236.50

Profit Margin: 26.0%
```

### 2. Cash Flow Report (Fluxo de Caixa)

```bash
POST /api/admin/finance/reports

{
  "company_id": 1,
  "report_type": "FLUXO_CAIXA",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31"
}
```

Shows daily cash movement for liquidity analysis.

### 3. ICMS Appraisal

For product sales with ICMS tax:

```bash
POST /api/admin/finance/reports

{
  "company_id": 1,
  "report_type": "APURACAO_ICMS",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31"
}
```

### 4. PIS/COFINS Appraisal

For federal tax compliance:

```bash
POST /api/admin/finance/reports

{
  "company_id": 1,
  "report_type": "APURACAO_PIS_COFINS",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31"
}
```

---

## 🏛️ Brazilian Tax Compliance

### Tax Filing Calendar 2026

| Tax | Month | Due Date | Form | Description |
|-----|-------|----------|------|-------------|
| **ICMS** | Monthly | Last day | GIA/ST | State tax on products |
| **PIS** | Monthly | 20th | APE | Federal social tax |
| **COFINS** | Monthly | 20th | APE | Social security financing |
| **ISS** | Monthly | 10th | RPS/NFS-e | Municipal service tax |
| **IR** | Monthly | 20th | DARF | Federal income tax |
| **Annual** | January 31 | Jan 31 | ECF | Electronic tax filing |

### SIMPLES NACIONAL (Simplified Regime)

For businesses with revenue < R$ 4.8M/year:

```
Monthly Payment: DAS (Documento de Arrecadação do SIMPLES)
Covers: IRPJ, PIS, COFINS, CPP, ICMS, ISS
Rate: 4.5% - 33.48% (varies by revenue bracket)
```

**System automatically calculates DAS based on:**
- Previous 12-month revenue
- Current revenue bracket
- Any outstanding credits

### LUCRO PRESUMIDO (Presumed Profit)

For businesses with revenue < R$ 78M/year:

```
Tax Calculation:
  Revenue × Presumed Profit Rate × Tax Rate
  
  Example (Service):
  R$ 10,000 × 32% (presumed) × 25% (IR) = R$ 800
```

**Requires:**
- Quarterly DARF payments
- Monthly ICMS appraisal (if applicable)
- Annual ECF filing

---

## 🔐 Data Security & Audit Trail

### Automatic Audit Logging

Every transaction includes:
- User who made the entry
- Timestamp of creation
- Changes history
- Reason for modifications
- IP address for security

```sql
-- View audit trail
SELECT * FROM financial_audit_log 
WHERE company_id = 1 
ORDER BY created_at DESC;
```

### NF-e Integration (Future)

System ready for:
- NF-e XML generation
- Automatic Federal Registry
- Real-time validation
- Digital signature support

---

## 💻 API Endpoints Summary

### Income Sources
- `GET /api/admin/finance/income-sources?company_id={id}`
- `POST /api/admin/finance/income-sources`

### Transactions (Income)
- `GET /api/admin/finance/comprehensive-transactions?company_id={id}&start_date=&end_date=`
- `POST /api/admin/finance/comprehensive-transactions`

### Expenses
- `GET /api/admin/finance/expenses?company_id={id}&start_date=&end_date=`
- `POST /api/admin/finance/expenses`

### Sponsorships
- `GET /api/admin/finance/sponsorships?company_id={id}`
- `POST /api/admin/finance/sponsorships`

### Advertising
- `GET /api/admin/finance/advertising?company_id={id}`
- `POST /api/admin/finance/advertising`

### Financial Summary
- `GET /api/admin/finance/summary?company_id={id}`

### Reports
- `GET /api/admin/finance/reports?company_id={id}&report_type={type}`
- `POST /api/admin/finance/reports`

### Financial Accounts
- `GET /api/admin/finance/accounts`
- `POST /api/admin/finance/accounts`

---

## 📈 Key Features

✅ **Income Management**
- Online payments (Stripe, PagSeguro)
- Service fees
- Sponsorships (monetary & in-kind)
- Advertising revenue
- Professional consulting
- Course/product sales

✅ **Expense Tracking**
- Operational expenses
- Administrative costs
- COGS (Cost of Goods Sold)
- Financial expenses
- Tax-deductible items

✅ **Automatic Tax Calculation**
- ICMS (18% - state tax)
- PIS (1.65% - federal)
- COFINS (7.6% - federal)
- ISS (2-5% - municipal)
- IR (12.5% - estimated)

✅ **Financial Reports**
- DRE (Income Statement)
- Cash Flow Analysis
- Tax Appraisals
- Audit Trail

✅ **Compliance**
- NF-e ready
- RPS tracking
- CNPJ/CPF validation
- Invoice numbering
- Vendor tracking

---

## ⚙️ Configuration

### Custom Tax Rates

Adjust rates for your business:

```sql
UPDATE income_sources 
SET custom_tax_rate = 0.15 
WHERE id = 5;
```

### Multiple Companies

Each company_id maintains separate financial records:

```bash
POST /api/admin/finance/comprehensive-transactions
{
  "company_id": 2,  -- Different company
  "transaction_type": "INCOME",
  ...
}
```

---

## 🆘 Support & Compliance

### Consult With Accountant For:
- Tax regime selection (SIMPLES vs LUCRO REAL)
- Industry-specific tax treatment
- State-specific ICMS rates
- DAS calculation accuracy

### Regulatory References:
- SPED (Sistema Público de Escrituração Digital)
- NF-e (Eletronic Invoice) - Federal
- RPS (Provisional Service Receipt) - Municipal
- e-CAC (Portal Eletrônico de Atendimento)

### Document Required for Filing:
1. DRE (Income Statement)
2. Invoice summaries
3. Tax payment proofs
4. Expense documentation
5. CNPJ and company registry

---

## 📚 Related Documentation

- [BRAZILIAN_FINANCIAL_COMPLIANCE_GUIDE.md](./BRAZILIAN_FINANCIAL_COMPLIANCE_GUIDE.md) - Full technical details
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [README.md](./README.md) - General project info

Generated: January 13, 2026
System Version: 1.0.0

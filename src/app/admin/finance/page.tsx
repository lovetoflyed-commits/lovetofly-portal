"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

export default function AdminFinancePage() {
  const router = useRouter();
  const companyId = '1'; // Default - would come from auth context
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [advertising, setAdvertising] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal states
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddSponsorship, setShowAddSponsorship] = useState(false);
  const [showAddAdvertising, setShowAddAdvertising] = useState(false);
  const [showAddReport, setShowAddReport] = useState(false);

  // Form states
  const [incomeForm, setIncomeForm] = useState({
    transaction_type: 'INCOME',
    category: 'SERVICE',
    amount: '',
    payment_method: 'PIX',
    description: '',
    tax_type: 'SERVICE',
  });

  const [expenseForm, setExpenseForm] = useState({
    expense_type: 'OPERATIONAL',
    category: 'Professional Services',
    amount: '',
    vendor_name: '',
    vendor_cnpj_cpf: '',
    invoice_number: '',
    description: '',
  });

  const [sponsorshipForm, setSponsorshipForm] = useState({
    sponsor_name: '',
    sponsorship_type: 'MONETARY',
    amount: '',
    start_date: '',
    description: '',
  });

  const [advertisingForm, setAdvertisingForm] = useState({
    advertiser_name: '',
    campaign_name: '',
    amount: '',
    start_date: '',
    billing_frequency: 'MONTHLY',
  });

  const [reportForm, setReportForm] = useState({
    report_type: 'DRE',
    start_date: '',
    end_date: '',
  });

  const tabs: Tab[] = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'income', label: '💰 Income', icon: '💰' },
    { id: 'expenses', label: '📉 Expenses', icon: '📉' },
    { id: 'sponsorships', label: '🤝 Sponsorships', icon: '🤝' },
    { id: 'advertising', label: '📢 Advertising', icon: '📢' },
    { id: 'reports', label: '📋 Reports', icon: '📋' },
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [transRes, expRes, sponsRes, advRes, sumRes] = await Promise.all([
        fetch(`/api/admin/finance/comprehensive-transactions?company_id=${companyId}`).then(r => r.json()),
        fetch(`/api/admin/finance/expenses?company_id=${companyId}`).then(r => r.json()),
        fetch(`/api/admin/finance/sponsorships?company_id=${companyId}`).then(r => r.json()),
        fetch(`/api/admin/finance/advertising?company_id=${companyId}`).then(r => r.json()),
        fetch(`/api/admin/finance/summary?company_id=${companyId}`).then(r => r.json()),
      ]);

      setTransactions(transRes.transactions || []);
      setExpenses(expRes.expenses || []);
      setSponsorships(sponsRes.sponsorships || []);
      setAdvertising(advRes.advertising_revenue || []);
      setSummary(sumRes.summary || {});
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/finance/comprehensive-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin' },
        body: JSON.stringify({ company_id: companyId, ...incomeForm })
      });
      if (response.ok) {
        setShowAddIncome(false);
        setIncomeForm({ transaction_type: 'INCOME', category: 'SERVICE', amount: '', payment_method: 'PIX', description: '', tax_type: 'SERVICE' });
        fetchAllData();
      }
    } catch (error) {
      console.error('Error adding income:', error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin' },
        body: JSON.stringify({ company_id: companyId, ...expenseForm })
      });
      if (response.ok) {
        setShowAddExpense(false);
        setExpenseForm({ expense_type: 'OPERATIONAL', category: 'Professional Services', amount: '', vendor_name: '', vendor_cnpj_cpf: '', invoice_number: '', description: '' });
        fetchAllData();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleAddSponsorship = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/finance/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin' },
        body: JSON.stringify({ company_id: companyId, ...sponsorshipForm })
      });
      if (response.ok) {
        setShowAddSponsorship(false);
        setSponsorshipForm({ sponsor_name: '', sponsorship_type: 'MONETARY', amount: '', start_date: '', description: '' });
        fetchAllData();
      }
    } catch (error) {
      console.error('Error adding sponsorship:', error);
    }
  };

  const handleAddAdvertising = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/finance/advertising', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin' },
        body: JSON.stringify({ company_id: companyId, ...advertisingForm })
      });
      if (response.ok) {
        setShowAddAdvertising(false);
        setAdvertisingForm({ advertiser_name: '', campaign_name: '', amount: '', start_date: '', billing_frequency: 'MONTHLY' });
        fetchAllData();
      }
    } catch (error) {
      console.error('Error adding advertising:', error);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/finance/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin' },
        body: JSON.stringify({ company_id: companyId, ...reportForm })
      });
      if (response.ok) {
        setShowAddReport(false);
        setReportForm({ report_type: 'DRE', start_date: '', end_date: '' });
        fetchAllData();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">💰 Financial Management</h1>
            <p className="text-slate-400">Complete accounting & tax compliance system</p>
          </div>
          <button onClick={() => router.back()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
            ← Back
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Current Month Income */}
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/30 rounded-xl p-6">
              <p className="text-slate-400 text-sm font-medium mb-2">Current Month Income</p>
              <p className="text-3xl font-bold text-green-400">R$ {(summary?.current_month?.total_income || 0).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">{summary?.current_month?.transaction_count || 0} transactions</p>
            </div>

            {/* Total Taxes */}
            <div className="bg-gradient-to-br from-orange-600/20 to-orange-900/20 border border-orange-500/30 rounded-xl p-6">
              <p className="text-slate-400 text-sm font-medium mb-2">Taxes This Month</p>
              <p className="text-3xl font-bold text-orange-400">R$ {(summary?.current_month?.total_taxes || 0).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">ICMS, PIS, COFINS, ISS</p>
            </div>

            {/* Net Income */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-xl p-6">
              <p className="text-slate-400 text-sm font-medium mb-2">Net Income</p>
              <p className="text-3xl font-bold text-blue-400">R$ {(summary?.current_month?.net_income || 0).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">After taxes</p>
            </div>

            {/* Pending Invoices */}
            <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/30 rounded-xl p-6">
              <p className="text-slate-400 text-sm font-medium mb-2">Pending Invoices</p>
              <p className="text-3xl font-bold text-red-400">R$ {(summary?.invoices?.pending_amount || 0).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">{summary?.invoices?.pending_count || 0} invoices</p>
            </div>
          </div>
        )}

        {/* Income Tab */}
        {activeTab === 'income' && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Income Transactions</h2>
              <button 
                onClick={() => setShowAddIncome(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                + Record Income
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-slate-400">Category</th>
                    <th className="text-left py-3 px-4 text-slate-400">Amount</th>
                    <th className="text-left py-3 px-4 text-slate-400">Taxes</th>
                    <th className="text-left py-3 px-4 text-slate-400">Net</th>
                    <th className="text-left py-3 px-4 text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="py-4 text-center text-slate-400">Loading...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={6} className="py-4 text-center text-slate-400">No income recorded yet</td></tr>
                  ) : (
                    transactions.map((tx, idx) => (
                      <tr key={idx} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                        <td className="py-3 px-4 text-slate-200">{tx.category}</td>
                        <td className="py-3 px-4 text-green-400 font-bold">R$ {tx.amount}</td>
                        <td className="py-3 px-4 text-orange-400">R$ {(tx.icms_amount + tx.pis_amount + tx.cofins_amount + tx.iss_amount + tx.ir_amount).toFixed(2)}</td>
                        <td className="py-3 px-4 text-blue-400">R$ {(tx.amount - (tx.icms_amount + tx.pis_amount + tx.cofins_amount + tx.iss_amount + tx.ir_amount)).toFixed(2)}</td>
                        <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-xs ${tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{tx.status}</span></td>
                        <td className="py-3 px-4 text-slate-400">{tx.transaction_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Expenses</h2>
              <button 
                onClick={() => setShowAddExpense(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                + Record Expense
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-slate-400">Vendor</th>
                    <th className="text-left py-3 px-4 text-slate-400">Category</th>
                    <th className="text-left py-3 px-4 text-slate-400">Amount</th>
                    <th className="text-left py-3 px-4 text-slate-400">Invoice</th>
                    <th className="text-left py-3 px-4 text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan={5} className="py-4 text-center text-slate-400">No expenses recorded</td></tr>
                  ) : (
                    expenses.map((exp, idx) => (
                      <tr key={idx} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                        <td className="py-3 px-4 text-slate-200">{exp.vendor_name || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-300">{exp.category}</td>
                        <td className="py-3 px-4 text-red-400 font-bold">R$ {exp.amount}</td>
                        <td className="py-3 px-4 text-slate-400">{exp.invoice_number || exp.nf_number || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-400">{exp.expense_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sponsorships Tab */}
        {activeTab === 'sponsorships' && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Sponsorships</h2>
              <button 
                onClick={() => setShowAddSponsorship(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                + Add Sponsorship
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsorships.length === 0 ? (
                <p className="col-span-full text-center text-slate-400 py-8">No sponsorships recorded</p>
              ) : (
                sponsorships.map((sp, idx) => (
                  <div key={idx} className="bg-slate-700/30 rounded-lg p-4 border border-purple-500/30">
                    <h3 className="font-bold text-white mb-2">{sp.sponsor_name}</h3>
                    <p className="text-sm text-slate-300 mb-2">{sp.sponsorship_type}</p>
                    <p className="text-lg font-bold text-green-400">R$ {sp.amount}</p>
                    <p className="text-xs text-slate-500 mt-2">{sp.start_date} → {sp.end_date}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Advertising Tab */}
        {activeTab === 'advertising' && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Advertising Revenue</h2>
              <button 
                onClick={() => setShowAddAdvertising(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium"
              >
                + Add Campaign
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {advertising.length === 0 ? (
                <p className="col-span-full text-center text-slate-400 py-8">No advertising campaigns</p>
              ) : (
                advertising.map((ad, idx) => (
                  <div key={idx} className="bg-slate-700/30 rounded-lg p-4 border border-cyan-500/30">
                    <h3 className="font-bold text-white mb-2">{ad.advertiser_name}</h3>
                    <p className="text-sm text-slate-300 mb-2">{ad.campaign_name}</p>
                    <p className="text-lg font-bold text-green-400">R$ {ad.amount}</p>
                    <p className="text-xs text-slate-500 mt-2">{ad.billing_frequency}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Financial Reports</h2>
              <button 
                onClick={() => setShowAddReport(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
              >
                + Generate Report
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/30 rounded-lg p-4 border border-indigo-500/30 cursor-pointer hover:border-indigo-400/60">
                <h3 className="font-bold text-white mb-1">DRE</h3>
                <p className="text-sm text-slate-400">Income Statement</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4 border border-indigo-500/30 cursor-pointer hover:border-indigo-400/60">
                <h3 className="font-bold text-white mb-1">Cash Flow</h3>
                <p className="text-sm text-slate-400">Fluxo de Caixa</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4 border border-indigo-500/30 cursor-pointer hover:border-indigo-400/60">
                <h3 className="font-bold text-white mb-1">ICMS Appraisal</h3>
                <p className="text-sm text-slate-400">Apuração ICMS</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4 border border-indigo-500/30 cursor-pointer hover:border-indigo-400/60">
                <h3 className="font-bold text-white mb-1">PIS/COFINS</h3>
                <p className="text-sm text-slate-400">Apuração PIS/COFINS</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAddIncome && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Record Income</h3>
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium">Category</label>
                <select
                  value={incomeForm.category}
                  onChange={(e) => setIncomeForm({...incomeForm, category: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                >
                  <option value="SERVICE">Service</option>
                  <option value="PRODUCT">Product</option>
                  <option value="SPONSORSHIP">Sponsorship</option>
                  <option value="ADVERTISING">Advertising</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium">Amount (R$)</label>
                <input
                  type="number"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({...incomeForm, amount: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium">Payment Method</label>
                <select
                  value={incomeForm.payment_method}
                  onChange={(e) => setIncomeForm({...incomeForm, payment_method: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                >
                  <option value="PIX">PIX</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({...incomeForm, description: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                  placeholder="Brief description"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                  Record Income
                </button>
                <button type="button" onClick={() => setShowAddIncome(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Record Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium">Vendor Name</label>
                <input
                  type="text"
                  value={expenseForm.vendor_name}
                  onChange={(e) => setExpenseForm({...expenseForm, vendor_name: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                  placeholder="Vendor name"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                >
                  <option value="Professional Services">Professional Services</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Rent">Rent</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium">Amount (R$)</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium">Invoice Number</label>
                <input
                  type="text"
                  value={expenseForm.invoice_number}
                  onChange={(e) => setExpenseForm({...expenseForm, invoice_number: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                  placeholder="Invoice number"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
                  Record Expense
                </button>
                <button type="button" onClick={() => setShowAddExpense(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddSponsorship && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Add Sponsorship</h3>
            <form onSubmit={handleAddSponsorship} className="space-y-4">
              <input
                type="text"
                placeholder="Sponsor name"
                value={sponsorshipForm.sponsor_name}
                onChange={(e) => setSponsorshipForm({...sponsorshipForm, sponsor_name: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={sponsorshipForm.amount}
                onChange={(e) => setSponsorshipForm({...sponsorshipForm, amount: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                step="0.01"
                required
              />
              <input
                type="date"
                value={sponsorshipForm.start_date}
                onChange={(e) => setSponsorshipForm({...sponsorshipForm, start_date: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                required
              />
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium">
                  Add Sponsorship
                </button>
                <button type="button" onClick={() => setShowAddSponsorship(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddAdvertising && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Add Advertising Campaign</h3>
            <form onSubmit={handleAddAdvertising} className="space-y-4">
              <input
                type="text"
                placeholder="Advertiser name"
                value={advertisingForm.advertiser_name}
                onChange={(e) => setAdvertisingForm({...advertisingForm, advertiser_name: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                required
              />
              <input
                type="text"
                placeholder="Campaign name"
                value={advertisingForm.campaign_name}
                onChange={(e) => setAdvertisingForm({...advertisingForm, campaign_name: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500"
              />
              <input
                type="number"
                placeholder="Amount"
                value={advertisingForm.amount}
                onChange={(e) => setAdvertisingForm({...advertisingForm, amount: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                step="0.01"
                required
              />
              <input
                type="date"
                value={advertisingForm.start_date}
                onChange={(e) => setAdvertisingForm({...advertisingForm, start_date: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                required
              />
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium">
                  Add Campaign
                </button>
                <button type="button" onClick={() => setShowAddAdvertising(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Generate Financial Report</h3>
            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium">Report Type</label>
                <select
                  value={reportForm.report_type}
                  onChange={(e) => setReportForm({...reportForm, report_type: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                >
                  <option value="DRE">DRE - Income Statement</option>
                  <option value="FLUXO_CAIXA">Cash Flow</option>
                  <option value="APURACAO_ICMS">ICMS Appraisal</option>
                  <option value="APURACAO_PIS_COFINS">PIS/COFINS Appraisal</option>
                </select>
              </div>
              <input
                type="date"
                value={reportForm.start_date}
                onChange={(e) => setReportForm({...reportForm, start_date: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                required
              />
              <input
                type="date"
                value={reportForm.end_date}
                onChange={(e) => setReportForm({...reportForm, end_date: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                required
              />
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
                  Generate Report
                </button>
                <button type="button" onClick={() => setShowAddReport(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
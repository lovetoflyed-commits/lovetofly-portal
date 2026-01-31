'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReportData {
  total_owners: number;
  verified_owners: number;
  total_listings: number;
  active_listings: number;
  total_bookings: number;
  completed_bookings: number;
  revenue: number;
  average_occupancy: number;
  pending_approvals: number;
  booking_conflicts: number;
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/admin/hangarshare/reports?days=${dateRange}`);
      const data = await response.json();
      setReport(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report:', error);
      // Mock data
      setReport({
        total_owners: 7,
        verified_owners: 5,
        total_listings: 14,
        active_listings: 12,
        total_bookings: 42,
        completed_bookings: 35,
        revenue: 87500,
        average_occupancy: 78,
        pending_approvals: 2,
        booking_conflicts: 0,
      });
      setLoading(false);
    }
  };

  const getReportRows = () => {
    if (!report) return [];
    return [
      ['Total de anunciantes', report.total_owners],
      ['Anunciantes verificados', report.verified_owners],
      ['Total de anúncios', report.total_listings],
      ['Anúncios ativos', report.active_listings],
      ['Total de reservas', report.total_bookings],
      ['Reservas concluídas', report.completed_bookings],
      ['Receita gerada (R$)', report.revenue],
      ['Ocupação média (%)', report.average_occupancy],
      ['Pendências de aprovação', report.pending_approvals],
      ['Conflitos de reserva', report.booking_conflicts]
    ];
  };

  const exportPDF = async () => {
    if (!report || exporting) return;
    setExporting('pdf');
    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      const doc = new jsPDF();
      const autoTable = (autoTableModule as any).default || autoTableModule;
      const title = 'Relatório HangarShare';
      const periodLabel = `Período: últimos ${dateRange} dias`;

      doc.setFontSize(16);
      doc.text(title, 14, 18);
      doc.setFontSize(11);
      doc.text(periodLabel, 14, 26);

      autoTable(doc, {
        head: [['Métrica', 'Valor']],
        body: getReportRows().map(([label, value]) => [label, String(value)]),
        startY: 32,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 64, 175] }
      });

      doc.save(`relatorio-hangarshare-${dateRange}d.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF');
    } finally {
      setExporting(null);
    }
  };

  const exportCSV = () => {
    if (!report || exporting) return;
    setExporting('csv');
    try {
      const rows = getReportRows();
      const header = ['Métrica', 'Valor'];
      const csvLines = [header, ...rows].map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '');
            if (value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            if (value.includes(',') || value.includes('\n')) {
              return `"${value}"`;
            }
            return value;
          })
          .join(',')
      );

      const csvContent = '\uFEFF' + csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-hangarshare-${dateRange}d.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao exportar CSV');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <p className="text-slate-600">Gerando relatório...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-6">
        <Link href="/admin/hangarshare" className="text-blue-600 hover:underline">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-3">Relatórios HangarShare</h1>
        <p className="text-slate-600 mt-1">Métricas e análises de desempenho</p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <label className="block text-sm font-semibold text-slate-900 mb-2">Período de Análise</label>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded text-slate-900"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Último ano</option>
        </select>
      </div>

      {/* Export Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={exportPDF}
          disabled={!report || exporting !== null}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold disabled:bg-slate-300"
        >
          {exporting === 'pdf' ? 'Gerando PDF...' : '📄 Exportar PDF'}
        </button>
        <button
          onClick={exportCSV}
          disabled={!report || exporting !== null}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold disabled:bg-slate-300"
        >
          {exporting === 'csv' ? 'Gerando CSV...' : '📊 Exportar CSV'}
        </button>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Owners Statistics */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="text-sm text-blue-700 font-semibold uppercase mb-2">Anunciantes</div>
            <div className="text-3xl font-black text-blue-900 mb-2">{report.total_owners}</div>
            <div className="text-sm text-blue-700">
              {report.verified_owners} verificados ({Math.round((report.verified_owners / report.total_owners) * 100)}%)
            </div>
          </div>

          {/* Listings Statistics */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
            <div className="text-sm text-purple-700 font-semibold uppercase mb-2">Anúncios</div>
            <div className="text-3xl font-black text-purple-900 mb-2">{report.total_listings}</div>
            <div className="text-sm text-purple-700">
              {report.active_listings} ativos ({Math.round((report.active_listings / report.total_listings) * 100)}%)
            </div>
          </div>

          {/* Bookings Statistics */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <div className="text-sm text-green-700 font-semibold uppercase mb-2">Reservas</div>
            <div className="text-3xl font-black text-green-900 mb-2">{report.total_bookings}</div>
            <div className="text-sm text-green-700">
              {report.completed_bookings} concluídas ({Math.round((report.completed_bookings / report.total_bookings) * 100)}%)
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
            <div className="text-sm text-yellow-700 font-semibold uppercase mb-2">Receita Gerada</div>
            <div className="text-3xl font-black text-yellow-900">
              R$ {report.revenue?.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Occupancy */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-6">
            <div className="text-sm text-indigo-700 font-semibold uppercase mb-2">Taxa Ocupação Média</div>
            <div className="text-3xl font-black text-indigo-900">{report.average_occupancy}%</div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
            <div className="text-sm text-orange-700 font-semibold uppercase mb-2">Pendências</div>
            <div className="text-3xl font-black text-orange-900">{report.pending_approvals}</div>
            <div className="text-sm text-orange-700">aprovações aguardando</div>
          </div>

          {/* Booking Conflicts */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
            <div className="text-sm text-red-700 font-semibold uppercase mb-2">Conflitos</div>
            <div className="text-3xl font-black text-red-900">{report.booking_conflicts}</div>
            <div className="text-sm text-red-700">conflitos de reserva</div>
          </div>
        </div>
      )}

      {/* Additional sections can be added here */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Análises Detalhadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/hangarshare/reports/aerodromes"
            className="p-4 bg-white border border-slate-300 rounded hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="font-semibold text-slate-900">Desempenho por Aeródromo</div>
            <div className="text-sm text-slate-600 mt-1">Veja quais aeródromos têm melhor ocupação</div>
          </Link>
          <Link
            href="/admin/hangarshare/reports/owners-revenue"
            className="p-4 bg-white border border-slate-300 rounded hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="font-semibold text-slate-900">Receita por Anunciante</div>
            <div className="text-sm text-slate-600 mt-1">Ranking dos anunciantes mais lucrativos</div>
          </Link>
          <Link
            href="/admin/hangarshare/reports/trends"
            className="p-4 bg-white border border-slate-300 rounded hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="font-semibold text-slate-900">Tendências Temporais</div>
            <div className="text-sm text-slate-600 mt-1">Gráficos de evolução mensal</div>
          </Link>
          <Link
            href="/admin/hangarshare/reports/satisfaction"
            className="p-4 bg-white border border-slate-300 rounded hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="font-semibold text-slate-900">Satisfação de Clientes</div>
            <div className="text-sm text-slate-600 mt-1">Avaliações e feedbacks</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

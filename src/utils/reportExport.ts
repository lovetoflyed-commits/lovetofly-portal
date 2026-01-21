// Utility: Report Export Functions
// File: src/utils/reportExport.ts
// Purpose: Export dashboard data to PDF and CSV formats

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportData {
  ownerName: string;
  timeRange: string;
  generatedAt: string;
  metrics: {
    totalRevenue: number;
    monthlyAverage: number;
    totalBookings: number;
    occupancyRate: number;
    conversionRate: number;
  };
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    bookings: number;
    occupancy: number;
  }>;
  topListings: Array<{
    title: string;
    revenue: number;
    bookings: number;
    occupancy: number;
  }>;
}

/**
 * Export dashboard data to PDF format
 */
export function exportToPDF(data: ExportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(16);
  doc.text('Relatório de Analytics', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Proprietário: ${data.ownerName}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Período: ${data.timeRange}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Gerado em: ${new Date(data.generatedAt).toLocaleDateString('pt-BR')}`, 20, yPosition);

  // Summary Section
  yPosition += 12;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Resumo de Métricas', 20, yPosition);

  yPosition += 8;
  doc.setFontSize(9);
  const summaryData = [
    ['Métrica', 'Valor'],
    [
      'Receita Total',
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.metrics.totalRevenue),
    ],
    [
      'Receita Média Mensal',
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.metrics.monthlyAverage),
    ],
    ['Total de Reservas', data.metrics.totalBookings.toString()],
    ['Taxa de Ocupação', `${(data.metrics.occupancyRate * 100).toFixed(1)}%`],
    ['Taxa de Conversão', `${data.metrics.conversionRate.toFixed(1)}%`],
  ];

  autoTable(doc, {
    head: [summaryData[0]],
    body: summaryData.slice(1),
    startY: yPosition,
    margin: { left: 20, right: 20 },
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: 'right' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Monthly Trend Section
  if (data.monthlyTrend.length > 0 && yPosition < pageHeight - 40) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Tendência Mensal', 20, yPosition);

    yPosition += 8;
    const trendData = [
      ['Mês', 'Receita', 'Reservas', 'Ocupação'],
      ...data.monthlyTrend.map((row) => [
        row.month,
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.revenue),
        row.bookings.toString(),
        `${(row.occupancy * 100).toFixed(1)}%`,
      ]),
    ];

    autoTable(doc, {
      head: [trendData[0]],
      body: trendData.slice(1),
      startY: yPosition,
      margin: { left: 20, right: 20 },
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 45, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Top Listings Section
  if (data.topListings.length > 0 && yPosition < pageHeight - 40) {
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Top Hangares', 20, yPosition);

    yPosition += 8;
    const listingsData = [
      ['Hangar', 'Receita', 'Reservas', 'Ocupação'],
      ...data.topListings.map((row) => [
        row.title.substring(0, 30),
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.revenue),
        row.bookings.toString(),
        `${(row.occupancy * 100).toFixed(1)}%`,
      ]),
    ];

    autoTable(doc, {
      head: [listingsData[0]],
      body: listingsData.slice(1),
      startY: yPosition,
      margin: { left: 20, right: 20 },
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
    });
  }

  // Footer
  const totalPages = (doc as any).internal.pages.length;
  for (let i = 1; i < totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${totalPages - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Save PDF
  doc.save(`relatorio-hangares-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export dashboard data to CSV format
 */
export function exportToCSV(data: ExportData): void {
  const rows: string[] = [];

  // Header information
  rows.push('RELATÓRIO DE ANALYTICS - HANGARES');
  rows.push(`Proprietário: ${data.ownerName}`);
  rows.push(`Período: ${data.timeRange}`);
  rows.push(`Gerado em: ${new Date(data.generatedAt).toLocaleDateString('pt-BR')}`);
  rows.push('');

  // Summary metrics
  rows.push('RESUMO DE MÉTRICAS');
  rows.push('Métrica,Valor');
  rows.push(
    `Receita Total,"${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.metrics.totalRevenue)}"`
  );
  rows.push(
    `Receita Média Mensal,"${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.metrics.monthlyAverage)}"`
  );
  rows.push(`Total de Reservas,${data.metrics.totalBookings}`);
  rows.push(`Taxa de Ocupação,"${(data.metrics.occupancyRate * 100).toFixed(1)}%"`);
  rows.push(`Taxa de Conversão,"${data.metrics.conversionRate.toFixed(1)}%"`);
  rows.push('');

  // Monthly trend
  if (data.monthlyTrend.length > 0) {
    rows.push('TENDÊNCIA MENSAL');
    rows.push('Mês,Receita,Reservas,Ocupação (%)');
    data.monthlyTrend.forEach((row) => {
      rows.push(
        `${row.month},"${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.revenue)}",${row.bookings},"${(row.occupancy * 100).toFixed(1)}"`
      );
    });
    rows.push('');
  }

  // Top listings
  if (data.topListings.length > 0) {
    rows.push('TOP HANGARES');
    rows.push('Hangar,Receita,Reservas,Ocupação (%)');
    data.topListings.forEach((row) => {
      rows.push(
        `"${row.title}","${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.revenue)}",${row.bookings},"${(row.occupancy * 100).toFixed(1)}"`
      );
    });
  }

  // Create and download file
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio-hangares-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate printable HTML report
 */
export function generatePrintReport(data: ExportData): string {
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Analytics</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        h1, h2 { color: #2980b9; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #2980b9;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .header {
          text-align: center;
          border-bottom: 2px solid #2980b9;
          margin-bottom: 20px;
          padding-bottom: 10px;
        }
        .metric-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 20px 0;
        }
        .metric-box {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 5px;
          background-color: #f0f8ff;
        }
        .footer {
          text-align: center;
          color: #999;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Analytics</h1>
        <p><strong>Proprietário:</strong> ${data.ownerName}</p>
        <p><strong>Período:</strong> ${data.timeRange}</p>
        <p><strong>Gerado em:</strong> ${new Date(data.generatedAt).toLocaleDateString('pt-BR')}</p>
      </div>

      <h2>Resumo de Métricas</h2>
      <div class="metric-row">
        <div class="metric-box">
          <strong>Receita Total</strong><br>
          ${formatCurrency(data.metrics.totalRevenue)}
        </div>
        <div class="metric-box">
          <strong>Receita Média Mensal</strong><br>
          ${formatCurrency(data.metrics.monthlyAverage)}
        </div>
        <div class="metric-box">
          <strong>Total de Reservas</strong><br>
          ${data.metrics.totalBookings}
        </div>
        <div class="metric-box">
          <strong>Taxa de Ocupação</strong><br>
          ${(data.metrics.occupancyRate * 100).toFixed(1)}%
        </div>
      </div>

      ${
        data.monthlyTrend.length > 0
          ? `
        <h2>Tendência Mensal</h2>
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Receita</th>
              <th>Reservas</th>
              <th>Ocupação</th>
            </tr>
          </thead>
          <tbody>
            ${data.monthlyTrend
              .map(
                (row) => `
              <tr>
                <td>${row.month}</td>
                <td>${formatCurrency(row.revenue)}</td>
                <td>${row.bookings}</td>
                <td>${(row.occupancy * 100).toFixed(1)}%</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
          : ''
      }

      ${
        data.topListings.length > 0
          ? `
        <h2>Top Hangares</h2>
        <table>
          <thead>
            <tr>
              <th>Hangar</th>
              <th>Receita</th>
              <th>Reservas</th>
              <th>Ocupação</th>
            </tr>
          </thead>
          <tbody>
            ${data.topListings
              .map(
                (row) => `
              <tr>
                <td>${row.title}</td>
                <td>${formatCurrency(row.revenue)}</td>
                <td>${row.bookings}</td>
                <td>${(row.occupancy * 100).toFixed(1)}%</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
          : ''
      }

      <div class="footer">
        <p>Este relatório foi gerado automaticamente pelo sistema de analytics HangarShare</p>
      </div>
    </body>
    </html>
  `;
}

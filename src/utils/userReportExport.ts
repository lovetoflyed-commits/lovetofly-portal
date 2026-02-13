import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface UserReportRow {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  aviation_role?: string;
  plan?: string;
  user_type?: string;
  user_type_verified?: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  business_id?: string | number;
  business_name?: string;
  cnpj?: string;
  business_email?: string;
  business_is_verified?: boolean;
  business_verification_status?: string;
  access_level?: string;
  access_reason?: string;
  active_warnings?: number;
  active_strikes?: number;
  is_banned?: boolean;
  last_activity_at?: string | null;
  days_inactive?: number | null;
  created_at?: string | null;
}

export interface UserReportExportData {
  title: string;
  generatedAt: string;
  filtersLabel: string;
  rows: UserReportRow[];
  summary: {
    total: number;
    verified: number;
    business: number;
    staff: number;
    banned: number;
    suspended: number;
    warned: number;
    inactive30: number;
  };
}

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
};

export function exportUsersToPDF(data: UserReportExportData) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text(data.title, pageWidth / 2, 16, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`Gerado em: ${formatDateTime(data.generatedAt)}`, 14, 26);
  doc.text(`Filtros: ${data.filtersLabel || 'Todos'}`, 14, 32);

  const summaryRows = [
    ['Total', data.summary.total],
    ['Verificados', data.summary.verified],
    ['Empresas', data.summary.business],
    ['Staff', data.summary.staff],
    ['Banidos', data.summary.banned],
    ['Suspensos', data.summary.suspended],
    ['Com Advertencia', data.summary.warned],
    ['Inativos 30d+', data.summary.inactive30]
  ];

  autoTable(doc, {
    head: [['Resumo', 'Valor']],
    body: summaryRows,
    startY: 38,
    theme: 'grid',
    headStyles: { fillColor: [25, 106, 160], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 }
  });

  const tableStart = (doc as any).lastAutoTable.finalY + 8;
  const rows = data.rows.map((row) => [
    row.id,
    row.name,
    row.email,
    row.role || '-',
    row.aviation_role || '-',
    row.plan || '-',
    row.user_type || '-',
    row.user_type_verified ? 'Sim' : 'Nao',
    row.business_name || '-',
    row.cnpj || '-',
    row.business_verification_status || '-',
    row.access_level || '-',
    row.active_warnings || 0,
    row.active_strikes || 0,
    row.is_banned ? 'Sim' : 'Nao',
    formatDateTime(row.last_activity_at || null),
    formatDate(row.created_at || null)
  ]);

  autoTable(doc, {
    head: [[
      'ID',
      'Nome',
      'Email',
      'Role',
      'Aviation Role',
      'Plano',
      'Tipo',
      'Verificado',
      'Empresa',
      'CNPJ',
      'Verificacao Empresa',
      'Status Acesso',
      'Warn',
      'Strike',
      'Banido',
      'Ultima Atividade',
      'Criado em'
    ]],
    body: rows,
    startY: tableStart,
    theme: 'grid',
    styles: { fontSize: 6 },
    headStyles: { fillColor: [25, 106, 160], textColor: 255, fontStyle: 'bold' }
  });

  doc.save(`relatorio-usuarios-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportUsersToCSV(data: UserReportExportData) {
  const header = [
    'ID',
    'Nome',
    'Email',
    'Role',
    'Aviation Role',
    'Plano',
    'Tipo',
    'Verificado',
    'Empresa',
    'CNPJ',
    'Verificacao Empresa',
    'Status Acesso',
    'Advertencias',
    'Strikes',
    'Banido',
    'UltimaAtividade',
    'CriadoEm'
  ];

  const rows = data.rows.map((row) => [
    row.id,
    row.name,
    row.email,
    row.role || '',
    row.aviation_role || '',
    row.plan || '',
    row.user_type || '',
    row.user_type_verified ? 'Sim' : 'Nao',
    row.business_name || '',
    row.cnpj || '',
    row.business_verification_status || '',
    row.access_level || '',
    row.active_warnings || 0,
    row.active_strikes || 0,
    row.is_banned ? 'Sim' : 'Nao',
    formatDateTime(row.last_activity_at || null),
    formatDate(row.created_at || null)
  ]);

  const csvLines = [
    `Relatorio: ${data.title}`,
    `Gerado em: ${formatDateTime(data.generatedAt)}`,
    `Filtros: ${data.filtersLabel || 'Todos'}`,
    '',
    header.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio-usuarios-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportUsersToXLSX(data: UserReportExportData) {
  const rows = data.rows.map((row) => ({
    ID: row.id,
    Nome: row.name,
    Email: row.email,
    Role: row.role || '',
    AviationRole: row.aviation_role || '',
    Plano: row.plan || '',
    Tipo: row.user_type || '',
    Verificado: row.user_type_verified ? 'Sim' : 'Nao',
    Empresa: row.business_name || '',
    CNPJ: row.cnpj || '',
    VerificacaoEmpresa: row.business_verification_status || '',
    StatusAcesso: row.access_level || '',
    Advertencias: row.active_warnings || 0,
    Strikes: row.active_strikes || 0,
    Banido: row.is_banned ? 'Sim' : 'Nao',
    UltimaAtividade: formatDateTime(row.last_activity_at || null),
    CriadoEm: formatDate(row.created_at || null)
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

  XLSX.writeFile(workbook, `relatorio-usuarios-${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function generateUsersPrintReport(data: UserReportExportData): string {
  const rowsHtml = data.rows
    .map(
      (row) => `
        <tr>
          <td>${row.id}</td>
          <td>${row.name}</td>
          <td>${row.email}</td>
          <td>${row.role || '-'}</td>
          <td>${row.aviation_role || '-'}</td>
          <td>${row.plan || '-'}</td>
          <td>${row.user_type || '-'}</td>
          <td>${row.user_type_verified ? 'Sim' : 'Nao'}</td>
          <td>${row.business_name || '-'}</td>
          <td>${row.cnpj || '-'}</td>
          <td>${row.business_verification_status || '-'}</td>
          <td>${row.access_level || '-'}</td>
          <td>${row.is_banned ? 'Sim' : 'Nao'}</td>
          <td>${formatDateTime(row.last_activity_at || null)}</td>
          <td>${formatDate(row.created_at || null)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; padding: 24px; }
          h1 { margin-bottom: 4px; }
          .meta { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 6px; text-align: left; }
          th { background: #e5f0ff; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        <div class="meta">Gerado em ${formatDateTime(data.generatedAt)} | Filtros: ${data.filtersLabel || 'Todos'}</div>
        <div class="summary">
          <div class="card"><strong>Total</strong><div>${data.summary.total}</div></div>
          <div class="card"><strong>Verificados</strong><div>${data.summary.verified}</div></div>
          <div class="card"><strong>Empresas</strong><div>${data.summary.business}</div></div>
          <div class="card"><strong>Staff</strong><div>${data.summary.staff}</div></div>
          <div class="card"><strong>Banidos</strong><div>${data.summary.banned}</div></div>
          <div class="card"><strong>Suspensos</strong><div>${data.summary.suspended}</div></div>
          <div class="card"><strong>Advertencias</strong><div>${data.summary.warned}</div></div>
          <div class="card"><strong>Inativos 30d+</strong><div>${data.summary.inactive30}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Role</th>
              <th>Aviation Role</th>
              <th>Plano</th>
              <th>Tipo</th>
              <th>Verificado</th>
              <th>Empresa</th>
              <th>CNPJ</th>
              <th>Verificacao Empresa</th>
              <th>Status Acesso</th>
              <th>Banido</th>
              <th>Ultima Atividade</th>
              <th>Criado em</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

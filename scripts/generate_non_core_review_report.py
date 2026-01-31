import re
from pathlib import Path
from datetime import datetime
from collections import defaultdict

from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
dump_path = root / 'db' / 'lovetofly-portal-full-dump.sql'
md_out_path = root / 'docs' / 'records' / 'active' / 'DB_NON_CORE_TABLES_REVIEW_2026-01-29.md'
pdf_out_path = root / 'docs' / 'records' / 'active' / 'DB_NON_CORE_TABLES_REVIEW_2026-01-29.pdf'

CORE_TABLES = {
    'public.users',
    'public.user_memberships',
    'public.user_moderation',
    'public.user_access_status',
    'public.user_activity_log',
    'public.user_notifications',
}


def count_rows_from_dump(path: Path):
    counts = defaultdict(int)
    if not path.exists():
        raise SystemExit(f'Dump not found: {path}')
    lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith('COPY '):
            m = re.match(r'^COPY\s+([^\s]+)\s*\((.*)\)\s+FROM\s+stdin;\s*$', line)
            if m:
                table_name = m.group(1)
                i += 1
                while i < len(lines):
                    row = lines[i]
                    if row == '\\.':
                        break
                    counts[table_name] += 1
                    i += 1
        i += 1
    return counts


def has_reference_in_code(table_name: str) -> bool:
    schema, table = table_name.split('.', 1)
    candidates = [
        table_name,
        f'"{schema}"."{table}"',
        f'{schema}."{table}"',
        f'"{schema}".{table}',
    ]
    search_roots = [root / 'src', root / 'server.js']
    code_paths = []
    for ext in ('*.ts', '*.tsx', '*.js', '*.sql'):
        for base in search_roots:
            if base.is_dir():
                code_paths.extend(base.glob(f'**/{ext}'))
            elif base.is_file() and base.suffix in {'.js', '.ts', '.tsx', '.sql'}:
                code_paths.append(base)
    for path in code_paths:
        try:
            content = path.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        for candidate in candidates:
            if candidate in content:
                return True
    return False


def classify_domain(table_name: str) -> str:
    name = table_name.split('.', 1)[1]
    if table_name.startswith('neon_auth.'):
        return 'Auth'
    if name.startswith('hangar_'):
        return 'HangarShare'
    if name.startswith('classified_') or name.endswith('_listings') or name.startswith('listing_'):
        return 'Classificados/Marketplace'
    if name.startswith('career_'):
        return 'Carreiras'
    if name.startswith('forum_'):
        return 'Fórum'
    if name in {'membership_plans'}:
        return 'Assinaturas'
    if name in {'airport_icao', 'flight_logs'}:
        return 'Planejamento/Logbook'
    if name in {'portal_analytics'}:
        return 'Analytics'
    if name in {'companies', 'partnerships', 'contracts', 'compliance_records'}:
        return 'Empresas/Parcerias'
    if name in {'financial_transactions', 'invoices', 'coupon_redemptions', 'coupons'}:
        return 'Financeiro'
    if name in {'bookings', 'hangar_bookings'}:
        return 'Reservas'
    if name in {'email_logs', 'storage_alerts', 'admin_activity_log', 'business_activity_log'}:
        return 'Operações'
    if name in {'pgmigrations'}:
        return 'Infra'
    if name in {'notifications'}:
        return 'Notificações'
    return 'Outros'


counts = count_rows_from_dump(dump_path)

candidates = []
for table, total in counts.items():
    if total <= 0:
        continue
    if table in CORE_TABLES:
        continue
    if has_reference_in_code(table):
        continue
    candidates.append((table, total, classify_domain(table)))

candidates.sort(key=lambda x: (x[2], x[0]))

# Markdown report
lines = []
lines.append('# Revisão de Tabelas Não-Core (com dados e sem referência no código) — 2026-01-29')
lines.append('')
lines.append(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
lines.append('')
lines.append('Critério: tabelas com linhas no dump e sem referência textual no código (src/ + server.js).')
lines.append('')
lines.append('| Tabela | Linhas | Domínio sugerido | Observação |')
lines.append('| --- | --- | --- | --- |')
for table, total, domain in candidates:
    lines.append(f'| {table} | {total} | {domain} | Revisar uso real |')
lines.append('')

md_out_path.write_text('\n'.join(lines), encoding='utf-8')

# PDF report (single-page oriented)
styles = getSampleStyleSheet()
small = styles['BodyText'].clone('Small')
small.fontSize = 6
small.leading = 6.8
small.wordWrap = 'CJK'
small.splitLongWords = True

pdf = SimpleDocTemplate(
    str(pdf_out_path),
    pagesize=landscape(A4),
    leftMargin=1.0 * cm,
    rightMargin=1.0 * cm,
    topMargin=0.8 * cm,
    bottomMargin=0.8 * cm,
)

story = []
story.append(Paragraph('Revisão de Tabelas Não-Core (dados sem referência no código)', styles['Title']))
story.append(Paragraph(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', styles['Normal']))
story.append(Spacer(1, 6))

pdf_table = [
    [
        Paragraph('Tabela', small),
        Paragraph('Linhas', small),
        Paragraph('Domínio sugerido', small),
        Paragraph('Observação', small),
    ]
]

for table, total, domain in candidates:
    pdf_table.append([
        Paragraph(table, small),
        Paragraph(str(total), small),
        Paragraph(domain, small),
        Paragraph('Revisar uso real', small),
    ])

col_widths = [10.5 * cm, 2.2 * cm, 7.0 * cm, 6.5 * cm]

table = Table(pdf_table, colWidths=col_widths)
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
    ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
    ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('LEFTPADDING', (0, 0), (-1, -1), 2),
    ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ('TOPPADDING', (0, 0), (-1, -1), 1),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
]))

story.append(table)

pdf.build(story)

print(f'Markdown report created: {md_out_path}')
print(f'PDF report created: {pdf_out_path}')

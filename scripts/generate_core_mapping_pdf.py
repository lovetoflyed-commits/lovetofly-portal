import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime

from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
out_path = root / 'docs' / 'records' / 'active' / 'DB_CORE_TABLES_MAPPING_2026-01-29.pdf'

CORE_TABLES = {
    'public.users',
    'public.user_memberships',
    'public.user_moderation',
    'public.user_access_status',
    'public.user_activity_log',
    'public.user_notifications',
}


def find_read_write(table_names):
    reads = defaultdict(set)
    writes = defaultdict(set)
    code_paths = []
    search_roots = [root / 'src', root / 'server.js']
    for ext in ('*.ts', '*.tsx', '*.js', '*.sql'):
        for base in search_roots:
            if base.is_dir():
                code_paths.extend(base.glob(f'**/{ext}'))
            elif base.is_file() and base.suffix in {'.js', '.ts', '.tsx', '.sql'}:
                code_paths.append(base)
    for path in code_paths:
        rel = path.relative_to(root)
        try:
            content = path.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        for name in table_names:
            if name in content:
                if re.search(rf'(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+{re.escape(name)}', content, re.IGNORECASE):
                    writes[name].add(str(rel))
                if re.search(rf'(SELECT|FROM|JOIN)\s+{re.escape(name)}', content, re.IGNORECASE):
                    reads[name].add(str(rel))
    return reads, writes


def escape_text(value):
    text = '' if value is None else str(value)
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def format_paths(paths, max_items=10, max_chars=450):
    if not paths:
        return 'Não identificado'
    shown = list(paths)[:max_items]
    escaped = [escape_text(p) for p in shown]
    text = '<br/>'.join(escaped)
    if len(text) > max_chars:
        text = text[:max_chars] + '…'
    extra = len(paths) - len(shown)
    if extra > 0:
        text += f'<br/>… e mais {extra} arquivo(s)'
    return text


def wrap_text(value, style):
    safe = escape_text(value)
    return Paragraph(safe, style)


styles = getSampleStyleSheet()
small = styles['BodyText'].clone('Small')
small.fontSize = 6
small.leading = 6.8
small.wordWrap = 'CJK'
small.splitLongWords = True

reads_map, writes_map = find_read_write(CORE_TABLES)


doc = SimpleDocTemplate(
    str(out_path),
    pagesize=landscape(A4),
    leftMargin=1.2 * cm,
    rightMargin=1.2 * cm,
    topMargin=1.0 * cm,
    bottomMargin=1.0 * cm,
)

story = []

story.append(Paragraph('Mapeamento de Uso — Tabelas Core (A4)', styles['Title']))
story.append(Paragraph(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', styles['Normal']))
story.append(Spacer(1, 12))

table_data = [
    [wrap_text('Tabela', small), wrap_text('Leituras (SELECT/JOIN)', small), wrap_text('Escritas (INSERT/UPDATE/DELETE)', small)],
]

for table in sorted(CORE_TABLES):
    reads = sorted(reads_map.get(table, []))
    writes = sorted(writes_map.get(table, []))
    table_data.append([
        wrap_text(table, small),
        Paragraph(format_paths(reads), small),
        Paragraph(format_paths(writes), small),
    ])

t = Table(table_data, colWidths=[5.2 * cm, 11.5 * cm, 11.5 * cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
    ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
    ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('LEFTPADDING', (0, 0), (-1, -1), 3),
    ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ('TOPPADDING', (0, 0), (-1, -1), 2),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
]))
story.append(t)

story.append(Spacer(1, 6))
story.append(Paragraph('Observação: lista truncada para caber em uma única página A4.', small))


doc.build(story)
print(f'PDF report created: {out_path}')

from pathlib import Path
from datetime import datetime

from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
md_path = root / 'docs' / 'records' / 'active' / 'DB_NAV_ORDER_CHECKLIST_2026-01-30.md'
pdf_path = root / 'docs' / 'records' / 'active' / 'DB_NAV_ORDER_CHECKLIST_2026-01-30.pdf'

if not md_path.exists():
    raise SystemExit(f'Checklist not found: {md_path}')

styles = getSampleStyleSheet()
small = styles['BodyText'].clone('Small')
small.fontSize = 6
small.leading = 6.8
small.wordWrap = 'CJK'
small.splitLongWords = True

pdf = SimpleDocTemplate(
    str(pdf_path),
    pagesize=landscape(A4),
    leftMargin=1.0 * cm,
    rightMargin=1.0 * cm,
    topMargin=0.8 * cm,
    bottomMargin=0.8 * cm,
)

lines = md_path.read_text(encoding='utf-8').splitlines()

table_rows = [[Paragraph('Seção / Item', small), Paragraph('Status / Observação', small)]]
current_section = ''

for raw in lines:
    line = raw.strip()
    if line.startswith('## '):
        current_section = line.replace('## ', '').strip()
        table_rows.append([Paragraph(f'<b>{current_section}</b>', small), Paragraph('', small)])
        continue
    if line.startswith('### '):
        subsection = line.replace('### ', '').strip()
        table_rows.append([Paragraph(f'&nbsp;&nbsp;<b>{subsection}</b>', small), Paragraph('', small)])
        continue
    if line.startswith('- ['):
        status = 'Concluído' if line.startswith('- [x]') else 'Pendente'
        item_text = line.replace('- [x]', '').replace('- [ ]', '').strip()
        table_rows.append([Paragraph(f'&nbsp;&nbsp;• {item_text}', small), Paragraph(status, small)])
        continue
    if line.startswith('- '):
        note = line.replace('- ', '').strip()
        if table_rows:
            table_rows.append([Paragraph('&nbsp;&nbsp;&nbsp;&nbsp;' + note, small), Paragraph('', small)])

story = []
story.append(Paragraph('Checklist — Ordem de Navegação', styles['Title']))
story.append(Paragraph(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', styles['Normal']))
story.append(Spacer(1, 6))

table = Table(table_rows, colWidths=[18.5 * cm, 8.5 * cm])
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
print(f'PDF checklist created: {pdf_path}')

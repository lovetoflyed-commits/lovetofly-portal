from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from datetime import datetime
from pathlib import Path

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
dump_path = root / 'db' / 'lovetofly-portal-full-dump.sql'
out_path = root / 'db' / 'lovetofly-portal-db-report.pdf'

if not dump_path.exists():
    raise SystemExit(f'Dump not found: {dump_path}')

page_width, page_height = A4
left_margin = 1.5 * cm
right_margin = 1.5 * cm
top_margin = 1.5 * cm
bottom_margin = 1.5 * cm
usable_width = page_width - left_margin - right_margin

font_name = 'Courier'
font_size = 9
max_chars = int(usable_width / (font_size * 0.6))  # rough monospace width

c = canvas.Canvas(str(out_path), pagesize=A4)

# Cover page
c.setFont('Helvetica-Bold', 16)
c.drawString(left_margin, page_height - top_margin - 16, 'Lovetofly-Portal Database Report')

c.setFont('Helvetica', 10)
meta_y = page_height - top_margin - 36
lines = [
    f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}',
    f'Source dump: {dump_path}',
    f'Dump size: {dump_path.stat().st_size / 1024:.1f} KB',
    'Contents: Full schema and data dump from local PostgreSQL database.',
    'Note: This PDF includes the entire SQL dump below for printing/archive.'
]
for line in lines:
    c.drawString(left_margin, meta_y, line)
    meta_y -= 14

c.showPage()

# Body: dump content
c.setFont(font_name, font_size)
text = c.beginText(left_margin, page_height - top_margin)

with dump_path.open('r', encoding='utf-8', errors='replace') as f:
    for raw_line in f:
        line = raw_line.rstrip('\n')
        # wrap long lines
        while len(line) > max_chars:
            part = line[:max_chars]
            text.textLine(part)
            line = line[max_chars:]
            if text.getY() <= bottom_margin:
                c.drawText(text)
                c.showPage()
                c.setFont(font_name, font_size)
                text = c.beginText(left_margin, page_height - top_margin)
        text.textLine(line)
        if text.getY() <= bottom_margin:
            c.drawText(text)
            c.showPage()
            c.setFont(font_name, font_size)
            text = c.beginText(left_margin, page_height - top_margin)

c.drawText(text)
c.save()

print(f'PDF report created: {out_path}')

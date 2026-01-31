import re
from typing import Any, List
from pathlib import Path
from collections import defaultdict
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
dump_path = root / 'db' / 'lovetofly-portal-full-dump.sql'
out_path = root / 'docs' / 'records' / 'active' / 'DB_CORE_TABLES_CONTENT_2026-01-29.pdf'

CORE_TABLES = {
    'public.users',
    'public.user_memberships',
    'public.user_moderation',
    'public.user_access_status',
    'public.user_activity_log',
    'public.user_notifications',
}

if not dump_path.exists():
    raise SystemExit(f'Dump not found: {dump_path}')


def unescape_pg(value: str) -> str:
    return (
        value.replace('\\\\', '\\')
        .replace('\\t', '\t')
        .replace('\\n', '\n')
        .replace('\\r', '\r')
        .replace('\\b', '\b')
        .replace('\\f', '\f')
        .replace('\\v', '\v')
    )


def parse_dump(path: Path):
    schema = {}
    data = defaultdict(list)
    lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith('CREATE TABLE '):
            table_name = line.split('CREATE TABLE ')[1].split(' (')[0].strip()
            columns = []
            i += 1
            while i < len(lines):
                l = lines[i].rstrip()
                if l == ');':
                    break
                l = l.strip()
                if not l or l.startswith('CONSTRAINT') or l.startswith('PRIMARY KEY') or l.startswith('UNIQUE') or l.startswith('FOREIGN KEY'):
                    i += 1
                    continue
                if l.endswith(','):
                    l = l[:-1]
                parts = l.split()
                col_name = parts[0].strip('"')
                col_type = ' '.join(parts[1:])
                columns.append((col_name, col_type))
                i += 1
            schema[table_name] = columns
        elif line.startswith('COPY '):
            m = re.match(r'^COPY\s+([^\s]+)\s*\((.*)\)\s+FROM\s+stdin;\s*$', line)
            if m:
                table_name = m.group(1)
                cols = [c.strip().strip('"') for c in m.group(2).split(',')]
                i += 1
                while i < len(lines):
                    row = lines[i]
                    if row == '\\.':
                        break
                    raw_vals = row.split('\t')
                    vals = [None if v == '\\N' else unescape_pg(v) for v in raw_vals]
                    data[table_name].append(dict(zip(cols, vals)))
                    i += 1
        i += 1
    return schema, data


def find_table_usage(table_names):
    usage = defaultdict(list)
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
                usage[name].append(str(rel))
    return usage


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
                if re.search(rf'(SELECT|FROM)\s+{re.escape(name)}', content, re.IGNORECASE):
                    reads[name].add(str(rel))
    return reads, writes


def find_migration_sources(table_names):
    migrations = defaultdict(list)
    for path in (root / 'src' / 'migrations').glob('*.sql'):
        content = path.read_text(encoding='utf-8', errors='ignore')
        for name in table_names:
            if re.search(rf'CREATE\s+TABLE\s+{re.escape(name)}\b', content):
                migrations[name].append(path.name)
    return migrations


def infer_type_meaning(raw_type: str) -> str:
    t = raw_type.lower()
    if 'uuid' in t:
        return 'Identificador único (código do registro).'
    if 'bigint' in t or 'bigserial' in t:
        return 'Número inteiro grande (contagem/ID).'
    if 'smallint' in t:
        return 'Número inteiro pequeno.'
    if 'integer' in t or 'serial' in t or t.startswith('int'):
        return 'Número inteiro (sem casas decimais).'
    if 'numeric' in t or 'decimal' in t:
        return 'Número com casas decimais (ex.: valores).'
    if 'real' in t or 'double' in t or 'float' in t:
        return 'Número com casas decimais (aproximado).'
    if 'boolean' in t or t == 'bool':
        return 'Valor verdadeiro/falso (sim/não).'
    if 'timestamp' in t or 'timestamptz' in t or 'time' in t:
        return 'Data e hora.'
    if t == 'date':
        return 'Data (sem horário).'
    if 'json' in t:
        return 'Estrutura de dados (lista/objetos).'
    if 'text' in t or 'varchar' in t or 'character' in t:
        return 'Texto (palavras/frases).'
    if 'bytea' in t:
        return 'Arquivo/dados binários.'
    return 'Tipo de dado específico do banco.'


def wrap_text(value, style):
    max_chars = 400
    text = '' if value is None else str(value)
    if len(text) > max_chars:
        text = text[:max_chars] + '… (conteúdo longo)'
    safe = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return Paragraph(safe, style)


def chunk_list(items, size):
    for i in range(0, len(items), size):
        yield items[i:i + size]


schema, data_rows = parse_dump(dump_path)
usage_map = find_table_usage(CORE_TABLES)
reads_map, writes_map = find_read_write(CORE_TABLES)
migration_map = find_migration_sources(CORE_TABLES)

styles = getSampleStyleSheet()
small = styles['Normal'].clone('Small')
small.fontSize = 6
small.leading = 7


doc = SimpleDocTemplate(
    str(out_path),
    pagesize=A4,
    leftMargin=1.5 * cm,
    rightMargin=1.5 * cm,
    topMargin=1.5 * cm,
    bottomMargin=1.5 * cm,
)

story = []

story.append(Paragraph('Relatório Core (A4) — 2026-01-29', styles['Title']))
story.append(Paragraph(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', styles['Normal']))
story.append(Paragraph('Escopo: tabelas core do portal', styles['Normal']))
story.append(Spacer(1, 12))

for table in sorted(CORE_TABLES):
    columns = schema.get(table, [])
    rows = data_rows.get(table, [])
    usage = usage_map.get(table, [])
    reads = sorted(reads_map.get(table, []))
    writes = sorted(writes_map.get(table, []))
    created_in = migration_map.get(table, ['Não identificado'])

    story.append(Paragraph(f'Tabela: {table}', styles['Heading2']))

    meta_table = Table([
        ['Criação (migrações)', wrap_text(', '.join(created_in), styles['Normal'])],
        ['Uso no frontend/API', wrap_text(', '.join(usage) if usage else 'Não identificado', styles['Normal'])],
        ['Somente leitura (busca)', wrap_text(', '.join(reads) if reads else 'Não identificado', styles['Normal'])],
        ['Escrita (insere/atualiza)', wrap_text(', '.join(writes) if writes else 'Não identificado', styles['Normal'])],
        ['Observações', wrap_text('Tabela core: validar uso real antes de qualquer remoção.', styles['Normal'])],
    ], colWidths=[5 * cm, 11 * cm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # Schema
    schema_table_data: List[List[Any]] = [[
        wrap_text('Campo', styles['Normal']),
        wrap_text('Tipo', styles['Normal']),
        wrap_text('Significado', styles['Normal']),
    ]]
    for col, col_type in columns:
        schema_table_data.append([
            wrap_text(col, styles['Normal']),
            wrap_text(col_type, styles['Normal']),
            wrap_text(infer_type_meaning(col_type), styles['Normal']),
        ])
    schema_table = Table(schema_table_data, colWidths=[5 * cm, 5 * cm, 6 * cm])
    schema_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(Paragraph('Campos e tipos (linguagem simples)', styles['Heading3']))
    story.append(schema_table)
    story.append(Spacer(1, 8))

    # Data
    story.append(Paragraph('Dados armazenados', styles['Heading3']))
    if rows:
        cols_order = [c for c, _ in columns]
        max_cols_per_table = 6
        for col_chunk in chunk_list(cols_order, max_cols_per_table):
            story.append(Paragraph(f'Colunas: {", ".join(col_chunk)}', styles['Normal']))
            data_table = [[wrap_text(c, small) for c in col_chunk]]
            for row in rows:
                data_table.append([wrap_text(row.get(c, ''), small) for c in col_chunk])
            total_cols = max(len(col_chunk), 1)
            data_col_width = (16 * cm) / total_cols
            col_widths = [data_col_width] * total_cols
            table = Table(data_table, repeatRows=1, colWidths=col_widths)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
                ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('WORDWRAP', (0, 0), (-1, -1), 'CJK'),
            ]))
            story.append(table)
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph('Sem dados.', styles['Normal']))

    story.append(PageBreak())

story.append(Paragraph('Observações finais', styles['Heading2']))
story.append(Paragraph(
    'Relatório gerado para impressão em A4. Os campos longos foram resumidos para evitar sobreposição. '
    'Recomenda-se validar manualmente as tabelas com poucos dados antes de mudanças estruturais.',
    styles['Normal']
))


doc.build(story)
print(f'PDF report created: {out_path}')

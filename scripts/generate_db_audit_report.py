import re
from datetime import datetime
from pathlib import Path
from collections import defaultdict

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
dump_path = root / 'db' / 'lovetofly-portal-full-dump.sql'
out_path = root / 'db' / 'lovetofly-portal-db-audit-report.pdf'

if not dump_path.exists():
    raise SystemExit(f'Dump not found: {dump_path}')

# Helpers

def unescape_pg(value: str) -> str:
    # Unescape pg_dump COPY format
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
    tables = {}
    data = defaultdict(list)
    copy_columns = {}

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
                # column line: name type [constraints],
                if l.endswith(','):
                    l = l[:-1]
                parts = l.split()
                col_name = parts[0].strip('"')
                col_type = ' '.join(parts[1:])
                columns.append((col_name, col_type))
                i += 1
            tables[table_name] = columns
        elif line.startswith('COPY '):
            # COPY public.table (col1, col2, ...) FROM stdin;
            m = re.match(r'^COPY\s+([^\s]+)\s*\((.*)\)\s+FROM\s+stdin;\s*$', line)
            if m:
                table_name = m.group(1)
                cols = [c.strip().strip('"') for c in m.group(2).split(',')]
                copy_columns[table_name] = cols
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
    return tables, data, copy_columns


def find_table_usage(table_names):
    usage = defaultdict(list)
    code_paths = []
    for ext in ('*.ts', '*.tsx', '*.js', '*.sql'):
        code_paths.extend(root.glob(f'**/{ext}'))
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


def find_migration_sources(table_names):
    migrations = defaultdict(list)
    for path in (root / 'src' / 'migrations').glob('*.sql'):
        content = path.read_text(encoding='utf-8', errors='ignore')
        for name in table_names:
            if re.search(rf'CREATE\s+TABLE\s+{re.escape(name)}\b', content):
                migrations[name].append(path.name)
    return migrations


def infer_purpose(name: str):
    n = name.lower()
    if 'user' in n and 'notification' in n:
        return 'Guarda avisos enviados aos usuários.'
    if 'admin_task' in n:
        return 'Guarda tarefas internas da equipe e itens de checklist.'
    if 'admin' in n and 'message' in n:
        return 'Guarda mensagens internas da equipe/admin.'
    if 'audit' in n or 'log' in n:
        return 'Guarda registros de auditoria/atividade para rastreabilidade.'
    if 'hangar' in n:
        return 'Guarda dados do HangarShare (donos, anúncios, reservas etc.).'
    if 'career' in n:
        return 'Guarda dados de carreira/avaliações e progresso.'
    if 'course' in n:
        return 'Guarda dados de cursos e treinamentos.'
    if 'stripe' in n or 'payment' in n:
        return 'Guarda dados de pagamentos/transações.'
    if 'session' in n or 'auth' in n:
        return 'Guarda dados de autenticação e sessões.'
    return 'Guarda dados de uma área específica do sistema.'


def infer_activity_status(rows, columns):
    if not rows:
        return 'Sem atividade (nenhuma linha encontrada)'
    # Attempt to infer latest activity by timestamp columns
    time_cols = [c for c in columns if any(t in c for t in ('created_at', 'updated_at', 'last_', 'date'))]
    latest = None
    if time_cols:
        for row in rows:
            for c in time_cols:
                v = row.get(c)
                if v:
                    try:
                        # best-effort parse
                        dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                        if not latest or dt > latest:
                            latest = dt
                    except Exception:
                        pass
    if latest:
        return f'Ativa (última atividade: {latest.isoformat()})'
    return 'Ativa (há dados armazenados)'


def infer_type_meaning(raw_type: str) -> str:
    t = raw_type.lower()
    if 'uuid' in t:
        return 'Identificador único (um “código” para identificar um registro).'
    if 'bigint' in t or 'bigserial' in t:
        return 'Número inteiro grande (contagem/ID).'
    if 'smallint' in t:
        return 'Número inteiro pequeno (opções simples).'
    if 'integer' in t or 'serial' in t or t.startswith('int'):
        return 'Número inteiro (sem casas decimais).'
    if 'numeric' in t or 'decimal' in t:
        return 'Número com casas decimais (ex.: valores financeiros).'
    if 'real' in t or 'double' in t or 'float' in t:
        return 'Número com casas decimais (aproximado).'
    if 'boolean' in t or t == 'bool':
        return 'Valor verdadeiro/falso (sim/não).'
    if 'timestamp' in t or 'timestamptz' in t or 'time' in t:
        return 'Data e hora.'
    if t == 'date':
        return 'Data (sem horário).'
    if 'json' in t:
        return 'Estrutura de dados em formato JSON (lista/objetos).'
    if 'text' in t or 'varchar' in t or 'character' in t:
        return 'Texto (palavras/frases).'
    if 'bytea' in t:
        return 'Arquivo/dados binários.'
    return 'Tipo de dado específico do banco de dados.'


def jaccard(a, b):
    sa, sb = set(a), set(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def wrap_text(value, style):
    max_chars = 500
    text = '' if value is None else str(value)
    if len(text) > max_chars:
        text = text[:max_chars] + '… (conteúdo muito longo; ver dump completo)'
    safe = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return Paragraph(safe, style)


def chunk_list(items, size):
    for i in range(0, len(items), size):
        yield items[i:i + size]


# Parse data
schema, data_rows, copy_columns = parse_dump(dump_path)
table_names = sorted(schema.keys())
usage_map = find_table_usage(table_names)
migration_map = find_migration_sources(table_names)

# Similar table analysis
similar_pairs = []
for i, t1 in enumerate(table_names):
    cols1 = [c for c, _ in schema.get(t1, [])]
    for t2 in table_names[i + 1:]:
        cols2 = [c for c, _ in schema.get(t2, [])]
        sim = jaccard(cols1, cols2)
        if sim >= 0.6:
            similar_pairs.append((t1, t2, sim))

unused_tables = [t for t in table_names if not usage_map.get(t)]

# Build PDF
styles = getSampleStyleSheet()
small_style = styles['Normal'].clone('Small')
small_style.fontSize = 6
small_style.leading = 7

doc = SimpleDocTemplate(
    str(out_path),
    pagesize=A4,
    leftMargin=1.5 * cm,
    rightMargin=1.5 * cm,
    topMargin=1.5 * cm,
    bottomMargin=1.5 * cm,
)

story = []

story.append(Paragraph('Relatório de Auditoria do Banco de Dados (Lovetofly-Portal)', styles['Title']))
story.append(Paragraph(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', styles['Normal']))
story.append(Paragraph(f'Origem dos dados: {dump_path}', styles['Normal']))
story.append(Spacer(1, 12))

story.append(Paragraph('Resumo de Compreensão das Instruções', styles['Heading2']))
story.append(Paragraph(
    'Este relatório foi criado para pessoas sem conhecimento técnico. '
    'Ele apresenta as informações do banco de dados de forma limpa e em tabelas, sem comandos. '
    'Para cada tabela, listamos o nome da tabela, os campos, o tipo de dado e o significado desse tipo '
    'em linguagem simples, além de todo o conteúdo armazenado. '
    'Também descrevemos para que a tabela serve, onde ela é usada no sistema, o status de atividade, '
    'o contexto de criação e uma análise de inconsistências, duplicidades e melhorias estruturais.',
    styles['Normal'],
))
story.append(PageBreak())

for table_name in table_names:
    columns = schema.get(table_name, [])
    rows = data_rows.get(table_name, [])
    usage = usage_map.get(table_name, [])
    created_in = migration_map.get(table_name, ['Unknown'])
    purpose = infer_purpose(table_name)
    status = infer_activity_status(rows, [c for c, _ in columns])

    story.append(Paragraph(f'Tabela: {table_name}', styles['Heading2']))

    meta_table = Table([
        ['Utilidade (para que serve)', wrap_text(purpose, styles['Normal'])],
        ['Onde é usada no sistema (arquivos do front)', wrap_text(', '.join(usage) if usage else 'Não identificado no código', styles['Normal'])],
        ['Status de atividade', wrap_text(status, styles['Normal'])],
        ['Criada em (migrações)', wrap_text(', '.join(created_in), styles['Normal'])],
    ], colWidths=[5 * cm, 11 * cm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # Schema table
    schema_table_data = [['Campo (nome)', 'Tipo de dado', 'Significado do tipo']]
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
    story.append(Paragraph('Estrutura da Tabela (campos e tipos)', styles['Heading3']))
    story.append(schema_table)
    story.append(Spacer(1, 8))

    # Data table
    story.append(Paragraph('Dados armazenados (completo)', styles['Heading3']))
    if rows:
        cols_order = [c for c, _ in columns]
        max_cols_per_table = 6
        for col_chunk in chunk_list(cols_order, max_cols_per_table):
            story.append(Paragraph(
                f'Colunas: {", ".join(col_chunk)}',
                styles['Normal']
            ))
            data_table = [[wrap_text(c, small_style) for c in col_chunk]]
            for row in rows:
                data_table.append([wrap_text(row.get(c, ''), small_style) for c in col_chunk])
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
        story.append(Paragraph('Nenhum dado encontrado.', styles['Normal']))

    story.append(PageBreak())

# Analysis sections
story.append(Paragraph('Análise de Consistência e Otimização', styles['Heading2']))

if unused_tables:
    story.append(Paragraph('Tabelas possivelmente sem uso (sem referência no código):', styles['Heading3']))
    story.append(Paragraph(', '.join(unused_tables), styles['Normal']))
else:
    story.append(Paragraph('Não foram detectadas tabelas sem uso pelo código.', styles['Normal']))

story.append(Spacer(1, 8))

if similar_pairs:
    story.append(Paragraph('Tabelas possivelmente similares/duplicadas (similaridade ≥ 60%):', styles['Heading3']))
    sim_data = [['Tabela A', 'Tabela B', 'Similaridade']]
    for a, b, sim in sorted(similar_pairs, key=lambda x: -x[2]):
        sim_data.append([a, b, f'{sim:.0%}'])
    sim_table = Table(sim_data, colWidths=[6 * cm, 6 * cm, 3 * cm])
    sim_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(sim_table)
else:
    story.append(Paragraph('Não foram detectadas tabelas com alta similaridade.', styles['Normal']))

story.append(Spacer(1, 8))

story.append(Paragraph('Possíveis conflitos entre tabelas e funcionalidades', styles['Heading3']))
if similar_pairs:
    story.append(Paragraph(
        'Revise pares de tabelas similares em que apenas uma é citada no código. '
        'Se a tabela “gêmea” possui dados, confirme se o sistema deveria usá-la para evitar conflitos.',
        styles['Normal']
    ))
else:
    story.append(Paragraph('Não foram detectados conflitos evidentes com base na análise.', styles['Normal']))

story.append(Spacer(1, 12))

story.append(Paragraph('Plano recomendado para um banco de dados leve e eficiente', styles['Heading2']))
plan_points = [
    'Validar tabelas sem uso com os responsáveis; arquivar ou remover após confirmar que nada depende delas.',
    'Consolidar tabelas que tenham o mesmo significado de negócio; migrar dados e ajustar consultas.',
    'Padronizar colunas de data/hora para rastrear atividade de forma consistente.',
    'Garantir que APIs e telas leiam e gravem apenas na tabela correta (a “fonte oficial”).',
    'Manter índices e regras somente onde realmente ajudam as consultas; evitar duplicações.',
    'Criar um dicionário de dados explicando cada tabela e quem é responsável por ela.',
]
for p in plan_points:
    story.append(Paragraph(f'• {p}', styles['Normal']))

story.append(PageBreak())

story.append(Paragraph('Observações de Integridade do Relatório', styles['Heading2']))
story.append(Paragraph(
    'Este relatório foi gerado a partir do dump local do PostgreSQL, sem incluir comandos SQL. '
    'Todas as tabelas, estruturas e dados estão apresentados em formato de tabela para impressão e auditoria. '
    'Campos com conteúdo extremamente longo foram resumidos para caber na página; '
    'o dump completo mantém 100% do conteúdo original.',
    styles['Normal']
))

# Build

doc.build(story)

print(f'PDF report created: {out_path}')

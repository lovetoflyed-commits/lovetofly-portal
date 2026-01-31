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
out_path = root / 'db' / 'lovetofly-portal-db-improvement-report.pdf'

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
    tables = {}
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
            tables[table_name] = columns
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
    return tables, data


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


def jaccard(a, b):
    sa, sb = set(a), set(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


schema, data_rows = parse_dump(dump_path)
table_names = sorted(schema.keys())
usage_map = find_table_usage(table_names)

# Stats
row_counts = {t: len(data_rows.get(t, [])) for t in table_names}
unused_tables = [t for t in table_names if not usage_map.get(t)]

similar_pairs = []
for i, t1 in enumerate(table_names):
    cols1 = [c for c, _ in schema.get(t1, [])]
    for t2 in table_names[i + 1:]:
        cols2 = [c for c, _ in schema.get(t2, [])]
        sim = jaccard(cols1, cols2)
        if sim >= 0.6:
            similar_pairs.append((t1, t2, sim))

# Build report
styles = getSampleStyleSheet()
small = styles['Normal'].clone('Small')
small.fontSize = 9
small.leading = 11


doc = SimpleDocTemplate(
    str(out_path),
    pagesize=A4,
    leftMargin=1.5 * cm,
    rightMargin=1.5 * cm,
    topMargin=1.5 * cm,
    bottomMargin=1.5 * cm,
)

story = []

story.append(Paragraph('Relatório de Melhorias do Banco de Dados (Lovetofly-Portal)', styles['Title']))
story.append(Paragraph(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', styles['Normal']))
story.append(Paragraph(f'Base analisada: {dump_path}', styles['Normal']))
story.append(Spacer(1, 12))

story.append(Paragraph('Resumo Executivo (linguagem simples)', styles['Heading2']))
story.append(Paragraph(
    'Este relatório apresenta uma análise objetiva do banco de dados atual e recomendações práticas '
    'para torná-lo mais simples, preciso e eficiente, sem perder desempenho nem funcionalidade. '
    'O foco é reduzir duplicidades, manter apenas o necessário e garantir que cada funcionalidade '
    'use a tabela correta.',
    styles['Normal']
))

story.append(PageBreak())

# Inventory
story.append(Paragraph('Inventário e Saúde Geral', styles['Heading2']))
inv_table = Table([
    ['Total de tabelas', str(len(table_names))],
    ['Tabelas com dados', str(sum(1 for t in table_names if row_counts.get(t, 0) > 0))],
    ['Tabelas sem dados', str(sum(1 for t in table_names if row_counts.get(t, 0) == 0))],
    ['Tabelas sem referência no código', str(len(unused_tables))],
], colWidths=[9 * cm, 7 * cm])
inv_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
    ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
    ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
]))
story.append(inv_table)

story.append(Spacer(1, 12))

story.append(Paragraph('Possíveis duplicidades ou sobreposição', styles['Heading3']))
if similar_pairs:
    sim_data = [['Tabela A', 'Tabela B', 'Similaridade (colunas)']]
    for a, b, sim in sorted(similar_pairs, key=lambda x: -x[2]):
        sim_data.append([a, b, f'{sim:.0%}'])
    sim_table = Table(sim_data, colWidths=[6 * cm, 6 * cm, 4 * cm])
    sim_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(sim_table)
else:
    story.append(Paragraph('Não foram detectadas tabelas com alta similaridade.', styles['Normal']))

story.append(PageBreak())

# Issues
story.append(Paragraph('Principais Pontos de Atenção', styles['Heading2']))
issues = []
if unused_tables:
    issues.append('Existem tabelas sem referência no código, indicando possível obsolescência ou funcionalidade abandonada.')
if similar_pairs:
    issues.append('Há tabelas muito parecidas que podem gerar confusão sobre qual é a tabela “oficial”.')
if not unused_tables and not similar_pairs:
    issues.append('Não foram encontrados problemas estruturais evidentes com base no dump e no código.')

for item in issues:
    story.append(Paragraph(f'• {item}', styles['Normal']))

story.append(Spacer(1, 12))

# Recommendations
story.append(Paragraph('Recomendações para um banco mais preciso, simples e eficiente', styles['Heading2']))
recommendations = [
    'Validar cada tabela sem uso com as equipes responsáveis e remover/arquivar as que não têm função ativa.',
    'Escolher uma única tabela oficial quando houver duplicidade e migrar os dados da outra.',
    'Definir um “dicionário de dados” para explicar cada tabela, evitando uso incorreto no futuro.',
    'Padronizar campos de datas e identificadores para facilitar auditoria e desempenho.',
    'Revisar consultas do sistema para garantir que cada funcionalidade use a tabela correta.',
    'Manter somente índices necessários para as consultas mais comuns, evitando excesso de índices.',
]
for item in recommendations:
    story.append(Paragraph(f'• {item}', styles['Normal']))

story.append(Spacer(1, 12))

story.append(Paragraph('Plano de Ação (enxuto e seguro)', styles['Heading2']))
plan = [
    '1) Mapear e confirmar tabelas sem uso com o time.',
    '2) Definir tabelas oficiais por funcionalidade e atualizar o código.',
    '3) Migrar dados redundantes e eliminar duplicidades.',
    '4) Criar documentação simples e de fácil consulta.',
    '5) Monitorar desempenho após as mudanças e ajustar índices se necessário.',
]
for step in plan:
    story.append(Paragraph(step, styles['Normal']))

story.append(PageBreak())

story.append(Paragraph('Observações finais', styles['Heading2']))
story.append(Paragraph(
    'Este relatório foi gerado automaticamente a partir do conteúdo atual do banco local. '
    'Ele não altera dados nem estrutura. Para mudanças, recomenda-se validação com o time e backups.',
    styles['Normal']
))

# Build

doc.build(story)

print(f'PDF report created: {out_path}')

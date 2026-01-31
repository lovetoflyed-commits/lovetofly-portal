import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
dump_path = root / 'db' / 'lovetofly-portal-full-dump.sql'
out_path = root / 'docs' / 'records' / 'active' / 'DB_VALIDATION_REPORT_2026-01-29.md'

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
    data_counts = defaultdict(int)
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
                i += 1
                while i < len(lines):
                    row = lines[i]
                    if row == '\\.':
                        break
                    data_counts[table_name] += 1
                    i += 1
        i += 1
    return tables, data_counts


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


if not dump_path.exists():
    raise SystemExit(f'Dump not found: {dump_path}')

schema, row_counts = parse_dump(dump_path)
all_tables = sorted(schema.keys())
usage_map = find_table_usage(all_tables)

lines = []
lines.append('# Validação de Tabelas — 2026-01-29')
lines.append('')
lines.append(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
lines.append('')
lines.append('## Critérios de validação')
lines.append('- Existe uso no código (referência textual)')
lines.append('- Existe dado na tabela (contagem no dump)')
lines.append('- Priorizar tabelas com dados e sem referência para revisão manual')
lines.append('')
lines.append('## Resultado resumido')
lines.append('')
lines.append('| Tabela | Linhas (dump) | Referência no código | Status sugerido | Evidência |')
lines.append('| --- | --- | --- | --- | --- |')

for table in all_tables:
    count = row_counts.get(table, 0)
    usage = usage_map.get(table, [])
    has_usage = 'Sim' if usage else 'Não'
    if count == 0 and not usage:
        status = 'Candidata a arquivar (sem dados e sem uso)'
    elif count > 0 and not usage:
        status = 'Revisar (há dados, sem uso no código)'
    elif count == 0 and usage:
        status = 'Revisar (referenciada, mas sem dados)'
    else:
        status = 'Manter (há dados e uso)'
    evidence = ', '.join(usage[:3]) if usage else 'Sem referência encontrada'
    lines.append(f'| {table} | {count} | {has_usage} | {status} | {evidence} |')

out_path.write_text('\n'.join(lines), encoding='utf-8')
print(f'Wrote {out_path}')

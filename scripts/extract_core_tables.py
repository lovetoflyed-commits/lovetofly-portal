import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
dump_path = root / 'db' / 'lovetofly-portal-full-dump.sql'
out_path = root / 'docs' / 'records' / 'active' / 'DB_CORE_TABLES_CONTENT_2026-01-29.md'

CORE_TABLES = {
    'public.users',
    'public.user_memberships',
    'public.user_moderation',
    'public.user_access_status',
    'public.user_activity_log',
    'public.user_notifications',
}

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


if not dump_path.exists():
    raise SystemExit(f'Dump not found: {dump_path}')

schema, data_rows = parse_dump(dump_path)

lines = []
lines.append('# Conteúdo das Tabelas Core — 2026-01-29')
lines.append('')
lines.append(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
lines.append('')

for table in sorted(CORE_TABLES):
    columns = schema.get(table, [])
    rows = data_rows.get(table, [])
    lines.append(f'## {table}')
    lines.append(f'Total de linhas: {len(rows)}')
    lines.append('')
    if not columns:
        lines.append('_Tabela não encontrada no dump._')
        lines.append('')
        continue
    col_names = [c for c, _ in columns]
    lines.append('| ' + ' | '.join(col_names) + ' |')
    lines.append('| ' + ' | '.join(['---'] * len(col_names)) + ' |')
    if rows:
        for row in rows:
            lines.append('| ' + ' | '.join([str(row.get(c, '')) for c in col_names]) + ' |')
    else:
        lines.append('| _Sem dados_ |')
    lines.append('')

out_path.write_text('\n'.join(lines), encoding='utf-8')
print(f'Wrote {out_path}')

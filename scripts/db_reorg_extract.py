import re
from pathlib import Path
from collections import defaultdict

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
dump_path = root / 'db' / 'lovetofly-portal-full-dump.sql'
out_path = root / 'db' / 'db_reorg_summary.txt'

if not dump_path.exists():
    raise SystemExit('Dump not found')

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
                    data[table_name].append(dict(zip(cols, raw_vals)))
                    i += 1
        i += 1
    return tables, data

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

def jaccard(a, b):
    sa, sb = set(a), set(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)

schema, data_rows = parse_dump(dump_path)
table_names = sorted(schema.keys())
usage_map = find_table_usage(table_names)
unused_tables = [t for t in table_names if not usage_map.get(t)]

similar_pairs = []
for i, t1 in enumerate(table_names):
    cols1 = [c for c, _ in schema.get(t1, [])]
    for t2 in table_names[i + 1:]:
        cols2 = [c for c, _ in schema.get(t2, [])]
        sim = jaccard(cols1, cols2)
        if sim >= 0.6:
            similar_pairs.append((t1, t2, sim))

lines = []
lines.append('UNUSED_TABLES')
lines.extend(unused_tables)
lines.append('SIMILAR_PAIRS')
for a, b, sim in sorted(similar_pairs, key=lambda x: -x[2]):
    lines.append(f'{a}|{b}|{sim:.2f}')

out_path.write_text('\n'.join(lines), encoding='utf-8')
print(f'Wrote {out_path}')

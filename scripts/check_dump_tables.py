import re
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
dump_path = root / 'db' / 'lovetofly-portal-full-dump.sql'
out_path = root / 'docs' / 'records' / 'active' / 'DB_NAV_ORDER_DUMP_CHECK_2026-01-30.md'

TABLES = [
    'public.hangar_photos',
    'public.forum_topic_likes',
    'public.forum_reply_likes',
    'public.user_documents',
    'public.traslados_requests',
    'public.traslados_messages',
    'public.traslados_service_fees',
    'public.traslados_operation_updates',
    'public.traslados_pilots',
    'public.traslados_pilot_documents',
]

if not dump_path.exists():
    raise SystemExit(f'Dump not found: {dump_path}')

lines = dump_path.read_text(encoding='utf-8', errors='replace').splitlines()

counts: Dict[str, Optional[int]] = {t: None for t in TABLES}

for i, line in enumerate(lines):
    if line.startswith('COPY '):
        m = re.match(r'^COPY\s+([^\s]+)\s*\((.*)\)\s+FROM\s+stdin;\s*$', line)
        if not m:
            continue
        table = m.group(1)
        if table in counts:
            # count rows until \\.
            row_count = 0
            j = i + 1
            while j < len(lines):
                if lines[j] == '\\.':
                    break
                row_count += 1
                j += 1
            counts[table] = row_count

lines_out = []
lines_out.append('# Verificação de Tabelas no Dump — 2026-01-30')
lines_out.append('')
lines_out.append(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
lines_out.append('')
lines_out.append('| Tabela | Linhas no dump | Observação |')
lines_out.append('| --- | --- | --- |')
for table in TABLES:
    count = counts[table]
    if count is None:
        lines_out.append(f'| {table} | não encontrada | Sem seção COPY no dump |')
    else:
        lines_out.append(f'| {table} | {count} | OK |')
lines_out.append('')

out_path.write_text('\n'.join(lines_out), encoding='utf-8')
print(f'Wrote {out_path}')

from pathlib import Path
from datetime import datetime

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
out_path = root / 'docs' / 'records' / 'active' / 'PROJECT_ROUTE_INVENTORY_2026-01-29.md'

page_files = sorted(root.glob('src/app/**/page.tsx'))
route_files = sorted(root.glob('src/app/**/route.ts'))

def to_route(path: Path):
    rel = path.relative_to(root / 'src' / 'app')
    parts = list(rel.parts)
    if parts[-1] in {'page.tsx', 'route.ts'}:
        parts = parts[:-1]
    route = '/' + '/'.join(parts)
    route = route.replace('/(auth)', '').replace('/(public)', '')
    return route.replace('/index', '') or '/'

pages = sorted({to_route(p) for p in page_files})
routes = sorted({to_route(r) for r in route_files})

lines = []
lines.append('# Inventário de Rotas — 2026-01-29')
lines.append('')
lines.append(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
lines.append('')
lines.append('## Páginas (App Router)')
for p in pages:
    lines.append(f'- {p}')
lines.append('')
lines.append('## Rotas de API')
for r in routes:
    lines.append(f'- {r}')

out_path.write_text('\n'.join(lines), encoding='utf-8')
print(f'Wrote {out_path}')

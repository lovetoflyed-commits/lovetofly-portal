import re
import time
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote
from urllib.error import URLError, HTTPError

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
source = root / 'docs' / 'records' / 'active' / 'PROJECT_ROUTE_INVENTORY_2026-01-29.md'
out_path = root / 'docs' / 'records' / 'active' / 'PROJECT_ROUTE_CONTENT_REPORT_2026-01-29.md'

LOCAL_BASE = 'http://localhost:3000'
PROD_BASE = 'https://lovetofly.com.br'

if not source.exists():
    raise SystemExit(f'Route inventory not found: {source}')


def extract_routes(path: Path):
    routes = []
    in_pages = False
    for line in path.read_text(encoding='utf-8', errors='replace').splitlines():
        if line.strip().startswith('## Páginas'):
            in_pages = True
            continue
        if line.strip().startswith('## Rotas'):
            in_pages = False
        if in_pages and line.strip().startswith('- '):
            routes.append(line.strip()[2:])
    return routes


def is_public_route(route: str) -> bool:
    if route == '/':
        return True
    if '[' in route or ']' in route:
        return False
    if route.startswith('/admin'):
        return False
    if route.startswith('/staff'):
        return False
    if route.startswith('/owner'):
        return False
    if route.startswith('/profile'):
        return False
    return True


def fetch(url: str):
    headers = {
        'User-Agent': 'Lovetofly-Audit/1.0',
        'Accept': 'text/html,application/xhtml+xml',
    }
    req = Request(url, headers=headers)
    try:
        with urlopen(req, timeout=15) as resp:
            status = resp.getcode()
            html = resp.read().decode('utf-8', errors='replace')
            return status, html
    except HTTPError as e:
        return e.code, ''
    except URLError:
        return None, ''


def extract_title(html: str) -> str:
    match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    if not match:
        return ''
    return re.sub(r'\s+', ' ', match.group(1)).strip()


def extract_h1(html: str) -> str:
    match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
    if not match:
        return ''
    text = re.sub(r'<[^>]+>', ' ', match.group(1))
    return re.sub(r'\s+', ' ', text).strip()


def extract_snippet(html: str) -> str:
    text = re.sub(r'<script[\s\S]*?</script>', ' ', html, flags=re.IGNORECASE)
    text = re.sub(r'<style[\s\S]*?</style>', ' ', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:200]


routes = [r for r in extract_routes(source) if is_public_route(r)]

rows = []
for route in routes:
    safe_route = quote(route, safe='/')
    local_url = f'{LOCAL_BASE}{safe_route}'
    prod_url = f'{PROD_BASE}{safe_route}'

    local_status, local_html = fetch(local_url)
    local_title = extract_title(local_html) if local_html else ''
    local_h1 = extract_h1(local_html) if local_html else ''

    time.sleep(0.2)

    prod_status, prod_html = fetch(prod_url)
    prod_title = extract_title(prod_html) if prod_html else ''
    prod_h1 = extract_h1(prod_html) if prod_html else ''

    note = ''
    if local_status is None:
        note = 'Local indisponível'
    elif prod_status is None:
        note = 'Produção indisponível'

    rows.append({
        'route': route,
        'local_status': str(local_status) if local_status is not None else 'ERR',
        'local_title': local_title,
        'local_h1': local_h1,
        'prod_status': str(prod_status) if prod_status is not None else 'ERR',
        'prod_title': prod_title,
        'prod_h1': prod_h1,
        'note': note,
    })

lines = []
lines.append('# Relatório de Conteúdo por Rota — 2026-01-29')
lines.append('')
lines.append(f'Gerado em: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
lines.append('')
lines.append('Base local: http://localhost:3000')
lines.append('Base produção: https://lovetofly.com.br')
lines.append('')
lines.append('## Rotas públicas verificadas')
lines.append('')
lines.append('| Rota | Local (status) | Local (título) | Local (H1) | Produção (status) | Produção (título) | Produção (H1) | Observação |')
lines.append('| --- | --- | --- | --- | --- | --- | --- | --- |')
for r in rows:
    lines.append(
        f"| {r['route']} | {r['local_status']} | {r['local_title']} | {r['local_h1']} | {r['prod_status']} | {r['prod_title']} | {r['prod_h1']} | {r['note']} |"
    )

out_path.write_text('\n'.join(lines), encoding='utf-8')
print(f'Wrote {out_path}')

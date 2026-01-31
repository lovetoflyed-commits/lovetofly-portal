from pathlib import Path
import shutil

root = Path('/Users/edsonassumpcao/Desktop/lovetofly-portal')
records = root / 'docs' / 'records'

keep_root = {
    'README.md',
    'AGENT_START_HERE.md',
}

active_files = {
    'DB_REORG_TASKS_2026-01-29.md': records / 'active',
    'PROJECT_STATUS_TODO_AND_FLIGHTTOOLS_ANALYSIS_2026-01-28.md': records / 'active',
    'FUNCTIONALITY_REPORT_2026-01-28.md': records / 'active',
}

role_prefixes = {
    'ADMIN_': records / 'roles' / 'admin',
    'STAFF_': records / 'roles' / 'ops',
    'USER_': records / 'roles' / 'product',
}

def categorize(name: str, suffix: str) -> Path:
    upper = name.upper()
    if ' 2.' in name:
        return records / 'archive' / 'duplicates'
    if name in active_files:
        return active_files[name]
    for prefix, dest in role_prefixes.items():
        if upper.startswith(prefix):
            return dest
    if suffix == '.txt':
        return records / 'logs'
    if 'HANGARSHARE' in upper:
        return records / 'hangarshare'
    if 'CAREER' in upper:
        return records / 'careers'
    if 'NOTIFICATION' in upper:
        return records / 'notifications'
    if 'SECURITY' in upper:
        return records / 'security'
    if 'FINANCIAL' in upper or 'FINANCE' in upper:
        return records / 'finance'
    if 'DEPLOY' in upper:
        return records / 'deployment'
    if 'TEST' in upper or 'TESTING' in upper:
        return records / 'testing'
    if 'AUDIT' in upper:
        return records / 'audits'
    if 'REPORT' in upper or 'SUMMARY' in upper:
        return records / 'reports'
    if 'PLAN' in upper or 'ROADMAP' in upper or 'CHECKLIST' in upper or 'TASK' in upper or 'TODO' in upper or 'PRIORITY' in upper:
        return records / 'plans'
    if 'GUIDE' in upper or 'MANUAL' in upper or 'QUICK_START' in upper or 'QUICK_REFERENCE' in upper:
        return records / 'guides'
    if 'LEGAL' in upper or 'TERMO' in upper or 'NDA' in upper or 'LGPD' in upper or 'PESQUISA_DISPONIBILIDADE' in upper:
        return records / 'legal'
    if 'MARKETING' in upper or 'BRAND' in upper or 'COMPETITIVE' in upper:
        return records / 'marketing'
    return records / 'misc'

moved = []
for item in root.iterdir():
    if not item.is_file():
        continue
    if item.name in keep_root:
        continue
    if item.suffix.lower() not in {'.md', '.pdf', '.txt'}:
        continue

    dest_dir = categorize(item.name, item.suffix.lower())
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / item.name
    shutil.move(str(item), str(dest))
    moved.append((item.name, dest))

for name, dest in moved:
    print(f'MOVED {name} -> {dest}')

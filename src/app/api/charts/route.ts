import { NextResponse } from 'next/server';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

type ChartEntry = { name: string; type: string; path: string; size: number };
type Manifest = Record<string, { type: string; files: { name: string; size: number }[] }[]>;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const icaoRaw = (searchParams.get('icao') || '').trim().toUpperCase();

    if (!/^[A-Z]{4}$/.test(icaoRaw)) {
      return NextResponse.json({ message: 'ICAO inválido' }, { status: 400 });
    }

    const chartsDir = join(process.cwd(), 'public', 'charts', icaoRaw);
    const cdnBase = (process.env.CHARTS_CDN_URL || '').replace(/\/$/, '');
    let charts: ChartEntry[] = [];

    // If a CDN base is provided, try to use a prebuilt manifest from the CDN.
    if (cdnBase) {
      try {
        const manifestUrl = `${cdnBase}/charts-manifest.json`;
        const res = await fetch(manifestUrl, { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as { manifest?: Manifest } | Manifest;
          const manifest: Manifest = 'manifest' in data ? (data as any).manifest : (data as any);
          const icaoEntries = manifest[icaoRaw] || [];
          for (const entry of icaoEntries) {
            for (const f of entry.files) {
              charts.push({
                name: f.name,
                type: entry.type,
                path: `${cdnBase}/charts/${icaoRaw}/${entry.type}/${f.name}`,
                size: f.size ?? 0
              });
            }
          }
          return NextResponse.json({ icao: icaoRaw, count: charts.length, charts, source: 'cdn' }, { status: 200 });
        }
      } catch (e) {
        // Fallback to local filesystem below
      }
    }

    try {
      const subdirs = readdirSync(chartsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const subdir of subdirs) {
        const subdirPath = join(chartsDir, subdir);
        const files = readdirSync(subdirPath, { withFileTypes: true })
          .filter(f => f.isFile() && f.name.endsWith('.pdf'));

        for (const file of files) {
          const filePath = join(subdirPath, file.name);
          const stat = statSync(filePath);
          charts.push({
            name: file.name,
            type: subdir,
            path: `/charts/${icaoRaw}/${subdir}/${file.name}`,
            size: stat.size
          });
        }
      }
    } catch (err) {
      // Directory doesn't exist or is empty
    }

    return NextResponse.json({ icao: icaoRaw, count: charts.length, charts, source: 'local' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar cartas:', error);
    return NextResponse.json({ message: 'Erro ao buscar cartas' }, { status: 500 });
  }
}

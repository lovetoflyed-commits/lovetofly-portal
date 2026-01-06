import { NextResponse } from 'next/server';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const icaoRaw = (searchParams.get('icao') || '').trim().toUpperCase();

    if (!/^[A-Z]{4}$/.test(icaoRaw)) {
      return NextResponse.json({ message: 'ICAO inválido' }, { status: 400 });
    }

    const chartsDir = join(process.cwd(), 'public', 'charts', icaoRaw);
    let charts: { name: string; type: string; path: string; size: number }[] = [];

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

    return NextResponse.json({ icao: icaoRaw, count: charts.length, charts }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar cartas:', error);
    return NextResponse.json({ message: 'Erro ao buscar cartas' }, { status: 500 });
  }
}

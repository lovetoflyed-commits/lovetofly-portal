import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const icaoRaw = (searchParams.get('icao') || '').trim().toUpperCase();

    if (!/^[A-Z]{4}$/.test(icaoRaw)) {
      return NextResponse.json({ message: 'ICAO inválido' }, { status: 400 });
    }

    // Try the new AWC API host first, then legacy as fallback. If both 403, return empty gracefully.
    const awcCandidates = [
      `https://api.aviationweather.gov/adds/dataserver_current/httpparam?datasource=notams&requestType=retrieve&format=JSON&location=${icaoRaw}`,
      `https://www.aviationweather.gov/adds/dataserver_current/httpparam?datasource=notams&requestType=retrieve&format=JSON&location=${icaoRaw}`
    ];

    let json: any = null;
    let lastStatus = 0;

    for (const url of awcCandidates) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'LoveToFlyPortal/1.0 (+https://lovetofly.portal)',
            Accept: 'application/json'
          },
          next: { revalidate: 600 }
        });
        lastStatus = res.status;
        if (res.ok) {
          json = await res.json();
          break;
        }
      } catch (err) {
        // Network/resolve error, move to next candidate
        lastStatus = 0;
      }
      // If 403 or other non-OK, try next candidate; loop continues
    }

    if (!json) {
      return NextResponse.json({ icao: icaoRaw, count: 0, notams: [], message: `NOTAMs indisponíveis (status ${lastStatus || 'rede/host'})` }, { status: 200 });
    }
    // ADDS response shape can vary a bit; normalize into a concise array
    const items = (json?.data?.notams || json?.data?.NOTAM || json?.data?.notam || []) as any[];

    const notams = items.map((n: any) => ({
      id: n?.id || n?.notam_id || null,
      location: n?.location || n?.icaoId || icaoRaw,
      text: n?.all || n?.notam || n?.text || n?.message || '',
      start: n?.startTime || n?.effective_begin || n?.effectiveStart || null,
      end: n?.endTime || n?.effective_end || n?.effectiveEnd || null,
      created: n?.issued || n?.created || null,
      type: n?.type || null
    }));

    return NextResponse.json({ icao: icaoRaw, count: notams.length, notams }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar NOTAMs:', error);
    return NextResponse.json({ message: 'Erro ao buscar NOTAMs' }, { status: 500 });
  }
}

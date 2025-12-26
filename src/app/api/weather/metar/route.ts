import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const icao = searchParams.get('icao');

  if (!icao || icao.length !== 4) {
    return NextResponse.json(
      { error: 'Código ICAO inválido' },
      { status: 400 }
    );
  }

  try {
    // Using Aviation Weather Center API (free, no key required)
    const response = await fetch(
      `https://aviationweather.gov/api/data/metar?ids=${icao.toUpperCase()}&format=json`,
      {
        headers: {
          'User-Agent': 'LoveToFlyPortal/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao buscar METAR');
    }

    // Safe parse: some upstream responses may return empty body
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Resposta vazia do provedor METAR' },
        { status: 502 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        { error: 'Resposta inválida do provedor METAR' },
        { status: 502 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Aeroporto não encontrado ou sem dados disponíveis' },
        { status: 404 }
      );
    }

    const metar = data[0];

    // Unit conversions and normalized representation
    const toKm = (sm: number) => Math.round(sm * 1.60934 * 10) / 10; // 1 decimal place

    // Parse cloud layers like SCT025 -> 2500 ft
    const cloudCodes: string[] = metar.rawOb?.match(/(FEW|SCT|BKN|OVC)\d{3}/g) || [];
    const cloudBasesFt: number[] = cloudCodes.map(code => {
      const h = parseInt(code.slice(3), 10);
      return Number.isFinite(h) ? h * 100 : null;
    }).filter((v: number | null): v is number => v !== null);

    const visibilityKm = typeof metar.visib === 'number' ? toKm(metar.visib) : null;

    const parsed = {
      station: metar.icaoId || icao.toUpperCase(),
      raw: metar.rawOb || '',
      time: metar.reportTime || new Date().toISOString(),
      temperature: Number.isFinite(metar.temp) ? { value: metar.temp, repr: String(metar.temp) } : null, // °C
      dewpoint: Number.isFinite(metar.dwpt) ? { value: metar.dwpt, repr: String(metar.dwpt) } : null, // °C
      wind_direction: Number.isFinite(metar.wdir) ? { value: metar.wdir, repr: String(metar.wdir) } : null, // degrees
      wind_speed: Number.isFinite(metar.wspd) ? { value: metar.wspd, repr: String(metar.wspd) } : null, // KT
      wind_gust: Number.isFinite(metar.wgst) ? { value: metar.wgst, repr: String(metar.wgst) } : null, // KT
      visibility: visibilityKm !== null ? { value: visibilityKm, repr: String(visibilityKm) } : null, // KM
      altimeter: Number.isFinite(metar.altim) ? { value: metar.altim, repr: String(metar.altim) } : null, // inHg
      ceiling: metar.cldCvg1 && Number.isFinite(metar.cldBas1) ? { value: metar.cldBas1 * 100 } : null, // ft
      flight_category: metar.fltcat || 'VFR',
      clouds: cloudBasesFt, // array of base heights in feet
    };

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('METAR fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar dados meteorológicos' },
      { status: 500 }
    );
  }
}

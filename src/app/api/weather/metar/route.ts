import { NextRequest, NextResponse } from 'next/server';

type ParsedMetar = {
  station: string;
  raw: string;
  time: string;
  temperature: { value: number; repr: string } | null;
  dewpoint: { value: number; repr: string } | null;
  wind_direction: { value: number; repr: string } | null;
  wind_speed: { value: number; repr: string } | null;
  wind_gust: { value: number; repr: string } | null;
  visibility: { value: number; repr: string } | null;
  altimeter: { value: number; repr: string } | null;
  ceiling: { value: number } | null;
  flight_category: string;
  clouds: number[];
};

const parseAwcMetar = (metar: any, icao: string): ParsedMetar => {
  const toKm = (sm: number) => Math.round(sm * 1.60934 * 10) / 10; // 1 decimal place

  const cloudCodes: string[] = metar.rawOb?.match(/(FEW|SCT|BKN|OVC)\d{3}/g) || [];
  const cloudBasesFt: number[] = cloudCodes
    .map(code => {
      const h = parseInt(code.slice(3), 10);
      return Number.isFinite(h) ? h * 100 : null;
    })
    .filter((v: number | null): v is number => v !== null);

  const visibilityKm = typeof metar.visib === 'number' ? toKm(metar.visib) : null;

  return {
    station: metar.icaoId || icao.toUpperCase(),
    raw: metar.rawOb || '',
    time: metar.reportTime || new Date().toISOString(),
    temperature: Number.isFinite(metar.temp) ? { value: metar.temp, repr: String(metar.temp) } : null,
    dewpoint: Number.isFinite(metar.dwpt) ? { value: metar.dwpt, repr: String(metar.dwpt) } : null,
    wind_direction: Number.isFinite(metar.wdir) ? { value: metar.wdir, repr: String(metar.wdir) } : null,
    wind_speed: Number.isFinite(metar.wspd) ? { value: metar.wspd, repr: String(metar.wspd) } : null,
    wind_gust: Number.isFinite(metar.wgst) ? { value: metar.wgst, repr: String(metar.wgst) } : null,
    visibility: visibilityKm !== null ? { value: visibilityKm, repr: String(visibilityKm) } : null,
    altimeter: Number.isFinite(metar.altim) ? { value: metar.altim, repr: String(metar.altim) } : null,
    ceiling: metar.cldCvg1 && Number.isFinite(metar.cldBas1) ? { value: metar.cldBas1 * 100 } : null,
    flight_category: metar.fltcat || 'VFR',
    clouds: cloudBasesFt,
  };
};

const parseNoaaFallback = (text: string, icao: string): ParsedMetar | null => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const timestamp = lines[0]; // e.g. 2024/05/11 14:00
  const raw = lines[1];
  const isoTime = new Date(`${timestamp} UTC`).toISOString();

  return {
    station: icao.toUpperCase(),
    raw,
    time: isoTime,
    temperature: null,
    dewpoint: null,
    wind_direction: null,
    wind_speed: null,
    wind_gust: null,
    visibility: null,
    altimeter: null,
    ceiling: null,
    flight_category: 'N/A',
    clouds: [],
  };
};

async function fetchFromAwc(icao: string): Promise<ParsedMetar | null> {
  const response = await fetch(
    `https://aviationweather.gov/api/data/metar?ids=${icao.toUpperCase()}&format=json`,
    {
      headers: {
        'User-Agent': 'LoveToFlyPortal/1.0',
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) return null;

  const text = await response.text();
  if (!text || text.trim().length === 0) return null;

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }

  if (!data || data.length === 0) return null;
  return parseAwcMetar(data[0], icao);
}

async function fetchFromNoaa(icao: string): Promise<ParsedMetar | null> {
  const response = await fetch(
    `https://tgftp.nws.noaa.gov/data/observations/metar/stations/${icao.toUpperCase()}.TXT`,
    {
      headers: { 'User-Agent': 'LoveToFlyPortal/1.0' },
    }
  );

  if (!response.ok) return null;
  const text = await response.text();
  if (!text || text.trim().length === 0) return null;

  return parseNoaaFallback(text, icao);
}

// --- TAF helpers ---
const parseNoaaTaf = (text: string): string | null => {
  const lines = text.split('\n').map(l => l.trim());
  const filtered = lines.filter(Boolean);
  if (filtered.length < 2) return null;
  // Drop timestamp header, keep remaining lines joined preserving new lines
  const tafLines = filtered.slice(1);
  return tafLines.join('\n');
};

async function fetchFromNoaaTaf(icao: string): Promise<string | null> {
  const url = `https://tgftp.nws.noaa.gov/data/forecasts/taf/stations/${icao.toUpperCase()}.TXT`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'LoveToFlyPortal/1.0' },
  });
  if (!response.ok) return null;
  const text = await response.text();
  if (!text || text.trim().length === 0) return null;
  return parseNoaaTaf(text);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const icao = searchParams.get('icao');

  if (!icao || icao.length !== 4) {
    return NextResponse.json({ error: 'Código ICAO inválido' }, { status: 400 });
  }

  try {
    const primary = await fetchFromAwc(icao);
    const fallback = primary ? null : await fetchFromNoaa(icao);

    const metarData = primary || fallback;
    if (metarData) {
      // Try to fetch TAF text (best-effort; airport may not have a TAF)
      const tafText = await fetchFromNoaaTaf(icao);
      const responseBody = { ...metarData, taf: tafText || null };
      return NextResponse.json(responseBody);
    }

    return NextResponse.json(
      { error: 'Aeroporto não encontrado ou sem dados disponíveis' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('METAR fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar dados meteorológicos' },
      { status: 500 }
    );
  }
}

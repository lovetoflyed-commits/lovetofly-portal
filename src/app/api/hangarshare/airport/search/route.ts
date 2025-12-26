import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const icaoCode = searchParams.get('icao')?.toUpperCase();

  if (!icaoCode || icaoCode.length < 2) {
    return NextResponse.json(
      { error: 'ICAO code is required (2+ characters)' },
      { status: 400 }
    );
  }

  try {
    // TODO: Connect to database to fetch from airport_icao table
    // For now, return mock data
    const mockAirports: Record<string, any> = {
      'SBSP': {
        icao_code: 'SBSP',
        iata_code: 'GRU',
        airport_name: 'São Paulo/Congonhas',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        is_public: true,
      },
      'SBGR': {
        icao_code: 'SBGR',
        iata_code: 'GRU',
        airport_name: 'São Paulo/Guarulhos',
        city: 'Guarulhos',
        state: 'SP',
        country: 'Brasil',
        is_public: true,
      },
      'SBRJ': {
        icao_code: 'SBRJ',
        iata_code: 'SDU',
        airport_name: 'Rio de Janeiro/Santos Dumont',
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'Brasil',
        is_public: true,
      },
      'SBRF': {
        icao_code: 'SBRF',
        iata_code: 'REC',
        airport_name: 'Recife/Guararapes',
        city: 'Recife',
        state: 'PE',
        country: 'Brasil',
        is_public: true,
      },
      'SBCF': {
        icao_code: 'SBCF',
        iata_code: 'CNF',
        airport_name: 'Belo Horizonte/Pampulha',
        city: 'Belo Horizonte',
        state: 'MG',
        country: 'Brasil',
        is_public: true,
      },
      'SBKT': {
        icao_code: 'SBKT',
        iata_code: 'BSB',
        airport_name: 'Brasília/Presidente Juscelino Kubitschek',
        city: 'Brasília',
        state: 'DF',
        country: 'Brasil',
        is_public: true,
      },
      'SBPA': {
        icao_code: 'SBPA',
        iata_code: 'POA',
        airport_name: 'Porto Alegre/Salgado Filho',
        city: 'Porto Alegre',
        state: 'RS',
        country: 'Brasil',
        is_public: true,
      },
      'SBCT': {
        icao_code: 'SBCT',
        iata_code: 'CWB',
        airport_name: 'Curitiba/Afonso Pena',
        city: 'Curitiba',
        state: 'PR',
        country: 'Brasil',
        is_public: true,
      },
    };

    const airport = mockAirports[icaoCode];

    if (!airport) {
      return NextResponse.json(
        { error: 'Airport not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(airport);
  } catch (error) {
    console.error('Error fetching airport:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

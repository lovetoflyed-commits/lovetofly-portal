import { NextResponse } from 'next/server';

/**
 * GET /api/address/cep?code=01310100
 * 
 * Proxy endpoint for viaCEP API
 * Avoids CORS issues and allows for caching/monitoring
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cep = searchParams.get('code');

    // Validate CEP format
    if (!cep) {
      return NextResponse.json(
        { error: 'CEP code is required' },
        { status: 400 }
      );
    }

    // Remove non-numeric characters
    const cleanCep = cep.replace(/\D/g, '');

    // Validate CEP length
    if (cleanCep.length !== 8) {
      return NextResponse.json(
        { error: 'CEP must have 8 digits' },
        { status: 400 }
      );
    }

    // Call viaCEP API
    const response = await fetch(
      `https://viacep.com.br/ws/${cleanCep}/json/`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Love-to-Fly-Portal/1.0',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `External API error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();

    // viaCEP returns { erro: true } for not found
    if (data.erro) {
      return NextResponse.json(
        { error: 'CEP not found', notFound: true },
        { status: 404 }
      );
    }

    // Return standardized response
    return NextResponse.json(
      {
        success: true,
        cep: data.cep,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        complement: data.complemento || '',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error('CEP lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, companyName, companyCnpj, bankCode, bankAgency, bankAccount, accountHolderName } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // TODO: Implement database insert into hangar_owners table
    // For now, return mock response
    return NextResponse.json(
      {
        success: true,
        message: 'Anunciante criado com sucesso',
        ownerId: 1,
        data: {
          userId,
          companyName,
          companyCnpj,
          bankCode,
          bankAgency,
          bankAccount,
          accountHolderName,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating owner:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // TODO: Implement database query to fetch all owners
    const mockOwners = [
      {
        id: 1,
        userId: 1,
        companyName: 'Hangar Premium SP',
        email: 'contato@hangarpremium.com.br',
        phone: '(11) 98765-4321',
        isActive: true,
        createdAt: '2025-01-15T10:30:00Z',
        totalHangars: 3,
      },
      {
        id: 2,
        userId: 2,
        companyName: 'Estacionamento Aéreo Mineiro',
        email: 'info@estaeromineiro.com.br',
        phone: '(31) 99999-9999',
        isActive: true,
        createdAt: '2025-01-20T14:20:00Z',
        totalHangars: 1,
      },
    ];

    return NextResponse.json(mockOwners);
  } catch (error) {
    console.error('Error fetching owners:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

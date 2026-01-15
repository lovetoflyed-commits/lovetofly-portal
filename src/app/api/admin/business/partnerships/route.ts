import { NextResponse } from 'next/server';

// Mock partnership data
let partnerships = [
  { id: 1, name: 'AeroTech', type: 'Technology' },
  { id: 2, name: 'SkyFuel', type: 'Fuel Provider' }
];

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // JWT validation (pseudo-code, replace with actual validation)
    // const token = authHeader.split(' ')[1];
    // const user = jwt.verify(token, process.env.JWT_SECRET);
    // if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ partnerships }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // JWT validation (pseudo-code, replace with actual validation)
    // const token = authHeader.split(' ')[1];
    // const user = jwt.verify(token, process.env.JWT_SECRET);
    // if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const newPartner = {
      id: partnerships.length + 1,
      name: body.name,
      type: body.type || 'Other'
    };
    partnerships.push(newPartner);
    return NextResponse.json({ partnership: newPartner }, { status: 201 });
  } catch (error) {
    console.error('Error creating partnership:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // JWT validation (pseudo-code, replace with actual validation)
    // const token = authHeader.split(' ')[1];
    // const user = jwt.verify(token, process.env.JWT_SECRET);
    // if (!user || user.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();
    const idx = partnerships.findIndex(p => p.id === body.id);
    if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    partnerships[idx] = { ...partnerships[idx], ...body };
    return NextResponse.json({ partnership: partnerships[idx] }, { status: 200 });
  } catch (error) {
    console.error('Error editing partnership:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    partnerships = partnerships.filter(p => p.id !== body.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting partnership:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

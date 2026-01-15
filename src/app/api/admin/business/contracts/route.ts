import { NextResponse } from 'next/server';

// Mock contract data
let contracts = [
  { id: 1, name: 'Supplier Agreement', status: 'Active' },
  { id: 2, name: 'Client NDA', status: 'Pending' }
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
    return NextResponse.json({ contracts }, { status: 200 });
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
    const newContract = {
      id: contracts.length + 1,
      name: body.name,
      status: body.status || 'Pending'
    };
    contracts.push(newContract);
    return NextResponse.json({ contract: newContract }, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
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
    const idx = contracts.findIndex(c => c.id === body.id);
    if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    contracts[idx] = { ...contracts[idx], ...body };
    return NextResponse.json({ contract: contracts[idx] }, { status: 200 });
  } catch (error) {
    console.error('Error editing contract:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    contracts = contracts.filter(c => c.id !== body.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

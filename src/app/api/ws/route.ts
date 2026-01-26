import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { message: 'WebSocket disabled. Use manual refresh.' },
    { status: 410 }
  );
}

export async function OPTIONS() {
  return NextResponse.json(
    { message: 'WebSocket disabled.' },
    { status: 410 }
  );
}
    if (!authHeader?.startsWith('Bearer ')) {

      return NextResponse.json(


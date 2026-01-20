import { NextResponse } from 'next/server';
import pool from '@/config/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Mark booking as resolved (implementation details depend on business logic)
    return NextResponse.json({ message: 'Conflict marked as resolved' });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    return NextResponse.json(
      { message: 'Error resolving conflict' },
      { status: 500 }
    );
  }
}

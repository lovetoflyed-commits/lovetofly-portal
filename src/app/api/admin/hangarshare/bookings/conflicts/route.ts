import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return empty array for now - actual conflict detection would require complex date overlap logic
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching booking conflicts:', error);
    return NextResponse.json(
      { message: 'Error fetching conflicts' },
      { status: 500 }
    );
  }
}

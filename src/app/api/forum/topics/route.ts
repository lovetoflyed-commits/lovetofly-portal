import { NextResponse } from 'next/server';
import pool from '@/config/db';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const offset = (page - 1) * limit;

    const params: any[] = [];
    let whereClause = 't.is_deleted = FALSE';

    if (category) {
      whereClause += ` AND t.category = $${params.length + 1}`;
      params.push(category);
    }

    // Combined query with window function for total count
    const query = `
      SELECT 
        t.id,
        t.user_id,
        t.title,
        t.category,
        t.content,
        t.views,
        t.replies_count,
        t.is_pinned,
        t.is_locked,
        t.created_at,
        t.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        COUNT(*) OVER () as total_count
      FROM forum_topics t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE ${whereClause}
      ORDER BY t.is_pinned DESC, t.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    params.push(limit, offset);
    const result = await pool.query(query, params);
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    return NextResponse.json({
      topics: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching forum topics:', error);
    return NextResponse.json(
      { message: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, content, token } = body;

    // Validate required fields
    if (!title || !category || !content || !token) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    const userId = (decoded as any).user_id;

    if (!userId) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Insert topic
    const result = await pool.query(
      `INSERT INTO forum_topics (user_id, title, category, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [userId, title, category, content]
    );

    return NextResponse.json({
      id: result.rows[0].id,
      message: 'Topic created successfully',
      topic: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating forum topic:', error);
    if ((error as any).name === 'JsonWebTokenError') {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create topic' },
      { status: 500 }
    );
  }
}
